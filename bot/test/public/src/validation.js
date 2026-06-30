const crypto = require("node:crypto");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MOODS = new Set([
  "whatsUp",
  "wantToMeet",
  "littleLonely",
  "wantToHear",
  "thinkingOfYou",
  "needHug",
  "goodNight",
  "cheer",
  "missYou",
  "sorry",
  "letsTalk",
  "thanks",
  "loveYou",
  "goodWork",
  "seenIt",
  "waiting"
]);

function requiredString(value, field, maxLength = 256) {
  if (typeof value !== "string") {
    throw validationError(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError(`${field} is required`);
  }
  if (trimmed.length > maxLength) {
    throw validationError(`${field} must be ${maxLength} characters or less`);
  }

  return trimmed;
}

function optionalString(value, field, maxLength = 256) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw validationError(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw validationError(`${field} must be ${maxLength} characters or less`);
  }

  return trimmed;
}

function optionalUuid(value, field) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  return uuid(value, field);
}

function uuid(value, field) {
  const normalized = requiredString(value, field, 64);
  if (!UUID_PATTERN.test(normalized)) {
    throw validationError(`${field} must be a UUID`);
  }
  return normalized.toLowerCase();
}

function validateDeviceRegistration(body) {
  const platform = requiredString(body.platform, "platform", 16);
  if (platform !== "ios") {
    throw validationError("platform must be ios");
  }

  return {
    installationId: requiredString(body.installationId, "installationId", 128),
    platform,
    apnsToken: requiredString(body.apnsToken, "apnsToken", 512),
    appVersion: optionalString(body.appVersion, "appVersion", 64),
    ...profileInput(body)
  };
}

function validateDeviceProfileUpdate(body) {
  const input = {
    installationId: uuid(body.installationId, "installationId"),
    ...profileInput(body)
  };
  if (
    !input.profileDisplayName
    && !input.profileImageBase64
    && !input.profileImageMimeType
    && !input.profileIconBase64
    && !input.profileIconMimeType
  ) {
    throw validationError("profileDisplayName or profileImageBase64 is required");
  }
  return input;
}

function validateInviteCreate(body) {
  const ownerDeviceId = optionalUuid(body.ownerDeviceId, "ownerDeviceId");
  const ownerInstallationId = optionalUuid(body.ownerInstallationId, "ownerInstallationId");
  if (!ownerDeviceId && !ownerInstallationId) {
    throw validationError("ownerDeviceId or ownerInstallationId is required");
  }

  return {
    ownerDeviceId,
    ownerInstallationId,
    displayName: optionalString(body.displayName, "displayName", 80),
    ...profileInput(body),
    expiresInHours: clampInteger(body.expiresInHours, 1, 168, 72)
  };
}

function validateInviteAccept(body) {
  const acceptorDeviceId = optionalUuid(body.acceptorDeviceId, "acceptorDeviceId");
  const acceptorInstallationId = optionalUuid(body.acceptorInstallationId, "acceptorInstallationId");
  if (!acceptorDeviceId && !acceptorInstallationId) {
    throw validationError("acceptorDeviceId or acceptorInstallationId is required");
  }

  return {
    code: requiredString(body.code, "code", 32).toUpperCase(),
    acceptorDeviceId,
    acceptorInstallationId,
    ...profileInput(body)
  };
}

function validateSignalSend(body) {
  const mood = requiredString(body.mood, "mood", 64);
  if (!MOODS.has(mood)) {
    throw validationError("mood is not supported");
  }

  return {
    friendshipId: uuid(body.friendshipId, "friendshipId"),
    senderDeviceId: uuid(body.senderDeviceId, "senderDeviceId"),
    clientSignalId: optionalString(body.clientSignalId, "clientSignalId", 128),
    mood,
    thumbnailName: optionalString(body.thumbnailName, "thumbnailName", 128),
    attachmentBase64: optionalBase64(body.attachmentBase64, "attachmentBase64", 900000),
    attachmentPreviewBase64: optionalBase64(body.attachmentPreviewBase64, "attachmentPreviewBase64", 3400),
    attachmentPreviewMimeType: optionalString(body.attachmentPreviewMimeType, "attachmentPreviewMimeType", 64),
    attachmentMimeType: optionalString(body.attachmentMimeType, "attachmentMimeType", 64),
    attachmentFilename: optionalString(body.attachmentFilename, "attachmentFilename", 80),
    note: optionalString(body.note, "note", 500)
  };
}

function validateDirectSignalSend(body) {
  const mood = requiredString(body.mood, "mood", 64);
  if (!MOODS.has(mood)) {
    throw validationError("mood is not supported");
  }

  const senderInstallationId = uuid(body.senderInstallationId, "senderInstallationId");
  const recipientInstallationId = uuid(body.recipientInstallationId, "recipientInstallationId");
  if (senderInstallationId === recipientInstallationId) {
    throw validationError("recipientInstallationId must be different from senderInstallationId");
  }

  return {
    senderInstallationId,
    recipientInstallationId,
    clientSignalId: optionalString(body.clientSignalId, "clientSignalId", 128),
    mood,
    thumbnailName: optionalString(body.thumbnailName, "thumbnailName", 128),
    attachmentBase64: optionalBase64(body.attachmentBase64, "attachmentBase64", 900000),
    attachmentPreviewBase64: optionalBase64(body.attachmentPreviewBase64, "attachmentPreviewBase64", 3400),
    attachmentPreviewMimeType: optionalString(body.attachmentPreviewMimeType, "attachmentPreviewMimeType", 64),
    attachmentMimeType: optionalString(body.attachmentMimeType, "attachmentMimeType", 64),
    attachmentFilename: optionalString(body.attachmentFilename, "attachmentFilename", 80),
    note: optionalString(body.note, "note", 500)
  };
}

function validateFriendsQuery(searchParams) {
  return {
    installationId: uuid(searchParams.get("installationId"), "installationId")
  };
}

function validateSignalDetailQuery(searchParams) {
  return {
    signalId: uuid(searchParams.get("signalId"), "signalId"),
    installationId: uuid(searchParams.get("installationId"), "installationId")
  };
}

function validateSignalInboxQuery(searchParams) {
  return {
    installationId: uuid(searchParams.get("installationId"), "installationId"),
    limit: clampInteger(searchParams.get("limit"), 1, 100, 50)
  };
}

function validateSignalHistoryQuery(searchParams) {
  return {
    installationId: uuid(searchParams.get("installationId"), "installationId"),
    counterpartInstallationId: optionalUuid(
      searchParams.get("counterpartInstallationId"),
      "counterpartInstallationId"
    ),
    limit: clampInteger(searchParams.get("limit"), 1, 200, 100)
  };
}

function optionalBase64(value, field, maxLength) {
  const normalized = optionalString(value, field, maxLength);
  if (!normalized) {
    return null;
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw validationError(`${field} must be base64`);
  }
  return normalized;
}

function profileInput(body) {
  const profileImageMimeType = optionalString(body.profileImageMimeType, "profileImageMimeType", 64);
  if (profileImageMimeType && !["image/jpeg", "image/png"].includes(profileImageMimeType)) {
    throw validationError("profileImageMimeType must be image/jpeg or image/png");
  }
  const profileIconMimeType = optionalString(body.profileIconMimeType, "profileIconMimeType", 64);
  if (profileIconMimeType && !["image/jpeg", "image/png"].includes(profileIconMimeType)) {
    throw validationError("profileIconMimeType must be image/jpeg or image/png");
  }

  return {
    profileDisplayName: optionalString(body.profileDisplayName, "profileDisplayName", 80),
    profileImageBase64: optionalBase64(body.profileImageBase64, "profileImageBase64", 1200),
    profileImageMimeType,
    profileIconBase64: optionalBase64(body.profileIconBase64, "profileIconBase64", 120000),
    profileIconMimeType
  };
}

function validatePendingQuery(searchParams) {
  return {
    deviceId: uuid(searchParams.get("deviceId"), "deviceId"),
    limit: clampInteger(searchParams.get("limit"), 1, 100, 30)
  };
}

function createInviteCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

function normalizeFriendshipPair(firstDeviceId, secondDeviceId) {
  return [firstDeviceId, secondDeviceId].sort();
}

function clampInteger(value, min, max, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw validationError("value must be an integer");
  }
  if (parsed < min || parsed > max) {
    throw validationError(`value must be between ${min} and ${max}`);
  }
  return parsed;
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  MOODS,
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
  validateSignalSend,
  validationError
};
