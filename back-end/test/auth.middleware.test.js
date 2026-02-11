import { test } from "node:test";
import assert from "node:assert/strict";
import { authenticateToken } from "../src/middleware/auth.middleware.js";

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

test("authenticateToken returns 401 when token missing", () => {
  const req = { headers: {}, ip: "127.0.0.1" };
  const res = createMockRes();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  authenticateToken(req, res, next);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.message, "Access token required");
  assert.equal(nextCalled, false);
});
