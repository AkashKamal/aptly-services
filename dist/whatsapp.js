"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/whatsapp.ts
var whatsapp_exports = {};
__export(whatsapp_exports, {
  WhatsAppEnvSchema: () => WhatsAppEnvSchema,
  createWhatsAppClient: () => createWhatsAppClient,
  createWhatsAppClientFromEnv: () => createWhatsAppClientFromEnv
});
module.exports = __toCommonJS(whatsapp_exports);
var import_zod = require("zod");
var WhatsAppEnvSchema = import_zod.z.object({
  WHATSAPP_TOKEN: import_zod.z.string().min(1, "WHATSAPP_TOKEN is required"),
  WHATSAPP_PHONE_ID: import_zod.z.string().min(1, "WHATSAPP_PHONE_ID is required")
});
function createWhatsAppClient(config) {
  const baseUrl = `https://graph.facebook.com/v17.0/${config.phoneId}/messages`;
  return {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    async sendTemplateMessage(options) {
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.template,
          language: {
            code: options.language || "en"
          },
          components: options.components || []
        }
      };
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("WhatsApp API Error:", JSON.stringify(errorData, null, 2));
        throw new Error("Failed to send WhatsApp message");
      }
      return response.json();
    }
  };
}
function createWhatsAppClientFromEnv(env = process.env) {
  const parsedEnv = WhatsAppEnvSchema.parse(env);
  return createWhatsAppClient({
    token: parsedEnv.WHATSAPP_TOKEN,
    phoneId: parsedEnv.WHATSAPP_PHONE_ID
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WhatsAppEnvSchema,
  createWhatsAppClient,
  createWhatsAppClientFromEnv
});
//# sourceMappingURL=whatsapp.js.map