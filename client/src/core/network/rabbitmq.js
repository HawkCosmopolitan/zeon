
import config from '../config.json';

export let stompClient;

export let setupWebStomp = async () => {
    console.log('connecting to webstomp...');
    return new Promise(resolve => {
        let webStompChecker = setInterval(() => {
            let WebStompClient = window.WebStompClient;
            const client = new WebStompClient({
                brokerURL: config.WEBSTOMP_GATEWAY,
                onConnect: () => {
                    console.log('connected to webstomp.');
                    stompClient = client;
                    clearInterval(webStompChecker);
                    resolve();
                },
            });
            client.activate();
        }, 250);
    });
}
