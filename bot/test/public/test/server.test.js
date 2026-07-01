const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createApp,
  createFriendshipAcceptedPayload,
  shouldUseMutableNotification
} = require("../src/server");
const { createApnsRequestHeaders } = require("../src/apns");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("apns headers request immediate alert delivery", () => {
  const headers = createApnsRequestHeaders(
    { bundleId: "com.pui-core.missyou" },
    "device-token",
    "provider-token"
  );

  assert.equal(headers["apns-push-type"], "alert");
  assert.equal(headers["apns-priority"], "10");
  assert.equal(headers["apns-expiration"], "0");
  assert.equal(headers["apns-topic"], "com.pui-core.missyou");
});

test("mutable notification service is used for stamp thumbnails and photo previews", () => {
  assert.equal(shouldUseMutableNotification("stamp", null), true);
  assert.equal(shouldUseMutableNotification("photo_request", null), false);
  assert.equal(shouldUseMutableNotification("photo_response", null), false);
  assert.equal(
    shouldUseMutableNotification("photo_response", {
      base64: "aGVsbG8=",
      mimeType: "image/jpeg",
      filename: "preview.jpg"
    }),
    true
  );
});

test("friendship accepted notification payload carries peer profile", () => {
  const payload = createFriendshipAcceptedPayload({
    friendship: {
      id: "72600000-0000-4000-8000-000000000615",
      created_at: "2026-07-02T01:23:45.000Z"
    },
    peerDevice: {
      installation_id: "72600000-0000-4000-8000-000000000611",
      display_name: "Old name",
      profile_icon_base64: "b2xk",
      profile_icon_mime_type: "image/jpeg"
    },
    input: {
      profileDisplayName: "Tsuka",
      profileIconBase64: "aWNvbg==",
      profileIconMimeType: "image/png"
    }
  });

  assert.equal(payload.eventType, "friendship_accepted");
  assert.equal(payload.friendshipId, "72600000-0000-4000-8000-000000000615");
  assert.equal(payload.peerInstallationId, "72600000-0000-4000-8000-000000000611");
  assert.equal(payload.peerDisplayName, "Tsuka");
  assert.equal(payload.peerProfileImageBase64, "aWNvbg==");
  assert.equal(payload.peerProfileImageMimeType, "image/png");
  assert.equal(payload.aps.alert.title, "Tsuka");
  assert.equal(payload.aps.alert.body, "フレンドになりました");
  assert.equal(payload.aps.category, "MISSYOU_FRIENDSHIP");
});

test("server returns 400 for invalid async handler payload without exiting", async () => {
  const pool = {
    query: async () => {
      throw new Error("query should not be called for invalid payload");
    }
  };
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const invalidResponse = await fetch(`http://127.0.0.1:${port}/v1/devices/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(invalidResponse.status, 400);
    assert.equal((await invalidResponse.json()).error, "bad_request");

    const notFoundResponse = await fetch(`http://127.0.0.1:${port}/missing`);
    assert.equal(notFoundResponse.status, 404);
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("invite create auto-registers owner installation before APNs registration", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const ownerInstallationId = "72600000-0000-4000-8000-000000000501";
  const ownerDeviceId = "72600000-0000-4000-8000-000000000502";
  const calls = [];
  const pool = {
    query: async (sql, params = []) => {
      calls.push(sql);
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        assert.equal(params[0], ownerInstallationId);
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO devices (installation_id, platform, apns_token)")) {
        assert.equal(params[0], ownerInstallationId);
        assert.equal(params[1], "pending-invite-72600000000040008000000000000501");
        return {
          rows: [{
            id: ownerDeviceId,
            installation_id: ownerInstallationId,
            platform: "ios",
            app_version: null,
            display_name: null,
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("UPDATE devices")) {
        assert.equal(params[0], ownerDeviceId);
        assert.equal(params[1], "Tester");
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO invite_codes")) {
        assert.equal(params[1], ownerDeviceId);
        return {
          rows: [{
            code: "ABCD1234",
            owner_device_id: ownerDeviceId,
            display_name: "Tester",
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          }]
        };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/invites/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerInstallationId,
        displayName: "Tester",
        profileDisplayName: "Tester"
      })
    });

    assert.equal(response.status, 201);
    assert.equal((await response.json()).invite.code, "ABCD1234");
    assert.equal(calls.length, 4);
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("invite accept auto-registers acceptor installation before APNs registration", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const acceptorInstallationId = "72600000-0000-4000-8000-000000000511";
  const acceptorDeviceId = "72600000-0000-4000-8000-000000000512";
  const ownerInstallationId = "72600000-0000-4000-8000-000000000513";
  const ownerDeviceId = "72600000-0000-4000-8000-000000000514";
  const friendshipId = "72600000-0000-4000-8000-000000000515";
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        assert.equal(params[0], acceptorInstallationId);
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO devices (installation_id, platform, apns_token)")) {
        assert.equal(params[0], acceptorInstallationId);
        assert.equal(params[1], "pending-invite-72600000000040008000000000000511");
        return {
          rows: [{
            id: acceptorDeviceId,
            installation_id: acceptorInstallationId,
            platform: "ios",
            app_version: null,
            display_name: null,
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("UPDATE devices")) {
        assert.equal(params[0], acceptorDeviceId);
        assert.equal(params[1], "Acceptor");
        return { rows: [] };
      }
      if (sql.includes("FROM invite_codes")) {
        assert.equal(params[0], "ABCD1234");
        return {
          rows: [{
            code: "ABCD1234",
            owner_device_id: ownerDeviceId,
            display_name: "Owner",
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            accepted_at: null,
            created_at: new Date().toISOString(),
            owner_installation_id: ownerInstallationId,
            owner_platform: "ios",
            owner_app_version: "1.0",
            owner_display_name: "Owner",
            owner_profile_image_base64: null,
            owner_profile_image_mime_type: null,
            owner_profile_icon_base64: null,
            owner_profile_icon_mime_type: null,
            owner_created_at: new Date().toISOString(),
            owner_updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("INSERT INTO friendships")) {
        assert.deepEqual(params, [acceptorDeviceId, ownerDeviceId].sort());
        return {
          rows: [{
            id: friendshipId,
            device_a_id: params[0],
            device_b_id: params[1],
            created_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("UPDATE invite_codes SET accepted_at")) {
        assert.equal(params[0], "ABCD1234");
        return { rows: [] };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/invites/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "abcd1234",
        acceptorInstallationId,
        profileDisplayName: "Acceptor"
      })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.friendship.id, friendshipId);
    assert.equal(body.peer.installationId, ownerInstallationId);
    assert.equal(body.invite.code, "ABCD1234");
    assert.equal(body.notification.status, "skipped");
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("signal detail returns 410 and clears expired attachment payload", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const signalId = "72600000-0000-4000-8000-000000000101";
  const viewerInstallationId = "72600000-0000-4000-8000-000000000201";
  const viewerDeviceId = "72600000-0000-4000-8000-000000000202";
  let clearedSignalId = null;
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        return {
          rows: [{
            id: viewerDeviceId,
            installation_id: viewerInstallationId,
            platform: "ios",
            apns_token: "token",
            app_version: "0.1.0",
            display_name: "Viewer",
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("attachment_expires_at <= now()") && params.length === 0) {
        return { rows: [] };
      }
      if (sql.includes("FROM signals") && sql.includes("JOIN devices sender")) {
        return {
          rows: [{
            id: signalId,
            friendship_id: "72600000-0000-4000-8000-000000000301",
            sender_device_id: "72600000-0000-4000-8000-000000000302",
            recipient_device_id: viewerDeviceId,
            client_signal_id: "client-1",
            mood: "whatsUp",
            note: null,
            attachment_base64: "aGVsbG8=",
            attachment_mime_type: "image/jpeg",
            attachment_filename: "whats-up.jpg",
            attachment_expires_at: new Date(Date.now() - 1000).toISOString(),
            status: "stored",
            created_at: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
            delivered_at: null,
            sender_installation_id: "72600000-0000-4000-8000-000000000303",
            sender_display_name: "Sender",
            sender_profile_image_base64: null,
            sender_profile_image_mime_type: null,
            sender_profile_icon_base64: null,
            sender_profile_icon_mime_type: null
          }]
        };
      }
      if (sql.includes("WHERE id = $1") && params[0] === signalId) {
        clearedSignalId = params[0];
        return { rows: [] };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/signals/detail?signalId=${signalId}&installationId=${viewerInstallationId}`
    );

    assert.equal(response.status, 410);
    assert.equal((await response.json()).message, "attachment expired");
    assert.equal(clearedSignalId, signalId);
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("signal detail returns attachment once and clears recipient payload", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const signalId = "72600000-0000-4000-8000-000000000121";
  const viewerInstallationId = "72600000-0000-4000-8000-000000000221";
  const viewerDeviceId = "72600000-0000-4000-8000-000000000222";
  let clearedSignalId = null;
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        return {
          rows: [{
            id: viewerDeviceId,
            installation_id: viewerInstallationId,
            platform: "ios",
            apns_token: "token",
            app_version: "0.1.0",
            display_name: "Viewer",
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("attachment_expires_at <= now()") && params.length === 0) {
        return { rows: [] };
      }
      if (sql.includes("FROM signals") && sql.includes("JOIN devices sender")) {
        return {
          rows: [{
            id: signalId,
            friendship_id: "72600000-0000-4000-8000-000000000321",
            sender_device_id: "72600000-0000-4000-8000-000000000322",
            recipient_device_id: viewerDeviceId,
            client_signal_id: "client-once",
            mood: "whatsUp",
            note: null,
            attachment_base64: "aGVsbG8=",
            attachment_mime_type: "image/jpeg",
            attachment_filename: "whats-up.jpg",
            attachment_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: "stored",
            created_at: new Date().toISOString(),
            delivered_at: null,
            sender_installation_id: "72600000-0000-4000-8000-000000000323",
            sender_display_name: "Sender",
            sender_profile_image_base64: null,
            sender_profile_image_mime_type: null,
            sender_profile_icon_base64: null,
            sender_profile_icon_mime_type: null
          }]
        };
      }
      if (sql.includes("WHERE id = $1") && params[0] === signalId) {
        clearedSignalId = params[0];
        return { rows: [] };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/signals/detail?signalId=${signalId}&installationId=${viewerInstallationId}`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.signal.attachmentBase64, "aGVsbG8=");
    assert.equal(body.signal.attachmentMimeType, "image/jpeg");
    assert.equal(clearedSignalId, signalId);
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("signal inbox returns recent received signals with sender profile", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const signalId = "72600000-0000-4000-8000-000000000111";
  const viewerInstallationId = "72600000-0000-4000-8000-000000000211";
  const viewerDeviceId = "72600000-0000-4000-8000-000000000212";
  const senderInstallationId = "72600000-0000-4000-8000-000000000311";
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        return {
          rows: [{
            id: viewerDeviceId,
            installation_id: viewerInstallationId,
            platform: "ios",
            apns_token: "token",
            app_version: "0.1.0",
            display_name: "Viewer",
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("attachment_expires_at <= now()") && params.length === 0) {
        return { rows: [] };
      }
      if (sql.includes("WHERE signals.recipient_device_id = $1")) {
        assert.equal(params[0], viewerDeviceId);
        assert.equal(params[1], 2);
        return {
          rows: [{
            id: signalId,
            friendship_id: "72600000-0000-4000-8000-000000000411",
            sender_device_id: "72600000-0000-4000-8000-000000000312",
            recipient_device_id: viewerDeviceId,
            client_signal_id: "client-inbox-1",
            mood: "cheer",
            note: "×3",
            attachment_base64: "aGVsbG8=",
            attachment_mime_type: "image/jpeg",
            attachment_filename: "whats-up.jpg",
            attachment_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: "push_sent",
            created_at: "2026-06-28T09:00:00.000Z",
            delivered_at: null,
            sender_installation_id: senderInstallationId,
            sender_display_name: "Sender",
            sender_profile_image_base64: "aWNvbg==",
            sender_profile_image_mime_type: "image/png",
            sender_profile_icon_base64: "aWNvbi0y",
            sender_profile_icon_mime_type: "image/png"
          }]
        };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/signals/inbox?installationId=${viewerInstallationId}&limit=2`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.signals.length, 1);
    assert.equal(body.signals[0].id, signalId);
    assert.equal(body.signals[0].mood, "cheer");
    assert.equal(body.signals[0].attachmentBase64, null);
    assert.equal(body.signals[0].attachmentMimeType, "image/jpeg");
    assert.equal(body.signals[0].sender.installationId, senderInstallationId);
    assert.equal(body.signals[0].sender.displayName, "Sender");
    assert.equal(body.signals[0].sender.profileIconBase64, "aWNvbi0y");
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("signal history returns lightweight sent and received chat rows", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const viewerInstallationId = "72600000-0000-4000-8000-000000000511";
  const viewerDeviceId = "72600000-0000-4000-8000-000000000512";
  const peerInstallationId = "72600000-0000-4000-8000-000000000611";
  const peerDeviceId = "72600000-0000-4000-8000-000000000612";
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        return {
          rows: [{
            id: viewerDeviceId,
            installation_id: viewerInstallationId,
            platform: "ios",
            apns_token: "token",
            app_version: "0.1.0",
            display_name: "Viewer",
            profile_image_base64: null,
            profile_image_mime_type: null,
            profile_icon_base64: null,
            profile_icon_mime_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes("attachment_expires_at <= now()") && params.length === 0) {
        return { rows: [] };
      }
      if (sql.includes("WHERE (") && sql.includes("$3::uuid IS NULL")) {
        assert.equal(params[0], viewerDeviceId);
        assert.equal(params[1], 120);
        assert.equal(params[2], null);
        return {
          rows: [
            {
              id: "72600000-0000-4000-8000-000000000701",
              friendship_id: "72600000-0000-4000-8000-000000000801",
              sender_device_id: viewerDeviceId,
              recipient_device_id: peerDeviceId,
              client_signal_id: "client-history-sent",
              mood: "thinkingOfYou",
              note: "見たよ",
              attachment_base64: "aGVsbG8=",
              attachment_mime_type: "image/jpeg",
              attachment_filename: "whats-up.jpg",
              attachment_expires_at: "2026-06-29T21:00:00.000Z",
              status: "push_sent",
              created_at: "2026-06-29T09:00:00.000Z",
              delivered_at: null,
              sender_installation_id: viewerInstallationId,
              sender_display_name: "Viewer",
              recipient_installation_id: peerInstallationId,
              recipient_display_name: "Peer"
            },
            {
              id: "72600000-0000-4000-8000-000000000702",
              friendship_id: "72600000-0000-4000-8000-000000000801",
              sender_device_id: peerDeviceId,
              recipient_device_id: viewerDeviceId,
              client_signal_id: "client-history-received",
              mood: "cheer",
              note: "×3",
              attachment_base64: null,
              attachment_mime_type: null,
              attachment_filename: null,
              attachment_expires_at: null,
              status: "push_sent",
              created_at: "2026-06-29T08:59:00.000Z",
              delivered_at: null,
              sender_installation_id: peerInstallationId,
              sender_display_name: "Peer",
              recipient_installation_id: viewerInstallationId,
              recipient_display_name: "Viewer"
            }
          ]
        };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/signals/history?installationId=${viewerInstallationId}&limit=120`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.signals.length, 2);
    assert.equal(body.signals[0].direction, "sent");
    assert.equal(body.signals[0].sender.installationId, viewerInstallationId);
    assert.equal(body.signals[0].recipient.installationId, peerInstallationId);
    assert.equal(body.signals[0].counterpart.installationId, peerInstallationId);
    assert.equal(body.signals[0].attachmentBase64, null);
    assert.equal(body.signals[0].sender.profileIconBase64, null);
    assert.equal(body.signals[1].direction, "received");
    assert.equal(body.signals[1].counterpart.displayName, "Peer");
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});

test("signal history scopes chat rows to requested counterpart", async () => {
  const previousAPIKey = process.env.PUI_CORE_API_KEY;
  delete process.env.PUI_CORE_API_KEY;

  const viewerInstallationId = "72600000-0000-4000-8000-000000000521";
  const viewerDeviceId = "72600000-0000-4000-8000-000000000522";
  const peerInstallationId = "72600000-0000-4000-8000-000000000621";
  const peerDeviceId = "72600000-0000-4000-8000-000000000622";
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM devices") && sql.includes("installation_id = $1")) {
        if (params[0] === viewerInstallationId) {
          return {
            rows: [{
              id: viewerDeviceId,
              installation_id: viewerInstallationId,
              platform: "ios",
              apns_token: "token",
              app_version: "0.1.0",
              display_name: "Viewer",
              profile_image_base64: null,
              profile_image_mime_type: null,
              profile_icon_base64: null,
              profile_icon_mime_type: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]
          };
        }
        if (params[0] === peerInstallationId) {
          return {
            rows: [{
              id: peerDeviceId,
              installation_id: peerInstallationId,
              platform: "ios",
              apns_token: "token",
              app_version: "0.1.0",
              display_name: "Peer",
              profile_image_base64: null,
              profile_image_mime_type: null,
              profile_icon_base64: null,
              profile_icon_mime_type: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]
          };
        }
      }
      if (sql.includes("attachment_expires_at <= now()") && params.length === 0) {
        return { rows: [] };
      }
      if (sql.includes("WHERE (") && sql.includes("$3::uuid IS NOT NULL")) {
        assert.match(sql, /signals\.sender_device_id = \$1 AND signals\.recipient_device_id = \$3/);
        assert.match(sql, /signals\.sender_device_id = \$3 AND signals\.recipient_device_id = \$1/);
        assert.equal(params[0], viewerDeviceId);
        assert.equal(params[1], 50);
        assert.equal(params[2], peerDeviceId);
        return {
          rows: [{
            id: "72600000-0000-4000-8000-000000000721",
            friendship_id: "72600000-0000-4000-8000-000000000821",
            sender_device_id: peerDeviceId,
            recipient_device_id: viewerDeviceId,
            client_signal_id: "client-history-scoped",
            mood: "thanks",
            note: null,
            attachment_base64: null,
            attachment_mime_type: null,
            attachment_filename: null,
            attachment_expires_at: null,
            status: "push_sent",
            created_at: "2026-06-29T10:00:00.000Z",
            delivered_at: null,
            sender_installation_id: peerInstallationId,
            sender_display_name: "Peer",
            recipient_installation_id: viewerInstallationId,
            recipient_display_name: "Viewer"
          }]
        };
      }
      throw new Error(`unexpected query: ${sql}`);
    }
  };

  const server = createApp(pool);
  await listen(server);
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/signals/history?installationId=${viewerInstallationId}&counterpartInstallationId=${peerInstallationId}&limit=50`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.signals.length, 1);
    assert.equal(body.signals[0].counterpart.installationId, peerInstallationId);
    assert.equal(body.signals[0].direction, "received");
  } finally {
    if (previousAPIKey === undefined) {
      delete process.env.PUI_CORE_API_KEY;
    } else {
      process.env.PUI_CORE_API_KEY = previousAPIKey;
    }
    await close(server);
  }
});
