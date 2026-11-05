const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { Pool } = require("pg");
require("dotenv").config();
const { hashPassword } = require("../auth");

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
if (!pool) {
  console.error("DATABASE_URL is required.");
  process.exitCode = 1;
} else {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  (async () => {
    try {
      const email = (process.env.STAFF_EMAIL || await prompt.question("Staff email: ")).trim().toLowerCase();
      const password = process.env.STAFF_PASSWORD || await prompt.question("Staff password: ", { hideEchoBack: true });
      if (!email || password.length < 12) throw new Error("Use a valid email and a password of at least 12 characters.");
      await pool.query(
        `INSERT INTO staff_users (email, password_hash, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
        [email, hashPassword(password), "admin"],
      );
      console.log(`Staff account ready for ${email}.`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    } finally {
      prompt.close();
      await pool.end();
    }
  })();
}
