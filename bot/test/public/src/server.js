const http = require("node:http");
const { URL } = require("node:url");
const { createPool, ping } = require("./database");
const { sendApnsAlert } = require("./apns");
const {
  createInviteCode,
  normalizeFriendshipPair,
  validateDeviceRegistration,
  validateDeviceProfileUpdate,
  validateDirectSignalSend,
  validateFriendsQuery,
  validateInviteAccept,
  validateInviteCreate,
  validatePendingQuery,
  validateSignalDetailQuery,
  validateSignalHistoryQuery,
  validateSignalInboxQuery,
  validateSignalSend
} = require("./validation");

const MAX_BODY_BYTES = 1024 * 1024;

function createApp(pool) {
  return http.createServer(async (request, response) => {
    try {
      if (!isAuthorized(request)) {
        return sendJson(response, 401, { error: "unauthorized" });
      }

      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return await handleHealth(response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/devices/register") {
        return await handleDeviceRegister(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/devices/profile") {
        return await handleDeviceProfile(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/invites/create") {
        return await handleInviteCreate(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/invites/accept") {
        return await handleInviteAccept(request, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/friends") {
        return await handleFriendsList(url, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/signals/send") {
        return await handleSignalSend(request, response, pool);
      }
      if (request.method === "POST" && url.pathname === "/v1/signals/send-direct") {
        return await handleDirectSignalSend(request, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/signals/pending") {
        return await handleSignalsPending(url, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/signals/inbox") {
        return await handleSignalInbox(url, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/signals/history") {
        return await handleSignalHistory(url, response, pool);
      }
      if (request.method === "GET" && url.pathname === "/v1/signals/detail") {
        return await handleSignalDetail(url, response, pool);
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
      INSERT INTO devices (
        installation_id,
        platform,
        apns_token,
        app_version,
        display_name,
        profile_image_base64,
        profile_image_mime_type,
        profile_icon_base64,
        profile_icon_mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (installation_id)
      DO UPDATE SET
        apns_token = EXCLUDED.apns_token,
        app_version = EXCLUDED.app_version,
        display_name = COALESCE(EXCLUDED.display_name, devices.display_name),
        profile_image_base64 = COALESCE(EXCLUDED.profile_image_base64, devices.profile_image_base64),
        profile_image_mime_type = COALESCE(EXCLUDED.profile_image_mime_type, devices.profile_image_mime_type),
        profile_icon_base64 = COALESCE(EXCLUDED.profile_icon_base64, devices.profile_icon_base64),
        profile_icon_mime_type = COALESCE(EXCLUDED.profile_icon_mime_type, devices.profile_icon_mime_type),
        updated_at = now()
      RETURNING id, installation_id, platform, app_version,
        display_name, profile_image_base64, profile_image_mime_type,
        profile_icon_base64, profile_icon_mime_type,
        created_at, updated_at
    `,
    [
      input.installationId,
      input.platform,
      input.apnsToken,
      input.appVersion,
      input.profileDisplayName,
      input.profileImageBase64,
      input.profileImageMimeType,
      input.profileIconBase64,
      input.profileIconMimeType
    ]
  );

  sendJson(response, 200, {
    device: toDevice(result.rows[0])
  });
}

async function handleDeviceProfile(request, response, pool) {
  const input = validateDeviceProfileUpdate(await readJson(request));
  const device = await findDeviceByInstallationId(pool, input.installationId);
  await updateDeviceProfile(pool, device.id, input);
  const updatedDevice = await findDeviceByInstallationId(pool, input.installationId);

  sendJson(response, 200, {
    device: toDevice(updatedDevice)
  });
}

async function handleInviteCreate(request, response, pool) {
  const input = validateInviteCreate(await readJson(request));
  const ownerDevice = input.ownerInstallationId
    ? await findDeviceByInstallationId(pool, input.ownerInstallationId)
    : await ensureDevice(pool, input.ownerDeviceId);

  await updateDeviceProfile(pool, ownerDevice.id, input);

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
      [code, ownerDevice.id, input.displayName || input.profileDisplayName, expiresAt]
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

  await updateDeviceProfile(pool, acceptorDevice.id, input);

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
      devices.display_name AS owner_display_name,
      devices.profile_image_base64 AS owner_profile_image_base64,
      devices.profile_image_mime_type AS owner_profile_image_mime_type,
      devices.profile_icon_base64 AS owner_profile_icon_base64,
      devices.profile_icon_mime_type AS owner_profile_icon_mime_type,
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
      display_name: invite.owner_display_name || invite.display_name,
      profile_image_base64: invite.owner_profile_image_base64,
      profile_image_mime_type: invite.owner_profile_image_mime_type,
      profile_icon_base64: invite.owner_profile_icon_base64,
      profile_icon_mime_type: invite.owner_profile_icon_mime_type,
      created_at: invite.owner_created_at,
      updated_at: invite.owner_updated_at
    }),
    invite: toInvite(invite)
  });
}

async function handleFriendsList(url, response, pool) {
  const input = validateFriendsQuery(url.searchParams);
  const device = await findDeviceByInstallationId(pool, input.installationId);
  const result = await pool.query(
    `
      SELECT
        friendships.id AS friendship_id,
        friendships.device_a_id,
        friendships.device_b_id,
        friendships.created_at AS friendship_created_at,
        peer.id AS peer_id,
        peer.installation_id AS peer_installation_id,
        peer.platform AS peer_platform,
        peer.app_version AS peer_app_version,
        peer.display_name AS peer_display_name,
        peer.profile_image_base64 AS peer_profile_image_base64,
        peer.profile_image_mime_type AS peer_profile_image_mime_type,
        peer.profile_icon_base64 AS peer_profile_icon_base64,
        peer.profile_icon_mime_type AS peer_profile_icon_mime_type,
        peer.created_at AS peer_created_at,
        peer.updated_at AS peer_updated_at
      FROM friendships
      JOIN devices peer
        ON peer.id = CASE
          WHEN friendships.device_a_id = $1 THEN friendships.device_b_id
          ELSE friendships.device_a_id
        END
      WHERE friendships.device_a_id = $1
         OR friendships.device_b_id = $1
      ORDER BY friendships.created_at DESC
    `,
    [device.id]
  );

  sendJson(response, 200, {
    friends: result.rows.map((row) => ({
      friendship: toFriendship({
        id: row.friendship_id,
        device_a_id: row.device_a_id,
        device_b_id: row.device_b_id,
        created_at: row.friendship_created_at
      }),
      peer: toDevice({
        id: row.peer_id,
        installation_id: row.peer_installation_id,
        platform: row.peer_platform,
        app_version: row.peer_app_version,
        display_name: row.peer_display_name,
        profile_image_base64: row.peer_profile_image_base64,
        profile_image_mime_type: row.peer_profile_image_mime_type,
        profile_icon_base64: row.peer_profile_icon_base64,
        profile_icon_mime_type: row.peer_profile_icon_mime_type,
        created_at: row.peer_created_at,
        updated_at: row.peer_updated_at
      })
    }))
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
  const senderDevice = await ensureDevice(pool, input.senderDeviceId);

  return insertAndDeliverSignal(response, pool, {
    friendshipId: input.friendshipId,
    senderDeviceId: input.senderDeviceId,
    recipientDeviceId,
    recipientDevice,
    senderDevice,
    clientSignalId: input.clientSignalId,
    mood: input.mood,
    thumbnailName: input.thumbnailName,
    senderInstallationId: null,
    attachmentBase64: input.attachmentBase64,
    attachmentPreviewBase64: input.attachmentPreviewBase64,
    attachmentPreviewMimeType: input.attachmentPreviewMimeType,
    attachmentMimeType: input.attachmentMimeType,
    attachmentFilename: input.attachmentFilename,
    note: input.note
  });
}

async function handleSignalDetail(url, response, pool) {
  const input = validateSignalDetailQuery(url.searchParams);
  const viewerDevice = await findDeviceByInstallationId(pool, input.installationId);
  await cleanupExpiredSignalAttachments(pool);
  const result = await pool.query(
    `
      SELECT
        signals.id,
        signals.friendship_id,
        signals.sender_device_id,
        signals.recipient_device_id,
        signals.client_signal_id,
        signals.mood,
        signals.note,
        signals.attachment_base64,
        signals.attachment_mime_type,
        signals.attachment_filename,
        signals.attachment_expires_at,
        signals.status,
        signals.created_at,
        signals.delivered_at,
        sender.installation_id AS sender_installation_id,
        sender.display_name AS sender_display_name,
        sender.profile_image_base64 AS sender_profile_image_base64,
        sender.profile_image_mime_type AS sender_profile_image_mime_type,
        sender.profile_icon_base64 AS sender_profile_icon_base64,
        sender.profile_icon_mime_type AS sender_profile_icon_mime_type
      FROM signals
      JOIN devices sender ON sender.id = signals.sender_device_id
      WHERE signals.id = $1
        AND (
          signals.sender_device_id = $2
          OR signals.recipient_device_id = $2
        )
      LIMIT 1
    `,
    [input.signalId, viewerDevice.id]
  );
  const signal = result.rows[0];
  if (!signal) {
    const error = new Error("signal not found");
    error.statusCode = 404;
    throw error;
  }
  if (isSignalAttachmentExpired(signal)) {
    await clearSignalAttachment(pool, signal.id);
    const error = new Error("attachment expired");
    error.statusCode = 410;
    throw error;
  }
  if (signal.attachment_expires_at && !signal.attachment_base64) {
    const error = new Error("attachment unavailable");
    error.statusCode = 410;
    throw error;
  }

  const responseSignal = toSignalWithSender(signal);
  if (signal.recipient_device_id === viewerDevice.id && signal.attachment_base64) {
    await clearSignalAttachment(pool, signal.id);
  }

  sendJson(response, 200, {
    signal: responseSignal
  });
}

async function handleSignalInbox(url, response, pool) {
  const input = validateSignalInboxQuery(url.searchParams);
  const viewerDevice = await findDeviceByInstallationId(pool, input.installationId);
  await cleanupExpiredSignalAttachments(pool);
  const result = await pool.query(
    `
      SELECT
        signals.id,
        signals.friendship_id,
        signals.sender_device_id,
        signals.recipient_device_id,
        signals.client_signal_id,
        signals.mood,
        signals.note,
        signals.attachment_base64,
        signals.attachment_mime_type,
        signals.attachment_filename,
        signals.attachment_expires_at,
        signals.status,
        signals.created_at,
        signals.delivered_at,
        sender.installation_id AS sender_installation_id,
        sender.display_name AS sender_display_name,
        sender.profile_image_base64 AS sender_profile_image_base64,
        sender.profile_image_mime_type AS sender_profile_image_mime_type,
        sender.profile_icon_base64 AS sender_profile_icon_base64,
        sender.profile_icon_mime_type AS sender_profile_icon_mime_type
      FROM signals
      JOIN devices sender ON sender.id = signals.sender_device_id
      WHERE signals.recipient_device_id = $1
      ORDER BY signals.created_at DESC
      LIMIT $2
    `,
    [viewerDevice.id, input.limit]
  );

  sendJson(response, 200, {
    signals: result.rows.map(toSignalWithSenderSummary)
  });
}

async function handleSignalHistory(url, response, pool) {
  const input = validateSignalHistoryQuery(url.searchParams);
  const viewerDevice = await findDeviceByInstallationId(pool, input.installationId);
  await cleanupExpiredSignalAttachments(pool);
  const result = await pool.query(
    `
      SELECT
        signals.id,
        signals.friendship_id,
        signals.sender_device_id,
        signals.recipient_device_id,
        signals.client_signal_id,
        signals.mood,
        signals.note,
        signals.attachment_base64,
        signals.attachment_mime_type,
        signals.attachment_filename,
        signals.attachment_expires_at,
        signals.status,
        signals.created_at,
        signals.delivered_at,
        sender.installation_id AS sender_installation_id,
        sender.display_name AS sender_display_name,
        recipient.installation_id AS recipient_installation_id,
        recipient.display_name AS recipient_display_name
      FROM signals
      JOIN devices sender ON sender.id = signals.sender_device_id
      JOIN devices recipient ON recipient.id = signals.recipient_device_id
      WHERE signals.sender_device_id = $1
         OR signals.recipient_device_id = $1
      ORDER BY signals.created_at DESC
      LIMIT $2
    `,
    [viewerDevice.id, input.limit]
  );

  sendJson(response, 200, {
    signals: result.rows.map((row) => toSignalHistorySummary(row, viewerDevice.id))
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
    senderDevice,
    clientSignalId: input.clientSignalId,
    mood: input.mood,
    thumbnailName: input.thumbnailName,
    senderInstallationId: input.senderInstallationId,
    attachmentBase64: input.attachmentBase64,
    attachmentPreviewBase64: input.attachmentPreviewBase64,
    attachmentPreviewMimeType: input.attachmentPreviewMimeType,
    attachmentMimeType: input.attachmentMimeType,
    attachmentFilename: input.attachmentFilename,
    note: input.note
  });
}

async function insertAndDeliverSignal(response, pool, input) {
  await cleanupExpiredSignalAttachments(pool);
  const attachmentExpiresAt = input.attachmentBase64
    ? new Date(Date.now() + 12 * 60 * 60 * 1000)
    : null;
  const insertResult = await pool.query(
    `
      INSERT INTO signals (
        friendship_id,
        sender_device_id,
        recipient_device_id,
        client_signal_id,
        mood,
        note,
        attachment_base64,
        attachment_mime_type,
        attachment_filename,
        attachment_expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (sender_device_id, client_signal_id)
      WHERE client_signal_id IS NOT NULL
      DO UPDATE SET
        client_signal_id = EXCLUDED.client_signal_id,
        attachment_base64 = COALESCE(EXCLUDED.attachment_base64, signals.attachment_base64),
        attachment_mime_type = COALESCE(EXCLUDED.attachment_mime_type, signals.attachment_mime_type),
        attachment_filename = COALESCE(EXCLUDED.attachment_filename, signals.attachment_filename),
        attachment_expires_at = COALESCE(EXCLUDED.attachment_expires_at, signals.attachment_expires_at)
      RETURNING id, friendship_id, sender_device_id, recipient_device_id,
        client_signal_id, mood, note, attachment_base64, attachment_mime_type,
        attachment_filename, attachment_expires_at, status, created_at
    `,
    [
      input.friendshipId,
      input.senderDeviceId,
      input.recipientDeviceId,
      input.clientSignalId,
      input.mood,
      input.note,
      input.attachmentBase64,
      input.attachmentMimeType,
      input.attachmentFilename,
      attachmentExpiresAt
    ]
  );
  const signal = insertResult.rows[0];
  const stampMetadata = getStampMetadata(signal.mood, input.thumbnailName);
  const photoAttachment = getPhotoAttachment(input);
  const notificationPhotoAttachment = getNotificationPhotoAttachment(input, photoAttachment);
  const signalIntent = getSignalIntent(signal.mood, photoAttachment);
  const notificationBody = getNotificationBody(
    signal.mood,
    stampMetadata,
    photoAttachment,
    signal.note
  );

  const apnsPayload = {
    aps: {
      alert: {
        title: input.senderDevice.display_name || "missyou",
        body: notificationBody
      },
      sound: "default",
      "mutable-content": 1,
      category: signalIntent === "photo_request"
        ? "MISSYOU_WHATS_UP_REQUEST"
        : "MISSYOU_STAMP"
    },
    signalId: signal.id,
    friendshipId: signal.friendship_id,
    mood: signal.mood,
    moodTitle: stampMetadata.title,
    thumbnailName: stampMetadata.thumbnailName,
    signalIntent,
    note: signal.note,
    senderDisplayName: input.senderDevice.display_name,
    senderProfileImageBase64: input.senderDevice.profile_image_base64,
    senderProfileImageMimeType: input.senderDevice.profile_image_mime_type,
    attachmentExpiresAt: signal.attachment_expires_at,
    createdAt: signal.created_at
  };
  if (input.senderInstallationId) {
    apnsPayload.senderInstallationId = input.senderInstallationId;
  }
  if (notificationPhotoAttachment) {
    apnsPayload.attachmentBase64 = notificationPhotoAttachment.base64;
    apnsPayload.attachmentMimeType = notificationPhotoAttachment.mimeType;
    apnsPayload.attachmentFilename = notificationPhotoAttachment.filename;
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

function getNotificationPhotoAttachment(input, fullAttachment) {
  if (!fullAttachment) {
    return null;
  }
  if (!input.attachmentPreviewBase64) {
    return fullAttachment.base64.length <= 3400 ? fullAttachment : null;
  }
  const mimeType = input.attachmentPreviewMimeType || fullAttachment.mimeType;
  if (!["image/jpeg", "image/png"].includes(mimeType)) {
    return null;
  }
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return {
    base64: input.attachmentPreviewBase64,
    mimeType,
    filename: input.attachmentFilename || `whats-up-preview.${extension}`
  };
}

function getSignalIntent(mood, photoAttachment) {
  if (mood !== "whatsUp") {
    return "stamp";
  }
  return photoAttachment ? "photo_response" : "photo_request";
}

function getNotificationBody(mood, stampMetadata, photoAttachment, note) {
  if (note && !isIntensityNote(note)) {
    return note;
  }
  if (mood === "whatsUp") {
    return photoAttachment
      ? "今何してる？写真が届きました"
      : "いまの写真がほしいみたい";
  }
  if (photoAttachment) {
    return "写真が届きました";
  }
  if (note && isIntensityNote(note)) {
    return `${stampMetadata.title} ${note}`;
  }
  return `${stampMetadata.title}スタンプが届きました`;
}

function isIntensityNote(note) {
  return /^×[2-9]$/.test(note);
}

function getStampMetadata(mood, requestedThumbnailName) {
  const metadata = {
    whatsUp: {
      title: "今何してる？",
      thumbnailName: "stamp-whats-up"
    },
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
    },
    cheer: {
      title: "応援",
      thumbnailName: "stamp-cheer"
    },
    missYou: {
      title: "さみしい",
      thumbnailName: "stamp-miss-you"
    },
    sorry: {
      title: "ごめん",
      thumbnailName: "stamp-sorry"
    },
    letsTalk: {
      title: "話そ",
      thumbnailName: "stamp-lets-talk"
    },
    thanks: {
      title: "ありがとう",
      thumbnailName: "stamp-thanks"
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
  await cleanupExpiredSignalAttachments(pool);
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
          client_signal_id, mood, note, attachment_base64, attachment_mime_type,
          attachment_filename, attachment_expires_at, status, created_at, delivered_at
      )
      SELECT
        updated.*,
        sender.installation_id AS sender_installation_id,
        sender.display_name AS sender_display_name,
        sender.profile_image_base64 AS sender_profile_image_base64,
        sender.profile_image_mime_type AS sender_profile_image_mime_type,
        sender.profile_icon_base64 AS sender_profile_icon_base64,
        sender.profile_icon_mime_type AS sender_profile_icon_mime_type
      FROM updated
      JOIN devices sender ON sender.id = updated.sender_device_id
      ORDER BY updated.created_at ASC
    `,
    [input.deviceId, input.limit]
  );

  sendJson(response, 200, {
    signals: result.rows.map(toSignalWithSenderSummary)
  });
}

async function cleanupExpiredSignalAttachments(pool) {
  await pool.query(
    `
      UPDATE signals
      SET
        attachment_base64 = NULL,
        attachment_mime_type = NULL,
        attachment_filename = NULL
      WHERE attachment_expires_at IS NOT NULL
        AND attachment_expires_at <= now()
        AND attachment_base64 IS NOT NULL
    `
  );
}

async function clearSignalAttachment(pool, signalId) {
  await pool.query(
    `
      UPDATE signals
      SET
        attachment_base64 = NULL,
        attachment_mime_type = NULL,
        attachment_filename = NULL
      WHERE id = $1
    `,
    [signalId]
  );
}

function isSignalAttachmentExpired(signal) {
  if (!signal.attachment_expires_at) {
    return false;
  }
  return new Date(signal.attachment_expires_at).getTime() <= Date.now();
}

async function ensureDevice(pool, deviceId) {
  const result = await pool.query(
    `
      SELECT id, installation_id, platform, apns_token, app_version,
        display_name, profile_image_base64, profile_image_mime_type,
        profile_icon_base64, profile_icon_mime_type,
        created_at, updated_at
      FROM devices
      WHERE id = $1
    `,
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
    `
      SELECT id, installation_id, platform, apns_token, app_version,
        display_name, profile_image_base64, profile_image_mime_type,
        profile_icon_base64, profile_icon_mime_type,
        created_at, updated_at
      FROM devices
      WHERE installation_id = $1
    `,
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

async function updateDeviceProfile(pool, deviceId, input) {
  if (
    !input.profileDisplayName
    && !input.profileImageBase64
    && !input.profileImageMimeType
    && !input.profileIconBase64
    && !input.profileIconMimeType
  ) {
    return;
  }

  await pool.query(
    `
      UPDATE devices
      SET
        display_name = COALESCE($2, display_name),
        profile_image_base64 = COALESCE($3, profile_image_base64),
        profile_image_mime_type = COALESCE($4, profile_image_mime_type),
        profile_icon_base64 = COALESCE($5, profile_icon_base64),
        profile_icon_mime_type = COALESCE($6, profile_icon_mime_type),
        updated_at = now()
      WHERE id = $1
    `,
    [
      deviceId,
      input.profileDisplayName,
      input.profileImageBase64,
      input.profileImageMimeType,
      input.profileIconBase64,
      input.profileIconMimeType
    ]
  );
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
    displayName: row.display_name,
    profileImageBase64: row.profile_image_base64,
    profileImageMimeType: row.profile_image_mime_type,
    profileIconBase64: row.profile_icon_base64,
    profileIconMimeType: row.profile_icon_mime_type,
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
    attachmentBase64: row.attachment_base64,
    attachmentMimeType: row.attachment_mime_type,
    attachmentFilename: row.attachment_filename,
    attachmentExpiresAt: row.attachment_expires_at,
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at
  };
}

function toSignalWithSender(row) {
  return {
    ...toSignal(row),
    sender: {
      installationId: row.sender_installation_id,
      displayName: row.sender_display_name,
      profileImageBase64: row.sender_profile_image_base64,
      profileImageMimeType: row.sender_profile_image_mime_type,
      profileIconBase64: row.sender_profile_icon_base64,
      profileIconMimeType: row.sender_profile_icon_mime_type
    }
  };
}

function toSignalSummary(row) {
  return {
    ...toSignal(row),
    attachmentBase64: null
  };
}

function toSignalWithSenderSummary(row) {
  return {
    ...toSignalSummary(row),
    sender: {
      installationId: row.sender_installation_id,
      displayName: row.sender_display_name,
      profileImageBase64: row.sender_profile_image_base64,
      profileImageMimeType: row.sender_profile_image_mime_type,
      profileIconBase64: row.sender_profile_icon_base64,
      profileIconMimeType: row.sender_profile_icon_mime_type
    }
  };
}

function toLightSignalParticipant(row, prefix) {
  return {
    installationId: row[`${prefix}_installation_id`],
    displayName: row[`${prefix}_display_name`],
    profileImageBase64: null,
    profileImageMimeType: null,
    profileIconBase64: null,
    profileIconMimeType: null
  };
}

function toSignalHistorySummary(row, viewerDeviceId) {
  const sender = toLightSignalParticipant(row, "sender");
  const recipient = toLightSignalParticipant(row, "recipient");
  const direction = row.sender_device_id === viewerDeviceId ? "sent" : "received";
  return {
    ...toSignalSummary(row),
    direction,
    sender,
    recipient,
    counterpart: direction === "sent" ? recipient : sender
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
