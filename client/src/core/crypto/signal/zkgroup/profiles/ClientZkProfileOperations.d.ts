/// <reference types="node" />
import ServerPublicParams from '../ServerPublicParams';
import GroupSecretParams from '../groups/GroupSecretParams';
import ExpiringProfileKeyCredential from './ExpiringProfileKeyCredential';
import ExpiringProfileKeyCredentialResponse from './ExpiringProfileKeyCredentialResponse';
import PniCredential from './PniCredential';
import PniCredentialPresentation from './PniCredentialPresentation';
import PniCredentialRequestContext from './PniCredentialRequestContext';
import PniCredentialResponse from './PniCredentialResponse';
import ProfileKey from './ProfileKey';
import ProfileKeyCredential from './ProfileKeyCredential';
import ProfileKeyCredentialPresentation from './ProfileKeyCredentialPresentation';
import ProfileKeyCredentialRequestContext from './ProfileKeyCredentialRequestContext';
import ProfileKeyCredentialResponse from './ProfileKeyCredentialResponse';
import { UUIDType } from '../internal/UUIDUtil';
export default class ClientZkProfileOperations {
    serverPublicParams: ServerPublicParams;
    constructor(serverPublicParams: ServerPublicParams);
    createProfileKeyCredentialRequestContext(uuid: UUIDType, profileKey: ProfileKey): ProfileKeyCredentialRequestContext;
    createProfileKeyCredentialRequestContextWithRandom(random: Buffer, uuid: UUIDType, profileKey: ProfileKey): ProfileKeyCredentialRequestContext;
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialRequestContext(aci: UUIDType, pni: UUIDType, profileKey: ProfileKey): PniCredentialRequestContext;
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialRequestContextWithRandom(random: Buffer, aci: UUIDType, pni: UUIDType, profileKey: ProfileKey): PniCredentialRequestContext;
    receiveProfileKeyCredential(profileKeyCredentialRequestContext: ProfileKeyCredentialRequestContext, profileKeyCredentialResponse: ProfileKeyCredentialResponse): ProfileKeyCredential;
    receiveExpiringProfileKeyCredential(profileKeyCredentialRequestContext: ProfileKeyCredentialRequestContext, profileKeyCredentialResponse: ExpiringProfileKeyCredentialResponse, now?: Date): ExpiringProfileKeyCredential;
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    receivePniCredential(requestContext: PniCredentialRequestContext, response: PniCredentialResponse): PniCredential;
    createProfileKeyCredentialPresentation(groupSecretParams: GroupSecretParams, profileKeyCredential: ProfileKeyCredential): ProfileKeyCredentialPresentation;
    createProfileKeyCredentialPresentationWithRandom(random: Buffer, groupSecretParams: GroupSecretParams, profileKeyCredential: ProfileKeyCredential): ProfileKeyCredentialPresentation;
    createExpiringProfileKeyCredentialPresentation(groupSecretParams: GroupSecretParams, profileKeyCredential: ExpiringProfileKeyCredential): ProfileKeyCredentialPresentation;
    createExpiringProfileKeyCredentialPresentationWithRandom(random: Buffer, groupSecretParams: GroupSecretParams, profileKeyCredential: ExpiringProfileKeyCredential): ProfileKeyCredentialPresentation;
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialPresentation(groupSecretParams: GroupSecretParams, credential: PniCredential): PniCredentialPresentation;
    /**
     * @deprecated Superseded by AuthCredentialWithPni + ProfileKeyCredential
     */
    createPniCredentialPresentationWithRandom(random: Buffer, groupSecretParams: GroupSecretParams, credential: PniCredential): PniCredentialPresentation;
}
