"use strict";
//
// Copyright 2020-2022 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const Constants_1 = require("../internal/Constants");
const Native = require("../../../Native");
const ExpiringProfileKeyCredential_1 = require("./ExpiringProfileKeyCredential");
const PniCredential_1 = require("./PniCredential");
const PniCredentialPresentation_1 = require("./PniCredentialPresentation");
const PniCredentialRequestContext_1 = require("./PniCredentialRequestContext");
const ProfileKeyCredential_1 = require("./ProfileKeyCredential");
const ProfileKeyCredentialPresentation_1 = require("./ProfileKeyCredentialPresentation");
const ProfileKeyCredentialRequestContext_1 = require("./ProfileKeyCredentialRequestContext");
const UUIDUtil_1 = require("../internal/UUIDUtil");
class ClientZkProfileOperations {
    constructor(serverPublicParams) {
        this.serverPublicParams = serverPublicParams;
    }
    createProfileKeyCredentialRequestContext(uuid, profileKey) {
        const random = (0, crypto_1.randomBytes)(Constants_1.RANDOM_LENGTH);
        return this.createProfileKeyCredentialRequestContextWithRandom(random, uuid, profileKey);
    }
    createProfileKeyCredentialRequestContextWithRandom(random, uuid, profileKey) {
        return new ProfileKeyCredentialRequestContext_1.default(Native.ServerPublicParams_CreateProfileKeyCredentialRequestContextDeterministic(this.serverPublicParams.getContents(), random, (0, UUIDUtil_1.fromUUID)(uuid), profileKey.getContents()));
    }
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialRequestContext(aci, pni, profileKey) {
        const random = (0, crypto_1.randomBytes)(Constants_1.RANDOM_LENGTH);
        return this.createPniCredentialRequestContextWithRandom(random, aci, pni, profileKey);
    }
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialRequestContextWithRandom(random, aci, pni, profileKey) {
        return new PniCredentialRequestContext_1.default(Native.ServerPublicParams_CreatePniCredentialRequestContextDeterministic(this.serverPublicParams.getContents(), random, (0, UUIDUtil_1.fromUUID)(aci), (0, UUIDUtil_1.fromUUID)(pni), profileKey.getContents()));
    }
    receiveProfileKeyCredential(profileKeyCredentialRequestContext, profileKeyCredentialResponse) {
        return new ProfileKeyCredential_1.default(Native.ServerPublicParams_ReceiveProfileKeyCredential(this.serverPublicParams.getContents(), profileKeyCredentialRequestContext.getContents(), profileKeyCredentialResponse.getContents()));
    }
    receiveExpiringProfileKeyCredential(profileKeyCredentialRequestContext, profileKeyCredentialResponse, now = new Date()) {
        return new ExpiringProfileKeyCredential_1.default(Native.ServerPublicParams_ReceiveExpiringProfileKeyCredential(this.serverPublicParams.getContents(), profileKeyCredentialRequestContext.getContents(), profileKeyCredentialResponse.getContents(), Math.floor(now.getTime() / 1000)));
    }
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    receivePniCredential(requestContext, response) {
        return new PniCredential_1.default(Native.ServerPublicParams_ReceivePniCredential(this.serverPublicParams.getContents(), requestContext.getContents(), response.getContents()));
    }
    createProfileKeyCredentialPresentation(groupSecretParams, profileKeyCredential) {
        const random = (0, crypto_1.randomBytes)(Constants_1.RANDOM_LENGTH);
        return this.createProfileKeyCredentialPresentationWithRandom(random, groupSecretParams, profileKeyCredential);
    }
    createProfileKeyCredentialPresentationWithRandom(random, groupSecretParams, profileKeyCredential) {
        return new ProfileKeyCredentialPresentation_1.default(Native.ServerPublicParams_CreateProfileKeyCredentialPresentationDeterministic(this.serverPublicParams.getContents(), random, groupSecretParams.getContents(), profileKeyCredential.getContents()));
    }
    createExpiringProfileKeyCredentialPresentation(groupSecretParams, profileKeyCredential) {
        const random = (0, crypto_1.randomBytes)(Constants_1.RANDOM_LENGTH);
        return this.createExpiringProfileKeyCredentialPresentationWithRandom(random, groupSecretParams, profileKeyCredential);
    }
    createExpiringProfileKeyCredentialPresentationWithRandom(random, groupSecretParams, profileKeyCredential) {
        return new ProfileKeyCredentialPresentation_1.default(Native.ServerPublicParams_CreateExpiringProfileKeyCredentialPresentationDeterministic(this.serverPublicParams.getContents(), random, groupSecretParams.getContents(), profileKeyCredential.getContents()));
    }
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialPresentation(groupSecretParams, credential) {
        const random = (0, crypto_1.randomBytes)(Constants_1.RANDOM_LENGTH);
        return this.createPniCredentialPresentationWithRandom(random, groupSecretParams, credential);
    }
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialPresentationWithRandom(random, groupSecretParams, credential) {
        return new PniCredentialPresentation_1.default(Native.ServerPublicParams_CreatePniCredentialPresentationDeterministic(this.serverPublicParams.getContents(), random, groupSecretParams.getContents(), credential.getContents()));
    }
}
exports.default = ClientZkProfileOperations;
//# sourceMappingURL=ClientZkProfileOperations.js.map