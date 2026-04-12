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

// src/cron.ts
var cron_exports = {};
__export(cron_exports, {
  cronService: () => cronService
});
module.exports = __toCommonJS(cron_exports);
var import_node_cron = __toESM(require("node-cron"));
var taskRegistry = /* @__PURE__ */ new Map();
var cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * 
   * @param cronExpression Standard cron string
   * @param taskFunction Async function to execute
   * @param name Optional unique name for the task (allows stopping it later)
   * @returns The node-cron job object
   */
  scheduleTask(cronExpression, taskFunction, name) {
    const valid = import_node_cron.default.validate(cronExpression);
    if (!valid) {
      throw new Error(`Invalid cron expression provided: ${cronExpression}`);
    }
    const scheduledJob = import_node_cron.default.schedule(cronExpression, async () => {
      try {
        await taskFunction();
      } catch (e) {
        console.error(`Error executing cron task [${cronExpression}]:`, e);
      }
    });
    if (name) {
      taskRegistry.set(name, scheduledJob);
    }
    return scheduledJob;
  },
  /**
   * Stop and remove a named task.
   */
  stopTask(name) {
    const task = taskRegistry.get(name);
    if (!task) {
      throw new Error(`Cron task [${name}] not found`);
    }
    task.stop();
    taskRegistry.delete(name);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cronService
});
//# sourceMappingURL=cron.js.map