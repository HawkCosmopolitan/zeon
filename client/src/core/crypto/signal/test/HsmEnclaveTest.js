"use strict";
//
// Copyright 2021 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chaiAsPromised = require("chai-as-promised");
const SignalClient = require("../index");
const util = require("./util");
(0, chai_1.use)(chaiAsPromised);
util.initLogger();
describe('HsmEnclaveClient', () => {
    const validKey = Buffer.from('06863bc66d02b40d27b8d49ca7c09e9239236f9d7d25d6fcca5ce13c7064d868', 'hex');
    it('create client', () => {
        const hashes = [];
        hashes.push(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'));
        hashes.push(Buffer.from('0101010101010101010101010101010101010101010101010101010101010101', 'hex'));
        const hsmEnclaveClient = SignalClient.HsmEnclaveClient.new(validKey, hashes);
        const initialMessage = hsmEnclaveClient.initialRequest();
        chai_1.assert.lengthOf(initialMessage, 112, 'initial message length');
    });
    it('invalid hashes', () => {
        const hashes = [];
        hashes.push(Buffer.from('00000000000000000000000000000000000000000000000000000000', 'hex'));
        hashes.push(Buffer.from('010101010101010101010101010101010101010101010101010101010101010100000000', 'hex'));
        try {
            SignalClient.HsmEnclaveClient.new(validKey, hashes);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
        }
    });
    it('create client fails with no hashes', () => {
        const hashes = [];
        try {
            SignalClient.HsmEnclaveClient.new(validKey, hashes);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'HsmEnclaveClient_New'); // the Rust entry point
        }
    });
    it('complete handshake without initial request', () => {
        const hashes = [];
        hashes.push(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'));
        const hsmEnclaveClient = SignalClient.HsmEnclaveClient.new(validKey, hashes);
        const handshakeResponse = Buffer.from('010203', 'hex');
        try {
            hsmEnclaveClient.completeHandshake(handshakeResponse);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'HsmEnclaveClient_CompleteHandshake'); // the Rust entry point
        }
    });
    it('established send fails prior to establishment', () => {
        const hashes = [];
        hashes.push(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'));
        const hsmEnclaveClient = SignalClient.HsmEnclaveClient.new(validKey, hashes);
        const plaintextToSend = Buffer.from('010203', 'hex');
        try {
            hsmEnclaveClient.establishedSend(plaintextToSend);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'HsmEnclaveClient_EstablishedSend'); // the Rust entry point
        }
    });
    it('established recv fails prior to establishment', () => {
        const hashes = [];
        hashes.push(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'));
        const hsmEnclaveClient = SignalClient.HsmEnclaveClient.new(validKey, hashes);
        const receivedCiphertext = Buffer.from('010203', 'hex');
        try {
            hsmEnclaveClient.establishedRecv(receivedCiphertext);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.operation, 'HsmEnclaveClient_EstablishedRecv'); // the Rust entry point
        }
    });
});
//# sourceMappingURL=HsmEnclaveTest.js.map