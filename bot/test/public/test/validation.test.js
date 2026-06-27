const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeFriendshipPair,
  validateDeviceRegistration,
  validateInviteCreate,
  validateSignalSend
} = require("../src/validation");

test("validateDeviceRegistration trims supported iOS payload", () => {
  const input = validateDeviceRegistration({
    installationId: " install-1 ",
    platform: "ios",
    apnsToken: " token ",
    appVersion: "0.1.0"
  });

  assert.equal(input.installationId, "install-1");
  assert.equal(input.platform, "ios");
  assert.equal(input.apnsToken, "token");
});

test("validateInviteCreate defaults expiry to 72 hours", () => {
  const input = validateInviteCreate({
    ownerDeviceId: "72600000-0000-4000-8000-000000000001"
  });

  assert.equal(input.expiresInHours, 72);
});

test("validateSignalSend rejects unsupported mood", () => {
  assert.throws(
    () => validateSignalSend({
      friendshipId: "72600000-0000-4000-8000-000000000001",
      senderDeviceId: "72600000-0000-4000-8000-000000000002",
      mood: "angry"
    }),
    /mood is not supported/
  );
});

test("normalizeFriendshipPair keeps pair order stable", () => {
  assert.deepEqual(
    normalizeFriendshipPair(
      "72600000-0000-4000-8000-000000000002",
      "72600000-0000-4000-8000-000000000001"
    ),
    [
      "72600000-0000-4000-8000-000000000001",
      "72600000-0000-4000-8000-000000000002"
    ]
  );
});
