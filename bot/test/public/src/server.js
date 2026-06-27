const http = require("node:http");
const { URL } = require("node:url");
const { createPool, ping } = require("./database");
const { sendApnsAlert } = require("./apns");
const {
  createInviteCode,
  normalizeFriendshipPair,
  validateDeviceRegistration,
  validateDirectSignalSend,
  validateInviteAccept,
  validateInviteCreate,
  validatePendingQuery,
  validateSignalSend
} = require("./validation");

const MAX_BODY_BYTES = 32 * 1024;

function createApp(pool) {
  return http.createServer(async (request, response) => {
    try {
      if (!isAuthorized(request)) {
        return sendJson(response, 401, { error: "unauthorized" });
      }

      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return handleHealth(response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/devices/register") {
        return handleDeviceRegister(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/invites/create") {
        return handleInviteCreate(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/invites/accept") {
        return handleInviteAccept(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/signals/send") {
        return handleSignalSend(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/signals/send-direct") {
        return handleDirectSignalSend(request, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/signals/pending") {
        return handleSignalsPending(url, response, pool);
      }

      sendJson(response, 404, { error: "not_found" });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      sendJson(response, statusCode, {
        error: statusCode === 500 ? "internal_error" : "bad_request",
        message: error.message
      });
    }
  });
}

async function handleHealth(response, pool) {
  try {
    const db = await ping(pool);
    sendJson(response, db ? 200 : 503, {
      status: db ? "ok" : "degraded",
      db
    });
  } catch {
    sendJson(response, 503, {
      status: "degraded",
      db: false
    });
  }
}

async function handleDeviceRegister(request, response, pool) {
  const input = validateDeviceRegistration(await readJson(request));
  const result = await pool.query(
    `
      INSERT INTO devices (installation_id, platform, apns_token, app_version)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (installation_id)
      DO UPDATE SET
        apns_token = EXCLUDED.apns_token,
        app_version = EXCLUDED.app_version,
        updated_at = now()
      RETURNING id, installation_id, platform, app_version, created_at, updated_at
    `,
    [input.installationId, input.platform, input.apnsToken, input.appVersion]
  );

  sendJson(response, 200, {
    device: toDevice(result.rows[0])
  });
}

async function handleInviteCreate(request, response, pool) {
  const input = validateInviteCreate(await readJson(request));
  const ownerDevice = input.ownerInstallationId
    ? await findDeviceByInstallationId(pool, input.ownerInstallationId)
    : await ensureDevice(pool, input.ownerDeviceId);

  const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
  let invite;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createInviteCode();
    const result = await pool.query(
      `
        INSERT INTO invite_codes (code, owner_device_id, display_name, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO NOTHING
        RETURNING code, owner_device_id, display_name, expires_at, created_at
      `,
      [code, ownerDevice.id, input.displayName, expiresAt]
    );
    invite = result.rows[0];
    if (invite) {
      break;
    }
  }

  if (!invite) {
    const error = new Error("failed to allocate invite code");
    error.statusCode = 500;
    throw error;
  }

  sendJson(response, 201, { invite: toInvite(invite) });
}

async function handleInviteAccept(request, response, pool) {
  const input = validateInviteAccept(await readJson(request));
  const acceptorDevice = input.acceptorInstallationId
    ? await findDeviceByInstallationId(pool, input.acceptorInstallationId)
    : await ensureDevice(pool, input.acceptorDeviceId);

  const inviteResult = await pool.query(
    `
      SELECT
        invite_codes.code,
        invite_codes.owner_device_id,
        invite_codes.display_name,
        invite_codes.expires_at,
        invite_codes.accepted_at,
        invite_codes.created_at,
        devices.installation_id AS owner_installation_id,
        devices.platform AS owner_platform,
        devices.app_version AS owner_app_version,
        devices.created_at AS owner_created_at,
        devices.updated_at AS owner_updated_at
      FROM invite_codes
      JOIN devices ON devices.id = invite_codes.owner_device_id
      WHERE invite_codes.code = $1
    `,
    [input.code]
  );
  const invite = inviteResult.rows[0];
  if (!invite || invite.accepted_at || new Date(invite.expires_at).getTime() < Date.now()) {
    const error = new Error("invite is invalid or expired");
    error.statusCode = 404;
    throw error;
  }
  if (invite.owner_device_id === acceptorDevice.id) {
    const error = new Error("cannot accept own invite");
    error.statusCode = 400;
    throw error;
  }

  const [deviceAId, deviceBId] = normalizeFriendshipPair(
    invite.owner_device_id,
    acceptorDevice.id
  );
  const friendshipResult = await pool.query(
    `
      INSERT INTO friendships (device_a_id, device_b_id)
      VALUES ($1, $2)
      ON CONFLICT (device_a_id, device_b_id)
      DO UPDATE SET device_a_id = EXCLUDED.device_a_id
      RETURNING id, device_a_id, device_b_id, created_at
    `,
    [deviceAId, deviceBId]
  );

  await pool.query(
    "UPDATE invite_codes SET accepted_at = now() WHERE code = $1",
    [input.code]
  );

  sendJson(response, 200, {
    friendship: toFriendship(friendshipResult.rows[0]),
    peer: toDevice({
      id: invite.owner_device_id,
      installation_id: invite.owner_installation_id,
      platform: invite.owner_platform,
      app_version: invite.owner_app_version,
      created_at: invite.owner_created_at,
      updated_at: invite.owner_updated_at
    }),
    invite: toInvite(invite)
  });
}

async function handleSignalSend(request, response, pool) {
  const input = validateSignalSend(await readJson(request));
  const friendship = await findFriendshipForSender(
    pool,
    input.friendshipId,
    input.senderDeviceId
  );
  const recipientDeviceId = friendship.device_a_id === input.senderDeviceId
    ? friendship.device_b_id
    : friendship.device_a_id;
  const recipientDevice = await ensureDevice(pool, recipientDeviceId);

  return insertAndDeliverSignal(response, pool, {
    friendshipId: input.friendshipId,
    senderDeviceId: input.senderDeviceId,
    recipientDeviceId,
    recipientDevice,
    clientSignalId: input.clientSignalId,
    mood: input.mood,
    thumbnailName: input.thumbnailName,
    attachmentBase64: input.attachmentBase64,
    attachmentMimeType: input.attachmentMimeType,
    attachmentFilename: input.attachmentFilename,
    note: input.note
  });
}

async function handleDirectSignalSend(request, response, pool) {
  const input = validateDirectSignalSend(await readJson(request));
  const senderDevice = await findDeviceByInstallationId(pool, input.senderInstallationId);
  const recipientDevice = await findDeviceByInstallationId(pool, input.recipientInstallationId);

  const [deviceAId, deviceBId] = normalizeFriendshipPair(
    senderDevice.id,
    recipientDevice.id
  );
  const friendshipResult = await pool.query(
    `
      INSERT INTO friendships (device_a_id, device_b_id)
      VALUES ($1, $2)
      ON CONFLICT (device_a_id, device_b_id)
      DO UPDATE SET device_a_id = EXCLUDED.device_a_id
      RETURNING id, device_a_id, device_b_id, created_at
    `,
    [deviceAId, deviceBId]
  );
  const friendship = friendshipResult.rows[0];

  return insertAndDeliverSignal(response, pool, {
    friendshipId: friendship.id,
    senderDeviceId: senderDevice.id,
    recipientDeviceId: recipientDevice.id,
    recipientDevice,
    clientSignalId: input.clientSignalId,
    mood: input.mood,
    thumbnailName: input.thumbnailName,
    attachmentBase64: input.attachmentBase64,
    attachmentMimeType: input.attachmentMimeType,
    attachmentFilename: input.attachmentFilename,
    note: input.note
  });
}

async function insertAndDeliverSignal(response, pool, input) {
  const insertResult = await pool.query(
    `
      INSERT INTO signals (
        friendship_id,
        sender_device_id,
        recipient_device_id,
        client_signal_id,
        mood,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (sender_device_id, client_signal_id)
      WHERE client_signal_id IS NOT NULL
      DO UPDATE SET client_signal_id = EXCLUDED.client_signal_id
      RETURNING id, friendship_id, sender_device_id, recipient_device_id,
        client_signal_id, mood, note, status, created_at
    `,
    [
      input.friendshipId,
      input.senderDeviceId,
      input.recipientDeviceId,
      input.clientSignalId,
      input.mood,
      input.note
    ]
  );
  const signal = insertResult.rows[0];
  const stampMetadata = getStampMetadata(signal.mood, input.thumbnailName);
  const photoAttachment = getPhotoAttachment(input);

  const apnsPayload = {
    aps: {
      alert: {
        title: "missyou",
        body: signal.note || (photoAttachment
          ? "What's upが届きました"
          : `${stampMetadata.title}スタンプが届きました`)
      },
      sound: "default",
      "mutable-content": 1,
      category: "MISSYOU_STAMP"
    },
    signalId: signal.id,
    friendshipId: signal.friendship_id,
    mood: signal.mood,
    moodTitle: stampMetadata.title,
    thumbnailName: stampMetadata.thumbnailName,
    createdAt: signal.created_at
  };
  if (photoAttachment) {
    apnsPayload.attachmentBase64 = photoAttachment.base64;
    apnsPayload.attachmentMimeType = photoAttachment.mimeType;
    apnsPayload.attachmentFilename = photoAttachment.filename;
  }
  const apnsResult = await sendApnsAlert(input.recipientDevice.apns_token, apnsPayload);
  const status = apnsResult.status === "sent"
    ? "push_sent"
    : apnsResult.status === "skipped"
      ? "stored"
      : "push_failed";

  await pool.query(
    `
      UPDATE signals
      SET status = $1, apns_status = $2, apns_response = $3
      WHERE id = $4
    `,
    [status, apnsResult.status, apnsResult, signal.id]
  );

  sendJson(response, 202, {
    signal: {
      ...toSignal(signal),
      status
    },
    delivery: apnsResult
  });
}

function getPhotoAttachment(input) {
  if (!input.attachmentBase64) {
    return null;
  }
  const mimeType = input.attachmentMimeType || "image/jpeg";
  if (!["image/jpeg", "image/png"].includes(mimeType)) {
    return null;
  }
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return {
    base64: input.attachmentBase64,
    mimeType,
    filename: input.attachmentFilename || `whats-up.${extension}`
  };
}

function getStampMetadata(mood, requestedThumbnailName) {
  const metadata = {
    wantToMeet: {
      title: "会いたい",
      thumbnailName: "stamp-want-to-meet"
    },
    littleLonely: {
      title: "少し寂しい",
      thumbnailName: "stamp-little-lonely"
    },
    wantToHear: {
      title: "声が聞きたい",
      thumbnailName: "stamp-want-to-hear"
    },
    thinkingOfYou: {
      title: "思い出した",
      thumbnailName: "stamp-thinking-of-you"
    },
    needHug: {
      title: "ぎゅっと",
      thumbnailName: "stamp-need-hug"
    },
    goodNight: {
      title: "おやすみ",
      thumbnailName: "stamp-good-night"
    }
  }[mood] || {
    title: mood,
    thumbnailName: "stamp-little-lonely"
  };

  return {
    ...metadata,
    thumbnailName: requestedThumbnailName || metadata.thumbnailName
  };
}

async function handleSignalsPending(url, response, pool) {
  const input = validatePendingQuery(url.searchParams);
  const result = await pool.query(
    `
      WITH picked AS (
        SELECT id
        FROM signals
        WHERE recipient_device_id = $1
          AND delivered_at IS NULL
        ORDER BY created_at ASC
        LIMIT $2
      ),
      updated AS (
        UPDATE signals
        SET delivered_at = now()
        WHERE id IN (SELECT id FROM picked)
        RETURNING id, friendship_id, sender_device_id, recipient_device_id,
          client_signal_id, mood, note, status, created_at, delivered_at
      )
      SELECT * FROM updated
      ORDER BY created_at ASC
    `,
    [input.deviceId, input.limit]
  );

  sendJson(response, 200, {
    signals: result.rows.map(toSignal)
  });
}

async function ensureDevice(pool, deviceId) {
  const result = await pool.query(
    "SELECT id, installation_id, platform, apns_token, app_version FROM devices WHERE id = $1",
    [deviceId]
  );
  const device = result.rows[0];
  if (!device) {
    const error = new Error("device not found");
    error.statusCode = 404;
    throw error;
  }
  return device;
}

async function findDeviceByInstallationId(pool, installationId) {
  const result = await pool.query(
    "SELECT id, installation_id, platform, apns_token, app_version FROM devices WHERE installation_id = $1",
    [installationId]
  );
  const device = result.rows[0];
  if (!device) {
    const error = new Error("device not registered");
    error.statusCode = 404;
    throw error;
  }
  return device;
}

async function findFriendshipForSender(pool, friendshipId, senderDeviceId) {
  const result = await pool.query(
    `
      SELECT id, device_a_id, device_b_id, created_at
      FROM friendships
      WHERE id = $1
        AND (device_a_id = $2 OR device_b_id = $2)
    `,
    [friendshipId, senderDeviceId]
  );
  const friendship = result.rows[0];
  if (!friendship) {
    const error = new Error("friendship not found");
    error.statusCode = 404;
    throw error;
  }
  return friendship;
}

async function readJson(request) {
  const body = await readBody(request);
  if (!body) {
    return {};
  }
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        const error = new Error("request body is too large");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function isAuthorized(request) {
  const expected = process.env.PUI_CORE_API_KEY;
  if (!expected) {
    return true;
  }
  return request.headers["x-api-key"] === expected;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function toDevice(row) {
  return {
    id: row.id,
    installationId: row.installation_id,
    platform: row.platform,
    appVersion: row.app_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInvite(row) {
  return {
    code: row.code,
    ownerDeviceId: row.owner_device_id,
    displayName: row.display_name,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

function toFriendship(row) {
  return {
    id: row.id,
    deviceAId: row.device_a_id,
    deviceBId: row.device_b_id,
    createdAt: row.created_at
  };
}

function toSignal(row) {
  return {
    id: row.id,
    friendshipId: row.friendship_id,
    senderDeviceId: row.sender_device_id,
    recipientDeviceId: row.recipient_device_id,
    clientSignalId: row.client_signal_id,
    mood: row.mood,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at
  };
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  const pool = createPool();
  createApp(pool).listen(port, () => {
    console.log(`pui-core test API listening on :${port}`);
  });
}

module.exports = {
  createApp
};
