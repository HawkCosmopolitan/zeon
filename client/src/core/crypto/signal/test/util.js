"use strict";
//
// Copyright 2023 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = void 0;
const SignalClient = require("../index");
function initLogger(logLevel) {
    SignalClient.initLogger(logLevel !== null && logLevel !== void 0 ? logLevel : SignalClient.LogLevel.Trace, (_level, target, fileOrNull, lineOrNull, message) => {
        const targetPrefix = target ? '[' + target + '] ' : '';
        const file = fileOrNull !== null && fileOrNull !== void 0 ? fileOrNull : '<unknown>';
        const line = lineOrNull !== null && lineOrNull !== void 0 ? lineOrNull : 0;
        // eslint-disable-next-line no-console
        console.log(targetPrefix + file + ':' + line + ': ' + message);
    });
}
exports.initLogger = initLogger;
//# sourceMappingURL=util.js.map