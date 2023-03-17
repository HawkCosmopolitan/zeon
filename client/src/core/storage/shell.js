
let shellApiDict = {};

let shellApi = {
    api: () => shellApiDict,
    registerShellApi: (funcName, func) => {
        shellApiDict[funcName] = func;
    }
}

export default shellApi;
