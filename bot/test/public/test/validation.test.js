const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeFriendshipPair,
  validateDeviceRegistration,
  validateDeviceProfileUpdate,
  validateDirectSignalSend,
  validateInviteAccept,
  validateInviteCreate,
  validateSignalSend
} = require("../src/validation");

test("validateDeviceRegistration trims supported iOS payload", () => {
  const input = validateDeviceRegistration({
    installationId: " install-1 ",
    platform: "ios",
    apnsToken: " token ",
    appVersion: "0.1.0",
    profileDisplayName: " Pui ",
    profileImageBase64: " aGVsbG8= ",
    profileImageMimeType: " image/jpeg "
  });

  assert.equal(input.installationId, "install-1");
  assert.equal(input.platform, "ios");
  assert.equal(input.apnsToken, "token");
  assert.equal(input.profileDisplayName, "Pui");
  assert.equal(input.profileImageBase64, "aGVsbG8=");
  assert.equal(input.profileImageMimeType, "image/jpeg");
});

test("validateDeviceProfileUpdate accepts compact profile image", () => {
  const input = validateDeviceProfileUpdate({
    installationId: "72600000-0000-4000-8000-000000000010",
    profileDisplayName: " Tsuka ",
    profileImageBase64: " aGVsbG8= ",
    profileImageMimeType: " image/png "
  });

  assert.equal(input.installationId, "72600000-0000-4000-8000-000000000010");
  assert.equal(input.profileDisplayName, "Tsuka");
  assert.equal(input.profileImageBase64, "aGVsbG8=");
  assert.equal(input.profileImageMimeType, "image/png");
});

test("validateDeviceProfileUpdate rejects missing profile fields", () => {
  assert.throws(
    () => validateDeviceProfileUpdate({
      installationId: "72600000-0000-4000-8000-000000000010"
    }),
    /profileDisplayName or profileImageBase64 is required/
  );
});

test("validateInviteCreate defaults expiry to 72 hours", () => {
  const input = validateInviteCreate({
    ownerDeviceId: "72600000-0000-4000-8000-000000000001"
  });

  assert.equal(input.expiresInHours, 72);
});

test("validateInviteCreate accepts owner installation ID", () => {
  const input = validateInviteCreate({
    ownerInstallationId: " 72600000-0000-4000-8000-000000000011 ",
    displayName: " Pui "
  });

  assert.equal(input.ownerDeviceId, null);
  assert.equal(input.ownerInstallationId, "72600000-0000-4000-8000-000000000011");
  assert.equal(input.displayName, "Pui");
});

test("validateInviteCreate requires a device identifier", () => {
  assert.throws(
    () => validateInviteCreate({ displayName: "Pui" }),
    /ownerDeviceId or ownerInstallationId is required/
  );
});

test("validateInviteAccept accepts acceptor installation ID", () => {
  const input = validateInviteAccept({
    code: " abcd1234 ",
    acceptorInstallationId: "72600000-0000-4000-8000-000000000012"
  });

  assert.equal(input.code, "ABCD1234");
  assert.equal(input.acceptorDeviceId, null);
  assert.equal(input.acceptorInstallationId, "72600000-0000-4000-8000-000000000012");
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

test("validateDirectSignalSend normalizes installation IDs", () => {
  const input = validateDirectSignalSend({
    senderInstallationId: " 72600000-0000-4000-8000-000000000001 ",
    recipientInstallationId: "72600000-0000-4000-8000-000000000002",
    clientSignalId: " signal-1 ",
    mood: "littleLonely",
    thumbnailName: " stamp-little-lonely ",
    note: " hey "
  });

  assert.equal(input.senderInstallationId, "72600000-0000-4000-8000-000000000001");
  assert.equal(input.recipientInstallationId, "72600000-0000-4000-8000-000000000002");
  assert.equal(input.clientSignalId, "signal-1");
  assert.equal(input.thumbnailName, "stamp-little-lonely");
  assert.equal(input.note, "hey");
});

test("validateDirectSignalSend accepts whatsUp mood", () => {
  const input = validateDirectSignalSend({
    senderInstallationId: "72600000-0000-4000-8000-000000000001",
    recipientInstallationId: "72600000-0000-4000-8000-000000000002",
    mood: "whatsUp",
    thumbnailName: " stamp-whats-up "
  });

  assert.equal(input.mood, "whatsUp");
  assert.equal(input.thumbnailName, "stamp-whats-up");
});

test("validateDirectSignalSend accepts small photo attachment payload", () => {
  const input = validateDirectSignalSend({
    senderInstallationId: "72600000-0000-4000-8000-000000000001",
    recipientInstallationId: "72600000-0000-4000-8000-000000000002",
    mood: "thinkingOfYou",
    attachmentBase64: " aGVsbG8= ",
    attachmentMimeType: " image/jpeg ",
    attachmentFilename: " whats-up.jpg "
  });

  assert.equal(input.attachmentBase64, "aGVsbG8=");
  assert.equal(input.attachmentMimeType, "image/jpeg");
  assert.equal(input.attachmentFilename, "whats-up.jpg");
});

test("validateDirectSignalSend rejects non-base64 attachment payload", () => {
  assert.throws(
    () => validateDirectSignalSend({
      senderInstallationId: "72600000-0000-4000-8000-000000000001",
      recipientInstallationId: "72600000-0000-4000-8000-000000000002",
      mood: "thinkingOfYou",
      attachmentBase64: "not base64"
    }),
    /attachmentBase64 must be base64/
  );
});

test("validateDirectSignalSend rejects self sends", () => {
  assert.throws(
    () => validateDirectSignalSend({
      senderInstallationId: "72600000-0000-4000-8000-000000000001",
      recipientInstallationId: "72600000-0000-4000-8000-000000000001",
      mood: "littleLonely"
    }),
    /recipientInstallationId must be different/
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
