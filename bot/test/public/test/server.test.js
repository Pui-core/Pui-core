const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/server");

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
