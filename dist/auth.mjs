// src/auth.ts
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { z } from "zod";
var AuthEnvSchema = z.object({
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_SESSION_DURATION: z.string().default("24h")
});
function createAuth(config) {
  return {
    async hashPassword(password) {
      const saltRounds = 10;
      return bcrypt.hash(password, saltRounds);
    },
    async verifyPassword(password, hash2) {
      return bcrypt.compare(password, hash2);
    },
    generateToken(payload) {
      return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.sessionDuration
      });
    },
    verifyToken(token) {
      return jwt.verify(token, config.jwtSecret);
    }
  };
}
function createAuthFromEnv(env = process.env) {
  const parsedEnv = AuthEnvSchema.parse(env);
  return createAuth({
    jwtSecret: parsedEnv.JWT_SECRET,
    sessionDuration: parsedEnv.JWT_SESSION_DURATION
  });
}
export {
  AuthEnvSchema,
  createAuth,
  createAuthFromEnv
};
//# sourceMappingURL=auth.mjs.map