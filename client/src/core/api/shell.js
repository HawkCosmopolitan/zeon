
import { request } from '../utils/requests';
import Crypto from '../crypto';
import { Storage } from '../storage';
import { Memory } from '../memory';

export async function echo(roomId, text) {
    return new Promise(async resolve => {
        if (Crypto.instance().isRoomSecure(roomId)) {
            request('use-service', {
                key: 'echo-service',
                action: 'echo',
                body: {
                    text: await Crypto.instance().packageMessage(roomId, text)
                }
            }, async res => {
                res.text = await Crypto.instance().openMesage(roomId, res.text);
                resolve(res);
            });
        } else {
            request('use-service', {
                key: 'echo-service',
                action: 'echo',
                body: {
                    text: text
                }
            }, async res => {
                res.text = text;
                resolve(res);
            });
        }
    });
}

let shell = {
    echo
};

export default shell;
