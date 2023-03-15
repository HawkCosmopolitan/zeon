
import { request } from '../utils/requests';
import Crypto from '../crypto';
import { Storage } from '../storage';
import { Memory } from '../memory';

export async function echo(text) {
    return new Promise(async resolve => {
        let trx = Memory.startTrx();
        request('use-service', {
            key: 'echo-service',
            action: 'echo',
            body: {
                text: await Crypto.instance().packageMessage(trx.temp.rooms.listPerTower[Storage.me.fetchMyHomeId()][0].id, text)
            }
        }, async res => {
            res.text = await Crypto.instance().openMesage(Memory.startTrx().temp.rooms.listPerTower[Storage.me.fetchMyHomeId()][0].id, res.text);
            resolve(res);
        });
    });
}

let shell = {
    echo
};

export default shell;
