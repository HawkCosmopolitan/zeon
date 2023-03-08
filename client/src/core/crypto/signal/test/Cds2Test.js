"use strict";
//
// Copyright 2022 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chaiAsPromised = require("chai-as-promised");
const SignalClient = require("../index");
const util = require("./util");
const fs = require("node:fs");
const path = require("node:path");
(0, chai_1.use)(chaiAsPromised);
util.initLogger();
describe('Cds2Client', () => {
    const mrenclave = Buffer.from('39d78f17f8aa9a8e9cdaf16595947a057bac21f014d1abfd6a99b2dfd4e18d1d', 'hex');
    const currentDate = new Date(1655857680000);
    const attestationMessage = fs.readFileSync(path.join(__dirname, '../../ts/test/clienthandshakestart.data'));
    it('create client', () => {
        const cds2Client = SignalClient.Cds2Client.new(mrenclave, attestationMessage, currentDate);
        const initialMessage = cds2Client.initialRequest();
        chai_1.assert.lengthOf(initialMessage, 48, 'initial message length');
    });
    it('invalid mrenclave', () => {
        const invalidMrenclave = Buffer.from([]);
        try {
            SignalClient.Cds2Client.new(invalidMrenclave, attestationMessage, currentDate);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
        }
    });
    it('complete handshake without initial request', () => {
        const cds2Client = SignalClient.Cds2Client.new(mrenclave, attestationMessage, currentDate);
        const handshakeResponse = Buffer.from('010203', 'hex');
        try {
            cds2Client.completeHandshake(handshakeResponse);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'Cds2ClientState_CompleteHandshake'); // the Rust entry point
        }
    });
    it('established send fails prior to establishment', () => {
        const cds2Client = SignalClient.Cds2Client.new(mrenclave, attestationMessage, currentDate);
        const plaintextToSend = Buffer.from('010203', 'hex');
        try {
            cds2Client.establishedSend(plaintextToSend);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'Cds2ClientState_EstablishedSend'); // the Rust entry point
        }
    });
    it('established recv fails prior to establishment', () => {
        const cds2Client = SignalClient.Cds2Client.new(mrenclave, attestationMessage, currentDate);
        const receivedCiphertext = Buffer.from('010203', 'hex');
        try {
            cds2Client.establishedRecv(receivedCiphertext);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'Cds2ClientState_EstablishedRecv'); // the Rust entry point
        }
    });
});
//# sourceMappingURL=Cds2Test.js.map