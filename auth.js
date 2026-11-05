const { createHash, randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
};

const verifyPassword = (password, storedHash) => {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
};

const createSessionToken = () => randomBytes(32).toString("base64url");
const hashSessionToken = (token) => createHash("sha256").update(token).digest("hex");

module.exports = {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
};
