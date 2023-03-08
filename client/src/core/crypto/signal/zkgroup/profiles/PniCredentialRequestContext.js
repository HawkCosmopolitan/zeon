"use strict";
//
// Copyright 2021 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
const ByteArray_1 = require("../internal/ByteArray");
const Native = require("../../../Native");
const ProfileKeyCredentialRequest_1 = require("./ProfileKeyCredentialRequest");
class PniCredentialRequestContext extends ByteArray_1.default {
    constructor(contents) {
        super(contents, Native.PniCredentialRequestContext_CheckValidContents);
    }
    getRequest() {
        return new ProfileKeyCredentialRequest_1.default(Native.PniCredentialRequestContext_GetRequest(this.contents));
    }
}
exports.default = PniCredentialRequestContext;
//# sourceMappingURL=PniCredentialRequestContext.js.map