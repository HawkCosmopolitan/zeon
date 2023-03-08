/// <reference types="node" />
import ByteArray from '../internal/ByteArray';
import UuidCiphertext from '../groups/UuidCiphertext';
import ProfileKeyCiphertext from '../groups/ProfileKeyCiphertext';
export default class PniCredentialPresentation extends ByteArray {
    private readonly __type?;
    constructor(contents: Buffer);
    getAciCiphertext(): UuidCiphertext;
    getPniCiphertext(): UuidCiphertext;
    getProfileKeyCiphertext(): ProfileKeyCiphertext;
}
