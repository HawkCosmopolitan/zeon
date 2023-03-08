"use strict";
//
// Copyright 2021 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
const ByteArray_1 = require("../internal/ByteArray");
const Native = require("../../../Native");
const UuidCiphertext_1 = require("../groups/UuidCiphertext");
const ProfileKeyCiphertext_1 = require("../groups/ProfileKeyCiphertext");
class PniCredentialPresentation extends ByteArray_1.default {
    constructor(contents) {
        super(contents, Native.PniCredentialPresentation_CheckValidContents);
    }
    getAciCiphertext() {
        return new UuidCiphertext_1.default(Native.PniCredentialPresentation_GetAciCiphertext(this.contents));
    }
    getPniCiphertext() {
        return new UuidCiphertext_1.default(Native.PniCredentialPresentation_GetPniCiphertext(this.contents));
    }
    getProfileKeyCiphertext() {
        return new ProfileKeyCiphertext_1.default(Native.PniCredentialPresentation_GetProfileKeyCiphertext(this.contents));
    }
}
exports.default = PniCredentialPresentation;
//# sourceMappingURL=PniCredentialPresentation.js.map