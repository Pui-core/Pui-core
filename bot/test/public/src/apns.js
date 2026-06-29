const crypto = require("node:crypto");
const fs = require("node:fs");
const http2 = require("node:http2");

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function createProviderToken(config) {
  const header = base64Url(JSON.stringify({
    alg: "ES256",
    kid: config.keyId
  }));
  const claims = base64Url(JSON.stringify({
    iss: config.teamId,
    iat: Math.floor(Date.now() / 1000)
  }));
  const signingInput = `${header}.${claims}`;
  const privateKey = fs.readFileSync(config.authKeyPath, "utf8");
  const signature = crypto.sign(
    "sha256",
    Buffer.from(signingInput),
    {
      key: privateKey,
      dsaEncoding: "ieee-p1363"
    }
  );

  return `${signingInput}.${base64Url(signature)}`;
}

function loadApnsConfig(env = process.env) {
  const config = {
    teamId: env.APNS_TEAM_ID,
    keyId: env.APNS_KEY_ID,
    bundleId: env.APNS_BUNDLE_ID,
    authKeyPath: env.APNS_AUTH_KEY_PATH,
    environment: env.APNS_ENV === "production" ? "production" : "sandbox"
  };

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => key !== "environment" && !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    return { enabled: false, missingKeys };
  }

  return {
    enabled: true,
    ...config,
    host: config.environment === "production"
      ? "https://api.push.apple.com"
      : "https://api.sandbox.push.apple.com"
  };
}

async function sendApnsAlert(deviceToken, payload, env = process.env) {
  const config = loadApnsConfig(env);
  if (!config.enabled) {
    return {
      status: "skipped",
      reason: "apns_not_configured",
      missingKeys: config.missingKeys
    };
  }

  const providerToken = createProviderToken(config);

  return new Promise((resolve) => {
    const client = http2.connect(config.host);
    let responseBody = "";

    client.on("error", (error) => {
      resolve({
        status: "failed",
        reason: "apns_connection_error",
        message: error.message
      });
    });

    const request = client.request(createApnsRequestHeaders(config, deviceToken, providerToken));

    request.setEncoding("utf8");
    request.on("response", (headers) => {
      request.on("data", (chunk) => {
        responseBody += chunk;
      });

      request.on("end", () => {
        client.close();
        const statusCode = Number(headers[":status"] ?? 0);
        resolve({
          status: statusCode >= 200 && statusCode < 300 ? "sent" : "failed",
          statusCode,
          apnsId: headers["apns-id"],
          body: responseBody ? safeJson(responseBody) : null
        });
      });
    });

    request.on("error", (error) => {
      client.close();
      resolve({
        status: "failed",
        reason: "apns_request_error",
        message: error.message
      });
    });

    request.end(JSON.stringify(payload));
  });
}

function createApnsRequestHeaders(config, deviceToken, providerToken) {
  return {
    ":method": "POST",
    ":path": `/3/device/${deviceToken}`,
    authorization: `bearer ${providerToken}`,
    "apns-topic": config.bundleId,
    "apns-push-type": "alert",
    "apns-priority": "10",
    "apns-expiration": "0",
    "content-type": "application/json"
  };
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

module.exports = {
  createApnsRequestHeaders,
  createProviderToken,
  loadApnsConfig,
  sendApnsAlert
};
