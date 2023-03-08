
import { request } from '../utils/requests';
import Crypto from '../crypto';
import { Storage } from '../storage';

export async function echo(text) {
    return new Promise(async resolve => {
        request('use-service', {
            key: 'echo-service',
            action: 'echo',
            body: {
                text: await Crypto.instance().prepareMessage(Storage.me.fetchMyUserId(), text)
            }
        }, async res => {
            res.text = await Crypto.instance().openMesage(Storage.me.fetchMyUserId(), res.text);
            resolve(res);
        });
    });
}

let shell = {
    echo
};

export default shell;
