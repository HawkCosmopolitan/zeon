
import { request } from '../utils/requests';

export function echo(text, callback) {
    request('use-service', { key: 'echo-service', action: 'echo', body: { text: text } }, (res) => {
        if (callback) callback(res);
    });
}

let shell = {
    echo
};

export default shell;
