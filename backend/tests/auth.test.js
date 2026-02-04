const assert = require("assert");
const crypto = require("crypto");

process.env.BOT_TOKEN = "TEST_BOT_TOKEN";
process.env.JWT_SECRET = "TEST_JWT_SECRET";

const { verifyInitData, signToken, verifyToken } = require("../auth");

function buildInitData(payload) {
  const params = new URLSearchParams(payload);
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }
  const entries = Object.entries(data)
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");
  const secretKey = crypto.createHash("sha256").update(process.env.BOT_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

const initData = buildInitData({
  user: JSON.stringify({ id: 42, username: "zoo" }),
  auth_date: Math.floor(Date.now() / 1000).toString(),
  query_id: "abc",
});

const verified = verifyInitData(initData);
assert.strictEqual(verified.tg_user_id, 42);
assert.strictEqual(verified.username, "zoo");

const token = signToken({ sub: 1, tg_user_id: 42 });
const payload = verifyToken(token);
assert.strictEqual(payload.sub, 1);

console.log("auth.test.js passed");
