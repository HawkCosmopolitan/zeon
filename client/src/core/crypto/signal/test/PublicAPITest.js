"use strict";
//
// Copyright 2021-2022 Signal Messenger, LLC.
// SPDX-License-Identifier: AGPL-3.0-only
//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chaiAsPromised = require("chai-as-promised");
const SignalClient = require("../index");
const util = require("./util");
(0, chai_1.use)(chaiAsPromised);
util.initLogger();
class InMemorySessionStore extends SignalClient.SessionStore {
    constructor() {
        super(...arguments);
        this.state = new Map();
    }
    saveSession(name, record) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = name.name() + '::' + name.deviceId();
            Promise.resolve(this.state.set(idx, record.serialize()));
        });
    }
    getSession(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = name.name() + '::' + name.deviceId();
            const serialized = this.state.get(idx);
            if (serialized) {
                return Promise.resolve(SignalClient.SessionRecord.deserialize(serialized));
            }
            else {
                return Promise.resolve(null);
            }
        });
    }
    getExistingSessions(addresses) {
        return __awaiter(this, void 0, void 0, function* () {
            return addresses.map((address) => {
                const idx = address.name() + '::' + address.deviceId();
                const serialized = this.state.get(idx);
                if (!serialized) {
                    throw 'no session for ' + idx;
                }
                return SignalClient.SessionRecord.deserialize(serialized);
            });
        });
    }
}
class InMemoryIdentityKeyStore extends SignalClient.IdentityKeyStore {
    constructor(localRegistrationId) {
        super();
        this.idKeys = new Map();
        this.identityKey = SignalClient.PrivateKey.generate();
        this.localRegistrationId = localRegistrationId !== null && localRegistrationId !== void 0 ? localRegistrationId : 5;
    }
    getIdentityKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.identityKey);
        });
    }
    getLocalRegistrationId() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.localRegistrationId);
        });
    }
    isTrustedIdentity(name, key, _direction) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = name.name() + '::' + name.deviceId();
            if (this.idKeys.has(idx)) {
                const currentKey = this.idKeys.get(idx);
                return Promise.resolve(currentKey.compare(key) == 0);
            }
            else {
                return Promise.resolve(true);
            }
        });
    }
    saveIdentity(name, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = name.name() + '::' + name.deviceId();
            const seen = this.idKeys.has(idx);
            if (seen) {
                const currentKey = this.idKeys.get(idx);
                const changed = currentKey.compare(key) != 0;
                this.idKeys.set(idx, key);
                return Promise.resolve(changed);
            }
            this.idKeys.set(idx, key);
            return Promise.resolve(false);
        });
    }
    getIdentity(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = name.name() + '::' + name.deviceId();
            if (this.idKeys.has(idx)) {
                return Promise.resolve(this.idKeys.get(idx));
            }
            else {
                return Promise.resolve(null);
            }
        });
    }
}
class InMemoryPreKeyStore extends SignalClient.PreKeyStore {
    constructor() {
        super(...arguments);
        this.state = new Map();
    }
    savePreKey(id, record) {
        return __awaiter(this, void 0, void 0, function* () {
            Promise.resolve(this.state.set(id, record.serialize()));
        });
    }
    getPreKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(SignalClient.PreKeyRecord.deserialize(this.state.get(id)));
        });
    }
    removePreKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.delete(id);
            return Promise.resolve();
        });
    }
}
class InMemorySignedPreKeyStore extends SignalClient.SignedPreKeyStore {
    constructor() {
        super(...arguments);
        this.state = new Map();
    }
    saveSignedPreKey(id, record) {
        return __awaiter(this, void 0, void 0, function* () {
            Promise.resolve(this.state.set(id, record.serialize()));
        });
    }
    getSignedPreKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(SignalClient.SignedPreKeyRecord.deserialize(this.state.get(id)));
        });
    }
}
class InMemorySenderKeyStore extends SignalClient.SenderKeyStore {
    constructor() {
        super(...arguments);
        this.state = new Map();
    }
    saveSenderKey(sender, distributionId, record) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = distributionId + '::' + sender.name() + '::' + sender.deviceId();
            Promise.resolve(this.state.set(idx, record));
        });
    }
    getSenderKey(sender, distributionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const idx = distributionId + '::' + sender.name() + '::' + sender.deviceId();
            if (this.state.has(idx)) {
                return Promise.resolve(this.state.get(idx));
            }
            else {
                return Promise.resolve(null);
            }
        });
    }
}
describe('SignalClient', () => {
    it('HKDF test vector', () => {
        const secret = Buffer.from('0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B', 'hex');
        const empty = Buffer.from('', 'hex');
        chai_1.assert.deepEqual(SignalClient.hkdf(42, secret, empty, empty).toString('hex'), '8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8');
        chai_1.assert.deepEqual(SignalClient.hkdf(42, secret, empty, null).toString('hex'), '8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8');
        const salt = Buffer.from('000102030405060708090A0B0C', 'hex');
        const label = Buffer.from('F0F1F2F3F4F5F6F7F8F9', 'hex');
        chai_1.assert.deepEqual(SignalClient.hkdf(42, secret, label, salt).toString('hex'), '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
    });
    it('ProtocolAddress', () => {
        const addr = SignalClient.ProtocolAddress.new('name', 42);
        chai_1.assert.deepEqual(addr.name(), 'name');
        chai_1.assert.deepEqual(addr.deviceId(), 42);
    });
    it('Fingerprint', () => {
        const aliceKey = SignalClient.PublicKey.deserialize(Buffer.from('0506863bc66d02b40d27b8d49ca7c09e9239236f9d7d25d6fcca5ce13c7064d868', 'hex'));
        const aliceIdentifier = Buffer.from('+14152222222', 'utf8');
        const bobKey = SignalClient.PublicKey.deserialize(Buffer.from('05f781b6fb32fed9ba1cf2de978d4d5da28dc34046ae814402b5c0dbd96fda907b', 'hex'));
        const bobIdentifier = Buffer.from('+14153333333', 'utf8');
        const iterations = 5200;
        const aFprint1 = SignalClient.Fingerprint.new(iterations, 1, aliceIdentifier, aliceKey, bobIdentifier, bobKey);
        chai_1.assert.deepEqual(aFprint1.scannableFingerprint().toBuffer().toString('hex'), '080112220a201e301a0353dce3dbe7684cb8336e85136cdc0ee96219494ada305d62a7bd61df1a220a20d62cbf73a11592015b6b9f1682ac306fea3aaf3885b84d12bca631e9d4fb3a4d');
        chai_1.assert.deepEqual(aFprint1.displayableFingerprint().toString(), '300354477692869396892869876765458257569162576843440918079131');
        const bFprint1 = SignalClient.Fingerprint.new(iterations, 1, bobIdentifier, bobKey, aliceIdentifier, aliceKey);
        chai_1.assert.deepEqual(bFprint1.scannableFingerprint().toBuffer().toString('hex'), '080112220a20d62cbf73a11592015b6b9f1682ac306fea3aaf3885b84d12bca631e9d4fb3a4d1a220a201e301a0353dce3dbe7684cb8336e85136cdc0ee96219494ada305d62a7bd61df');
        chai_1.assert.deepEqual(bFprint1.displayableFingerprint().toString(), '300354477692869396892869876765458257569162576843440918079131');
        (0, chai_1.assert)(aFprint1.scannableFingerprint().compare(bFprint1.scannableFingerprint()));
        (0, chai_1.assert)(bFprint1.scannableFingerprint().compare(aFprint1.scannableFingerprint()));
        chai_1.assert.isNotTrue(aFprint1.scannableFingerprint().compare(aFprint1.scannableFingerprint()));
        chai_1.assert.isNotTrue(bFprint1.scannableFingerprint().compare(bFprint1.scannableFingerprint()));
    });
    it('SenderCertificate', () => {
        const trustRoot = SignalClient.PrivateKey.generate();
        const serverKey = SignalClient.PrivateKey.generate();
        const keyId = 23;
        const serverCert = SignalClient.ServerCertificate.new(keyId, serverKey.getPublicKey(), trustRoot);
        chai_1.assert.deepEqual(serverCert.keyId(), keyId);
        chai_1.assert.deepEqual(serverCert.key(), serverKey.getPublicKey());
        const serverCertFromBytes = SignalClient.ServerCertificate.deserialize(serverCert.serialize());
        chai_1.assert.deepEqual(serverCert, serverCertFromBytes);
        const senderUuid = 'fedfe51e-2b91-4156-8710-7cc1bdd57cd8';
        const senderE164 = '555-123-4567';
        const senderDeviceId = 9;
        const senderKey = SignalClient.PrivateKey.generate();
        const expiration = 2114398800; // Jan 1, 2037
        const senderCert = SignalClient.SenderCertificate.new(senderUuid, senderE164, senderDeviceId, senderKey.getPublicKey(), expiration, serverCert, serverKey);
        chai_1.assert.deepEqual(senderCert.serverCertificate(), serverCert);
        chai_1.assert.deepEqual(senderCert.senderUuid(), senderUuid);
        chai_1.assert.deepEqual(senderCert.senderE164(), senderE164);
        chai_1.assert.deepEqual(senderCert.senderDeviceId(), senderDeviceId);
        const senderCertFromBytes = SignalClient.SenderCertificate.deserialize(senderCert.serialize());
        chai_1.assert.deepEqual(senderCert, senderCertFromBytes);
        (0, chai_1.assert)(senderCert.validate(trustRoot.getPublicKey(), expiration - 1000));
        (0, chai_1.assert)(!senderCert.validate(trustRoot.getPublicKey(), expiration + 10)); // expired
    });
    it('SenderKeyMessage', () => {
        const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
        const chainId = 9;
        const iteration = 101;
        const ciphertext = Buffer.alloc(32, 0xfe);
        const pk = SignalClient.PrivateKey.generate();
        const skm = SignalClient.SenderKeyMessage._new(3, distributionId, chainId, iteration, ciphertext, pk);
        chai_1.assert.deepEqual(skm.distributionId(), distributionId);
        chai_1.assert.deepEqual(skm.chainId(), chainId);
        chai_1.assert.deepEqual(skm.iteration(), iteration);
        chai_1.assert.deepEqual(skm.ciphertext(), ciphertext);
        (0, chai_1.assert)(skm.verifySignature(pk.getPublicKey()));
        const skmFromBytes = SignalClient.SenderKeyMessage.deserialize(skm.serialize());
        chai_1.assert.deepEqual(skm, skmFromBytes);
    });
    it('SenderKeyDistributionMessage', () => {
        const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
        const chainId = 9;
        const iteration = 101;
        const chainKey = Buffer.alloc(32, 0xfe);
        const pk = SignalClient.PrivateKey.generate();
        const skdm = SignalClient.SenderKeyDistributionMessage._new(3, distributionId, chainId, iteration, chainKey, pk.getPublicKey());
        chai_1.assert.deepEqual(skdm.distributionId(), distributionId);
        chai_1.assert.deepEqual(skdm.chainId(), chainId);
        chai_1.assert.deepEqual(skdm.iteration(), iteration);
        chai_1.assert.deepEqual(skdm.chainKey(), chainKey);
        const skdmFromBytes = SignalClient.SenderKeyDistributionMessage.deserialize(skdm.serialize());
        chai_1.assert.deepEqual(skdm, skdmFromBytes);
    });
    describe('SenderKeyDistributionMessage Store API', () => {
        it('can encrypt and decrypt', () => __awaiter(void 0, void 0, void 0, function* () {
            const sender = SignalClient.ProtocolAddress.new('sender', 1);
            const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
            const aSenderKeyStore = new InMemorySenderKeyStore();
            const skdm = yield SignalClient.SenderKeyDistributionMessage.create(sender, distributionId, aSenderKeyStore);
            const bSenderKeyStore = new InMemorySenderKeyStore();
            yield SignalClient.processSenderKeyDistributionMessage(sender, skdm, bSenderKeyStore);
            const message = Buffer.from('0a0b0c', 'hex');
            const aCtext = yield SignalClient.groupEncrypt(sender, distributionId, aSenderKeyStore, message);
            const bPtext = yield SignalClient.groupDecrypt(sender, bSenderKeyStore, aCtext.serialize());
            chai_1.assert.deepEqual(message, bPtext);
        }));
        it("does not panic if there's an error", () => __awaiter(void 0, void 0, void 0, function* () {
            const sender = SignalClient.ProtocolAddress.new('sender', 1);
            const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
            const aSenderKeyStore = new InMemorySenderKeyStore();
            const messagePromise = SignalClient.SenderKeyDistributionMessage.create(sender, distributionId, undefined);
            yield chai_1.assert.isRejected(messagePromise, TypeError);
            const messagePromise2 = SignalClient.SenderKeyDistributionMessage.create({}, distributionId, aSenderKeyStore);
            yield chai_1.assert.isRejected(messagePromise2, TypeError);
        }));
    });
    it('PublicKeyBundle', () => {
        const registrationId = 5;
        const deviceId = 23;
        const prekeyId = 42;
        const prekey = SignalClient.PrivateKey.generate().getPublicKey();
        const signedPrekeyId = 2300;
        const signedPrekey = SignalClient.PrivateKey.generate().getPublicKey();
        const signedPrekeySignature = SignalClient.PrivateKey.generate().sign(Buffer.from('010203', 'hex'));
        const identityKey = SignalClient.PrivateKey.generate().getPublicKey();
        const pkb = SignalClient.PreKeyBundle.new(registrationId, deviceId, prekeyId, prekey, signedPrekeyId, signedPrekey, signedPrekeySignature, identityKey);
        chai_1.assert.deepEqual(pkb.registrationId(), registrationId);
        chai_1.assert.deepEqual(pkb.deviceId(), deviceId);
        chai_1.assert.deepEqual(pkb.preKeyId(), prekeyId);
        chai_1.assert.deepEqual(pkb.preKeyPublic(), prekey);
        chai_1.assert.deepEqual(pkb.signedPreKeyId(), signedPrekeyId);
        chai_1.assert.deepEqual(pkb.signedPreKeyPublic(), signedPrekey);
        chai_1.assert.deepEqual(pkb.signedPreKeySignature(), signedPrekeySignature);
        chai_1.assert.deepEqual(pkb.identityKey(), identityKey);
        // null handling:
        const pkb2 = SignalClient.PreKeyBundle.new(registrationId, deviceId, null, null, signedPrekeyId, signedPrekey, signedPrekeySignature, identityKey);
        chai_1.assert.deepEqual(pkb2.registrationId(), registrationId);
        chai_1.assert.deepEqual(pkb2.deviceId(), deviceId);
        chai_1.assert.deepEqual(pkb2.preKeyId(), null);
        chai_1.assert.deepEqual(pkb2.preKeyPublic(), null);
        chai_1.assert.deepEqual(pkb2.signedPreKeyId(), signedPrekeyId);
        chai_1.assert.deepEqual(pkb2.signedPreKeyPublic(), signedPrekey);
        chai_1.assert.deepEqual(pkb2.signedPreKeySignature(), signedPrekeySignature);
        chai_1.assert.deepEqual(pkb2.identityKey(), identityKey);
    });
    it('PreKeyRecord', () => {
        const privKey = SignalClient.PrivateKey.generate();
        const pubKey = privKey.getPublicKey();
        const pkr = SignalClient.PreKeyRecord.new(23, pubKey, privKey);
        chai_1.assert.deepEqual(pkr.id(), 23);
        chai_1.assert.deepEqual(pkr.publicKey(), pubKey);
        chai_1.assert.deepEqual(pkr.privateKey(), privKey);
        const pkr2 = SignalClient.PreKeyRecord.deserialize(pkr.serialize());
        chai_1.assert.deepEqual(pkr2.id(), 23);
        chai_1.assert.deepEqual(pkr2.publicKey(), pubKey);
        chai_1.assert.deepEqual(pkr2.privateKey(), privKey);
    });
    it('SignedPreKeyRecord', () => {
        const privKey = SignalClient.PrivateKey.generate();
        const pubKey = privKey.getPublicKey();
        const timestamp = 9000;
        const keyId = 23;
        const signature = Buffer.alloc(64, 64);
        const spkr = SignalClient.SignedPreKeyRecord.new(keyId, timestamp, pubKey, privKey, signature);
        chai_1.assert.deepEqual(spkr.id(), keyId);
        chai_1.assert.deepEqual(spkr.timestamp(), timestamp);
        chai_1.assert.deepEqual(spkr.publicKey(), pubKey);
        chai_1.assert.deepEqual(spkr.privateKey(), privKey);
        chai_1.assert.deepEqual(spkr.signature(), signature);
        const spkrFromBytes = SignalClient.SignedPreKeyRecord.deserialize(spkr.serialize());
        chai_1.assert.deepEqual(spkrFromBytes, spkr);
    });
    it('SignalMessage and PreKeySignalMessage', () => {
        const messageVersion = 3;
        const macKey = Buffer.alloc(32, 0xab);
        const senderRatchetKey = SignalClient.PrivateKey.generate().getPublicKey();
        const counter = 9;
        const previousCounter = 8;
        const senderIdentityKey = SignalClient.PrivateKey.generate().getPublicKey();
        const receiverIdentityKey = SignalClient.PrivateKey.generate().getPublicKey();
        const ciphertext = Buffer.from('01020304', 'hex');
        const sm = SignalClient.SignalMessage._new(messageVersion, macKey, senderRatchetKey, counter, previousCounter, ciphertext, senderIdentityKey, receiverIdentityKey);
        chai_1.assert.deepEqual(sm.counter(), counter);
        chai_1.assert.deepEqual(sm.messageVersion(), messageVersion);
        const sm_bytes = sm.serialize();
        const sm2 = SignalClient.SignalMessage.deserialize(sm_bytes);
        chai_1.assert.deepEqual(sm.body(), sm2.body());
        const registrationId = 9;
        const preKeyId = 23;
        const signedPreKeyId = 802;
        const baseKey = SignalClient.PrivateKey.generate().getPublicKey();
        const identityKey = SignalClient.PrivateKey.generate().getPublicKey();
        const pkm = SignalClient.PreKeySignalMessage._new(messageVersion, registrationId, preKeyId, signedPreKeyId, baseKey, identityKey, sm);
        chai_1.assert.deepEqual(pkm.preKeyId(), preKeyId);
        chai_1.assert.deepEqual(pkm.registrationId(), registrationId);
        chai_1.assert.deepEqual(pkm.signedPreKeyId(), signedPreKeyId);
        chai_1.assert.deepEqual(pkm.version(), messageVersion);
        const pkm_bytes = pkm.serialize();
        const pkm2 = SignalClient.PreKeySignalMessage.deserialize(pkm_bytes);
        chai_1.assert.deepEqual(pkm2.serialize(), pkm_bytes);
    });
    it('BasicPreKeyMessaging', () => __awaiter(void 0, void 0, void 0, function* () {
        // basic_prekey_v3 in Rust
        const aKeys = new InMemoryIdentityKeyStore();
        const bKeys = new InMemoryIdentityKeyStore();
        const aSess = new InMemorySessionStore();
        const bSess = new InMemorySessionStore();
        const bPreK = new InMemoryPreKeyStore();
        const bSPreK = new InMemorySignedPreKeyStore();
        const bPreKey = SignalClient.PrivateKey.generate();
        const bSPreKey = SignalClient.PrivateKey.generate();
        const bIdentityKey = yield bKeys.getIdentityKey();
        const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
        const aAddress = SignalClient.ProtocolAddress.new('+14151111111', 1);
        const bAddress = SignalClient.ProtocolAddress.new('+19192222222', 1);
        const bRegistrationId = yield bKeys.getLocalRegistrationId();
        const bPreKeyId = 31337;
        const bSignedPreKeyId = 22;
        const bPreKeyBundle = SignalClient.PreKeyBundle.new(bRegistrationId, bAddress.deviceId(), bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
        const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
        bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
        const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
        bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
        bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
        yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
        const aMessage = Buffer.from('Greetings hoo-man', 'utf8');
        const aCiphertext = yield SignalClient.signalEncrypt(aMessage, bAddress, aSess, aKeys);
        chai_1.assert.deepEqual(aCiphertext.type(), SignalClient.CiphertextMessageType.PreKey);
        const aCiphertextR = SignalClient.PreKeySignalMessage.deserialize(aCiphertext.serialize());
        const bDPlaintext = yield SignalClient.signalDecryptPreKey(aCiphertextR, aAddress, bSess, bKeys, bPreK, bSPreK);
        chai_1.assert.deepEqual(bDPlaintext, aMessage);
        const bMessage = Buffer.from('Sometimes the only thing more dangerous than a question is an answer.', 'utf8');
        const bCiphertext = yield SignalClient.signalEncrypt(bMessage, aAddress, bSess, bKeys);
        chai_1.assert.deepEqual(bCiphertext.type(), SignalClient.CiphertextMessageType.Whisper);
        const bCiphertextR = SignalClient.SignalMessage.deserialize(bCiphertext.serialize());
        const aDPlaintext = yield SignalClient.signalDecrypt(bCiphertextR, bAddress, aSess, aKeys);
        chai_1.assert.deepEqual(aDPlaintext, bMessage);
        const session = yield bSess.getSession(aAddress);
        (0, chai_1.assert)(session !== null);
        (0, chai_1.assert)(session.serialize().length > 0);
        chai_1.assert.deepEqual(session.localRegistrationId(), 5);
        chai_1.assert.deepEqual(session.remoteRegistrationId(), 5);
        (0, chai_1.assert)(session.hasCurrentState());
        (0, chai_1.assert)(!session.currentRatchetKeyMatches(SignalClient.PrivateKey.generate().getPublicKey()));
        session.archiveCurrentState();
        (0, chai_1.assert)(!session.hasCurrentState());
        (0, chai_1.assert)(!session.currentRatchetKeyMatches(SignalClient.PrivateKey.generate().getPublicKey()));
    }));
    it('handles duplicated messages', () => __awaiter(void 0, void 0, void 0, function* () {
        const aKeys = new InMemoryIdentityKeyStore();
        const bKeys = new InMemoryIdentityKeyStore();
        const aSess = new InMemorySessionStore();
        const bSess = new InMemorySessionStore();
        const bPreK = new InMemoryPreKeyStore();
        const bSPreK = new InMemorySignedPreKeyStore();
        const bPreKey = SignalClient.PrivateKey.generate();
        const bSPreKey = SignalClient.PrivateKey.generate();
        const bIdentityKey = yield bKeys.getIdentityKey();
        const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
        const aAddress = SignalClient.ProtocolAddress.new('+14151111111', 1);
        const bAddress = SignalClient.ProtocolAddress.new('+19192222222', 1);
        const bRegistrationId = yield bKeys.getLocalRegistrationId();
        const bPreKeyId = 31337;
        const bSignedPreKeyId = 22;
        const bPreKeyBundle = SignalClient.PreKeyBundle.new(bRegistrationId, bAddress.deviceId(), bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
        const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
        bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
        const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
        bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
        bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
        yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
        const aMessage = Buffer.from('Greetings hoo-man', 'utf8');
        const aCiphertext = yield SignalClient.signalEncrypt(aMessage, bAddress, aSess, aKeys);
        chai_1.assert.deepEqual(aCiphertext.type(), SignalClient.CiphertextMessageType.PreKey);
        const aCiphertextR = SignalClient.PreKeySignalMessage.deserialize(aCiphertext.serialize());
        const bDPlaintext = yield SignalClient.signalDecryptPreKey(aCiphertextR, aAddress, bSess, bKeys, bPreK, bSPreK);
        chai_1.assert.deepEqual(bDPlaintext, aMessage);
        try {
            yield SignalClient.signalDecryptPreKey(aCiphertextR, aAddress, bSess, bKeys, bPreK, bSPreK);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.name, 'DuplicatedMessage');
            chai_1.assert.equal(err.code, SignalClient.ErrorCode.DuplicatedMessage);
            chai_1.assert.equal(err.operation, 'SessionCipher_DecryptPreKeySignalMessage'); // the Rust entry point
            chai_1.assert.exists(err.stack); // Make sure we're still getting the benefits of Error.
        }
        const bMessage = Buffer.from('Sometimes the only thing more dangerous than a question is an answer.', 'utf8');
        const bCiphertext = yield SignalClient.signalEncrypt(bMessage, aAddress, bSess, bKeys);
        chai_1.assert.deepEqual(bCiphertext.type(), SignalClient.CiphertextMessageType.Whisper);
        const bCiphertextR = SignalClient.SignalMessage.deserialize(bCiphertext.serialize());
        const aDPlaintext = yield SignalClient.signalDecrypt(bCiphertextR, bAddress, aSess, aKeys);
        chai_1.assert.deepEqual(aDPlaintext, bMessage);
        try {
            yield SignalClient.signalDecrypt(bCiphertextR, bAddress, aSess, aKeys);
            chai_1.assert.fail();
        }
        catch (e) {
            chai_1.assert.instanceOf(e, Error);
            chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
            const err = e;
            chai_1.assert.equal(err.name, 'DuplicatedMessage');
            chai_1.assert.equal(err.code, SignalClient.ErrorCode.DuplicatedMessage);
            chai_1.assert.equal(err.operation, 'SessionCipher_DecryptSignalMessage'); // the Rust entry point
            chai_1.assert.exists(err.stack); // Make sure we're still getting the benefits of Error.
        }
    }));
    describe('SealedSender', () => {
        it('can encrypt/decrypt 1-1 messages', () => __awaiter(void 0, void 0, void 0, function* () {
            const aKeys = new InMemoryIdentityKeyStore();
            const bKeys = new InMemoryIdentityKeyStore();
            const aSess = new InMemorySessionStore();
            const bSess = new InMemorySessionStore();
            const bPreK = new InMemoryPreKeyStore();
            const bSPreK = new InMemorySignedPreKeyStore();
            const bPreKey = SignalClient.PrivateKey.generate();
            const bSPreKey = SignalClient.PrivateKey.generate();
            const aIdentityKey = yield aKeys.getIdentityKey();
            const bIdentityKey = yield bKeys.getIdentityKey();
            const aE164 = '+14151111111';
            const bE164 = '+19192222222';
            const aDeviceId = 1;
            const bDeviceId = 3;
            const aUuid = '9d0652a3-dcc3-4d11-975f-74d61598733f';
            const bUuid = '796abedb-ca4e-4f18-8803-1fde5b921f9f';
            const trustRoot = SignalClient.PrivateKey.generate();
            const serverKey = SignalClient.PrivateKey.generate();
            const serverCert = SignalClient.ServerCertificate.new(1, serverKey.getPublicKey(), trustRoot);
            const expires = 1605722925;
            const senderCert = SignalClient.SenderCertificate.new(aUuid, aE164, aDeviceId, aIdentityKey.getPublicKey(), expires, serverCert, serverKey);
            const bRegistrationId = yield bKeys.getLocalRegistrationId();
            const bPreKeyId = 31337;
            const bSignedPreKeyId = 22;
            const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
            const bPreKeyBundle = SignalClient.PreKeyBundle.new(bRegistrationId, bDeviceId, bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
            const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
            bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
            const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
            bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
            bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
            const bAddress = SignalClient.ProtocolAddress.new(bUuid, bDeviceId);
            yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
            const aPlaintext = Buffer.from('hi there', 'utf8');
            const aCiphertext = yield SignalClient.sealedSenderEncryptMessage(aPlaintext, bAddress, senderCert, aSess, aKeys);
            const bPlaintext = yield SignalClient.sealedSenderDecryptMessage(aCiphertext, trustRoot.getPublicKey(), 43, // timestamp,
            bE164, bUuid, bDeviceId, bSess, bKeys, bPreK, bSPreK);
            (0, chai_1.assert)(bPlaintext != null);
            chai_1.assert.deepEqual(bPlaintext.message(), aPlaintext);
            chai_1.assert.deepEqual(bPlaintext.senderE164(), aE164);
            chai_1.assert.deepEqual(bPlaintext.senderUuid(), aUuid);
            chai_1.assert.deepEqual(bPlaintext.deviceId(), aDeviceId);
            const innerMessage = yield SignalClient.signalEncrypt(aPlaintext, bAddress, aSess, aKeys);
            for (const hint of [
                200,
                SignalClient.ContentHint.Default,
                SignalClient.ContentHint.Resendable,
                SignalClient.ContentHint.Implicit,
            ]) {
                const content = SignalClient.UnidentifiedSenderMessageContent.new(innerMessage, senderCert, hint, null);
                const ciphertext = yield SignalClient.sealedSenderEncrypt(content, bAddress, aKeys);
                const decryptedContent = yield SignalClient.sealedSenderDecryptToUsmc(ciphertext, bKeys);
                chai_1.assert.deepEqual(decryptedContent.contentHint(), hint);
            }
        }));
        it('rejects self-sent messages', () => __awaiter(void 0, void 0, void 0, function* () {
            const sharedKeys = new InMemoryIdentityKeyStore();
            const aSess = new InMemorySessionStore();
            const bSess = new InMemorySessionStore();
            const bPreK = new InMemoryPreKeyStore();
            const bSPreK = new InMemorySignedPreKeyStore();
            const bPreKey = SignalClient.PrivateKey.generate();
            const bSPreKey = SignalClient.PrivateKey.generate();
            const sharedIdentityKey = yield sharedKeys.getIdentityKey();
            const aE164 = '+14151111111';
            const sharedDeviceId = 1;
            const sharedUuid = '9d0652a3-dcc3-4d11-975f-74d61598733f';
            const trustRoot = SignalClient.PrivateKey.generate();
            const serverKey = SignalClient.PrivateKey.generate();
            const serverCert = SignalClient.ServerCertificate.new(1, serverKey.getPublicKey(), trustRoot);
            const expires = 1605722925;
            const senderCert = SignalClient.SenderCertificate.new(sharedUuid, aE164, sharedDeviceId, sharedIdentityKey.getPublicKey(), expires, serverCert, serverKey);
            const sharedRegistrationId = yield sharedKeys.getLocalRegistrationId();
            const bPreKeyId = 31337;
            const bSignedPreKeyId = 22;
            const bSignedPreKeySig = sharedIdentityKey.sign(bSPreKey.getPublicKey().serialize());
            const bPreKeyBundle = SignalClient.PreKeyBundle.new(sharedRegistrationId, sharedDeviceId, bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, sharedIdentityKey.getPublicKey());
            const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
            bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
            const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
            bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
            bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
            const sharedAddress = SignalClient.ProtocolAddress.new(sharedUuid, sharedDeviceId);
            yield SignalClient.processPreKeyBundle(bPreKeyBundle, sharedAddress, aSess, sharedKeys);
            const aPlaintext = Buffer.from('hi there', 'utf8');
            const aCiphertext = yield SignalClient.sealedSenderEncryptMessage(aPlaintext, sharedAddress, senderCert, aSess, sharedKeys);
            try {
                yield SignalClient.sealedSenderDecryptMessage(aCiphertext, trustRoot.getPublicKey(), 43, // timestamp,
                null, sharedUuid, sharedDeviceId, bSess, sharedKeys, bPreK, bSPreK);
                chai_1.assert.fail();
            }
            catch (e) {
                chai_1.assert.instanceOf(e, Error);
                chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
                const err = e;
                chai_1.assert.equal(err.name, 'SealedSenderSelfSend');
                chai_1.assert.equal(err.code, SignalClient.ErrorCode.SealedSenderSelfSend);
                chai_1.assert.equal(err.operation, 'SealedSender_DecryptMessage'); // the Rust entry point
                chai_1.assert.exists(err.stack); // Make sure we're still getting the benefits of Error.
            }
        }));
        it('can encrypt/decrypt group messages', () => __awaiter(void 0, void 0, void 0, function* () {
            const aKeys = new InMemoryIdentityKeyStore();
            const bKeys = new InMemoryIdentityKeyStore();
            const aSess = new InMemorySessionStore();
            const bPreK = new InMemoryPreKeyStore();
            const bSPreK = new InMemorySignedPreKeyStore();
            const bPreKey = SignalClient.PrivateKey.generate();
            const bSPreKey = SignalClient.PrivateKey.generate();
            const aIdentityKey = yield aKeys.getIdentityKey();
            const bIdentityKey = yield bKeys.getIdentityKey();
            const aE164 = '+14151111111';
            const aDeviceId = 1;
            const bDeviceId = 3;
            const aUuid = '9d0652a3-dcc3-4d11-975f-74d61598733f';
            const bUuid = '796abedb-ca4e-4f18-8803-1fde5b921f9f';
            const trustRoot = SignalClient.PrivateKey.generate();
            const serverKey = SignalClient.PrivateKey.generate();
            const serverCert = SignalClient.ServerCertificate.new(1, serverKey.getPublicKey(), trustRoot);
            const expires = 1605722925;
            const senderCert = SignalClient.SenderCertificate.new(aUuid, aE164, aDeviceId, aIdentityKey.getPublicKey(), expires, serverCert, serverKey);
            const bRegistrationId = yield bKeys.getLocalRegistrationId();
            const bPreKeyId = 31337;
            const bSignedPreKeyId = 22;
            const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
            const bPreKeyBundle = SignalClient.PreKeyBundle.new(bRegistrationId, bDeviceId, bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
            const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
            bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
            const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
            bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
            bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
            const bAddress = SignalClient.ProtocolAddress.new(bUuid, bDeviceId);
            yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
            const aAddress = SignalClient.ProtocolAddress.new(aUuid, aDeviceId);
            const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
            const aSenderKeyStore = new InMemorySenderKeyStore();
            const skdm = yield SignalClient.SenderKeyDistributionMessage.create(aAddress, distributionId, aSenderKeyStore);
            const bSenderKeyStore = new InMemorySenderKeyStore();
            yield SignalClient.processSenderKeyDistributionMessage(aAddress, skdm, bSenderKeyStore);
            const message = Buffer.from('0a0b0c', 'hex');
            const aCtext = yield SignalClient.groupEncrypt(aAddress, distributionId, aSenderKeyStore, message);
            const aUsmc = SignalClient.UnidentifiedSenderMessageContent.new(aCtext, senderCert, SignalClient.ContentHint.Implicit, Buffer.from([42]));
            const aSealedSenderMessage = yield SignalClient.sealedSenderMultiRecipientEncrypt(aUsmc, [bAddress], aKeys, aSess);
            const bSealedSenderMessage = SignalClient.sealedSenderMultiRecipientMessageForSingleRecipient(aSealedSenderMessage);
            const bUsmc = yield SignalClient.sealedSenderDecryptToUsmc(bSealedSenderMessage, bKeys);
            chai_1.assert.deepEqual(bUsmc.senderCertificate().senderE164(), aE164);
            chai_1.assert.deepEqual(bUsmc.senderCertificate().senderUuid(), aUuid);
            chai_1.assert.deepEqual(bUsmc.senderCertificate().senderDeviceId(), aDeviceId);
            chai_1.assert.deepEqual(bUsmc.contentHint(), SignalClient.ContentHint.Implicit);
            chai_1.assert.deepEqual(bUsmc.groupId(), Buffer.from([42]));
            const bPtext = yield SignalClient.groupDecrypt(aAddress, bSenderKeyStore, bUsmc.contents());
            chai_1.assert.deepEqual(message, bPtext);
        }));
        it('rejects invalid registration IDs', () => __awaiter(void 0, void 0, void 0, function* () {
            const aKeys = new InMemoryIdentityKeyStore();
            const bKeys = new InMemoryIdentityKeyStore(0x4000);
            const aSess = new InMemorySessionStore();
            const bPreKey = SignalClient.PrivateKey.generate();
            const bSPreKey = SignalClient.PrivateKey.generate();
            const aIdentityKey = yield aKeys.getIdentityKey();
            const bIdentityKey = yield bKeys.getIdentityKey();
            const aE164 = '+14151111111';
            const aDeviceId = 1;
            const bDeviceId = 3;
            const aUuid = '9d0652a3-dcc3-4d11-975f-74d61598733f';
            const bUuid = '796abedb-ca4e-4f18-8803-1fde5b921f9f';
            const trustRoot = SignalClient.PrivateKey.generate();
            const serverKey = SignalClient.PrivateKey.generate();
            const serverCert = SignalClient.ServerCertificate.new(1, serverKey.getPublicKey(), trustRoot);
            const expires = 1605722925;
            const senderCert = SignalClient.SenderCertificate.new(aUuid, aE164, aDeviceId, aIdentityKey.getPublicKey(), expires, serverCert, serverKey);
            const bPreKeyId = 31337;
            const bSignedPreKeyId = 22;
            const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
            const bPreKeyBundle = SignalClient.PreKeyBundle.new(0x4000, bDeviceId, bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
            const bAddress = SignalClient.ProtocolAddress.new(bUuid, bDeviceId);
            yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
            const aAddress = SignalClient.ProtocolAddress.new(aUuid, aDeviceId);
            const distributionId = 'd1d1d1d1-7000-11eb-b32a-33b8a8a487a6';
            const aSenderKeyStore = new InMemorySenderKeyStore();
            yield SignalClient.SenderKeyDistributionMessage.create(aAddress, distributionId, aSenderKeyStore);
            const message = Buffer.from('0a0b0c', 'hex');
            const aCtext = yield SignalClient.groupEncrypt(aAddress, distributionId, aSenderKeyStore, message);
            const aUsmc = SignalClient.UnidentifiedSenderMessageContent.new(aCtext, senderCert, SignalClient.ContentHint.Implicit, Buffer.from([42]));
            try {
                yield SignalClient.sealedSenderMultiRecipientEncrypt(aUsmc, [bAddress], aKeys, aSess);
                chai_1.assert.fail('should have thrown');
            }
            catch (e) {
                chai_1.assert.instanceOf(e, Error);
                chai_1.assert.instanceOf(e, SignalClient.LibSignalErrorBase);
                const err = e;
                chai_1.assert.equal(err.name, 'InvalidRegistrationId');
                chai_1.assert.equal(err.code, SignalClient.ErrorCode.InvalidRegistrationId);
                chai_1.assert.exists(err.stack); // Make sure we're still getting the benefits of Error.
                const registrationIdErr = err;
                chai_1.assert.equal(registrationIdErr.addr.name(), bAddress.name());
                chai_1.assert.equal(registrationIdErr.addr.deviceId(), bAddress.deviceId());
            }
        }));
    });
    it('DecryptionMessageError', () => __awaiter(void 0, void 0, void 0, function* () {
        const aKeys = new InMemoryIdentityKeyStore();
        const bKeys = new InMemoryIdentityKeyStore();
        const aSess = new InMemorySessionStore();
        const bSess = new InMemorySessionStore();
        const bPreK = new InMemoryPreKeyStore();
        const bSPreK = new InMemorySignedPreKeyStore();
        const bPreKey = SignalClient.PrivateKey.generate();
        const bSPreKey = SignalClient.PrivateKey.generate();
        const aIdentityKey = yield aKeys.getIdentityKey();
        const bIdentityKey = yield bKeys.getIdentityKey();
        const aE164 = '+14151111111';
        const aDeviceId = 1;
        const bDeviceId = 3;
        const aUuid = '9d0652a3-dcc3-4d11-975f-74d61598733f';
        const bUuid = '796abedb-ca4e-4f18-8803-1fde5b921f9f';
        const trustRoot = SignalClient.PrivateKey.generate();
        const serverKey = SignalClient.PrivateKey.generate();
        const serverCert = SignalClient.ServerCertificate.new(1, serverKey.getPublicKey(), trustRoot);
        const expires = 1605722925;
        const senderCert = SignalClient.SenderCertificate.new(aUuid, aE164, aDeviceId, aIdentityKey.getPublicKey(), expires, serverCert, serverKey);
        const bRegistrationId = yield bKeys.getLocalRegistrationId();
        const bPreKeyId = 31337;
        const bSignedPreKeyId = 22;
        const bSignedPreKeySig = bIdentityKey.sign(bSPreKey.getPublicKey().serialize());
        const bPreKeyBundle = SignalClient.PreKeyBundle.new(bRegistrationId, bDeviceId, bPreKeyId, bPreKey.getPublicKey(), bSignedPreKeyId, bSPreKey.getPublicKey(), bSignedPreKeySig, bIdentityKey.getPublicKey());
        const bPreKeyRecord = SignalClient.PreKeyRecord.new(bPreKeyId, bPreKey.getPublicKey(), bPreKey);
        bPreK.savePreKey(bPreKeyId, bPreKeyRecord);
        const bSPreKeyRecord = SignalClient.SignedPreKeyRecord.new(bSignedPreKeyId, 42, // timestamp
        bSPreKey.getPublicKey(), bSPreKey, bSignedPreKeySig);
        bSPreK.saveSignedPreKey(bSignedPreKeyId, bSPreKeyRecord);
        // Set up the session with a message from A to B.
        const bAddress = SignalClient.ProtocolAddress.new(bUuid, bDeviceId);
        yield SignalClient.processPreKeyBundle(bPreKeyBundle, bAddress, aSess, aKeys);
        const aPlaintext = Buffer.from('hi there', 'utf8');
        const aCiphertext = yield SignalClient.sealedSenderEncryptMessage(aPlaintext, bAddress, senderCert, aSess, aKeys);
        yield SignalClient.sealedSenderDecryptMessage(aCiphertext, trustRoot.getPublicKey(), 43, // timestamp,
        null, bUuid, bDeviceId, bSess, bKeys, bPreK, bSPreK);
        // Pretend to send a message from B back to A that "fails".
        const aAddress = SignalClient.ProtocolAddress.new(aUuid, aDeviceId);
        const bCiphertext = yield SignalClient.signalEncrypt(Buffer.from('reply', 'utf8'), aAddress, bSess, bKeys);
        const errorMessage = SignalClient.DecryptionErrorMessage.forOriginal(bCiphertext.serialize(), bCiphertext.type(), 45, // timestamp
        bAddress.deviceId());
        const errorContent = SignalClient.PlaintextContent.from(errorMessage);
        const errorUSMC = SignalClient.UnidentifiedSenderMessageContent.new(SignalClient.CiphertextMessage.from(errorContent), senderCert, SignalClient.ContentHint.Implicit, null // group ID
        );
        const errorSealedSenderMessage = yield SignalClient.sealedSenderEncrypt(errorUSMC, bAddress, aKeys);
        const bErrorUSMC = yield SignalClient.sealedSenderDecryptToUsmc(errorSealedSenderMessage, bKeys);
        chai_1.assert.equal(bErrorUSMC.msgType(), SignalClient.CiphertextMessageType.Plaintext);
        const bErrorContent = SignalClient.PlaintextContent.deserialize(bErrorUSMC.contents());
        const bErrorMessage = SignalClient.DecryptionErrorMessage.extractFromSerializedBody(bErrorContent.body());
        chai_1.assert.equal(bErrorMessage.timestamp(), 45);
        chai_1.assert.equal(bErrorMessage.deviceId(), bAddress.deviceId());
        const bSessionWithA = yield bSess.getSession(aAddress);
        (0, chai_1.assert)(bSessionWithA === null || bSessionWithA === void 0 ? void 0 : bSessionWithA.currentRatchetKeyMatches(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bErrorMessage.ratchetKey()));
    }));
    it('AES-GCM-SIV test vector', () => {
        // RFC 8452, appendix C.2
        const key = Buffer.from('0100000000000000000000000000000000000000000000000000000000000000', 'hex');
        const aes_gcm_siv = SignalClient.Aes256GcmSiv.new(key);
        const nonce = Buffer.from('030000000000000000000000', 'hex');
        const aad = Buffer.from('010000000000000000000000', 'hex');
        const ptext = Buffer.from('02000000', 'hex');
        const ctext = aes_gcm_siv.encrypt(ptext, nonce, aad);
        chai_1.assert.deepEqual(ctext.toString('hex'), '22b3f4cd1835e517741dfddccfa07fa4661b74cf');
        const decrypted = aes_gcm_siv.decrypt(ctext, nonce, aad);
        chai_1.assert.deepEqual(decrypted.toString('hex'), '02000000');
    });
    it('ECC signatures work', () => {
        const priv_a = SignalClient.PrivateKey.generate();
        const priv_b = SignalClient.PrivateKey.generate();
        chai_1.assert.lengthOf(priv_a.serialize(), 32, 'private key serialization length');
        chai_1.assert.deepEqual(priv_a.serialize(), priv_a.serialize(), 'repeatable');
        chai_1.assert.notDeepEqual(priv_a.serialize(), priv_b.serialize(), 'different for different keys');
        const pub_a = priv_a.getPublicKey();
        const pub_b = priv_b.getPublicKey();
        const msg = Buffer.from([1, 2, 3]);
        const sig_a = priv_a.sign(msg);
        chai_1.assert.lengthOf(sig_a, 64, 'signature length');
        (0, chai_1.assert)(pub_a.verify(msg, sig_a));
        (0, chai_1.assert)(!pub_b.verify(msg, sig_a));
        const sig_b = priv_b.sign(msg);
        chai_1.assert.lengthOf(sig_b, 64, 'signature length');
        (0, chai_1.assert)(pub_b.verify(msg, sig_b));
        (0, chai_1.assert)(!pub_a.verify(msg, sig_b));
    });
    it('ECC key agreement work', () => {
        const priv_a = SignalClient.PrivateKey.generate();
        const priv_b = SignalClient.PrivateKey.generate();
        const pub_a = priv_a.getPublicKey();
        const pub_b = priv_b.getPublicKey();
        const shared_a = priv_a.agree(pub_b);
        const shared_b = priv_b.agree(pub_a);
        chai_1.assert.deepEqual(shared_a, shared_b, 'key agreement works');
    });
    it('ECC keys roundtrip through serialization', () => {
        const key = Buffer.alloc(32, 0x40);
        const priv = SignalClient.PrivateKey.deserialize(key);
        (0, chai_1.assert)(key.equals(priv.serialize()));
        const pub = priv.getPublicKey();
        const pub_bytes = pub.serialize();
        chai_1.assert.lengthOf(pub_bytes, 32 + 1);
        const pub2 = SignalClient.PublicKey.deserialize(pub_bytes);
        chai_1.assert.deepEqual(pub.serialize(), pub2.serialize());
        chai_1.assert.deepEqual(pub.compare(pub2), 0);
        chai_1.assert.deepEqual(pub2.compare(pub), 0);
        const anotherKey = SignalClient.PrivateKey.deserialize(Buffer.alloc(32, 0xcd)).getPublicKey();
        chai_1.assert.deepEqual(pub.compare(anotherKey), 1);
        chai_1.assert.deepEqual(anotherKey.compare(pub), -1);
        chai_1.assert.lengthOf(pub.getPublicKeyBytes(), 32);
        const keyPair = new SignalClient.IdentityKeyPair(pub, priv);
        const keyPairBytes = keyPair.serialize();
        const roundTripKeyPair = SignalClient.IdentityKeyPair.deserialize(keyPairBytes);
        chai_1.assert.equal(roundTripKeyPair.publicKey.compare(pub), 0);
        const roundTripKeyPairBytes = roundTripKeyPair.serialize();
        chai_1.assert.deepEqual(keyPairBytes, roundTripKeyPairBytes);
    });
    it('decoding invalid ECC key throws an error', () => {
        const invalid_key = Buffer.alloc(33, 0xab);
        chai_1.assert.throws(() => {
            SignalClient.PrivateKey.deserialize(invalid_key);
        }, 'bad key length <33> for key with type <Djb>');
        chai_1.assert.throws(() => {
            SignalClient.PublicKey.deserialize(invalid_key);
        }, 'bad key type <0xab>');
    });
    it('can sign and verify alternate identity keys', () => {
        const primary = SignalClient.IdentityKeyPair.generate();
        const secondary = SignalClient.IdentityKeyPair.generate();
        const signature = secondary.signAlternateIdentity(primary.publicKey);
        (0, chai_1.assert)(secondary.publicKey.verifyAlternateIdentity(primary.publicKey, signature));
    });
});
//# sourceMappingURL=PublicAPITest.js.map