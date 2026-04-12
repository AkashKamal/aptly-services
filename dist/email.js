"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/email.ts
var email_exports = {};
__export(email_exports, {
  EmailEnvSchema: () => EmailEnvSchema,
  createEmailClient: () => createEmailClient,
  createEmailClientFromEnv: () => createEmailClientFromEnv
});
module.exports = __toCommonJS(email_exports);
var nodemailer = __toESM(require("nodemailer"));
var import_zod = require("zod");
var EmailEnvSchema = import_zod.z.object({
  SMTP_HOST: import_zod.z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: import_zod.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod.z.number().positive()),
  SMTP_SECURE: import_zod.z.string().optional().transform((val) => val === "true"),
  SMTP_USER: import_zod.z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: import_zod.z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: import_zod.z.string().email("SMTP_FROM must be a valid email")
});
function createEmailClient(config) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? false,
    auth: config.auth
  });
  return {
    async send(options) {
      let htmlContent = options.html;
      if (options.template === "welcome" && options.data) {
        htmlContent = `<h1>Welcome, ${options.data.name}!</h1><p>We are happy to have you.</p>`;
      } else if (options.template === "alert" && options.data) {
        htmlContent = `<h1>Alert: ${options.data.alertName}</h1><p>${options.data.message}</p>`;
      }
      const info = await transporter.sendMail({
        from: config.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: htmlContent,
        attachments: options.attachments
      });
      return info.messageId;
    }
  };
}
function createEmailClientFromEnv(env = process.env) {
  const parsedEnv = EmailEnvSchema.parse(env);
  return createEmailClient({
    host: parsedEnv.SMTP_HOST,
    port: parsedEnv.SMTP_PORT,
    secure: parsedEnv.SMTP_SECURE,
    auth: {
      user: parsedEnv.SMTP_USER,
      pass: parsedEnv.SMTP_PASS
    },
    fromEmail: parsedEnv.SMTP_FROM
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EmailEnvSchema,
  createEmailClient,
  createEmailClientFromEnv
});
//# sourceMappingURL=email.js.map