
module.exports.isEmpty = (str) => {
    return (str === undefined || str === null || str.length === 0);
};

module.exports.isNameFieldInvalid = (str) => {
    if (str === undefined || str === null) return true;
    return str.length > 64;
};

module.exports.isInviteTitleInvalid = (str) => {
    if (str === undefined || str === null) return false;
    return str.length > 64;
};

module.exports.isInviteTextInvalid = (str) => {
    if (str === undefined || str === null) return false;
    return str.length > 512;
};

module.exports.isWorkspaceTitleInvalid = (str) => {
    if (str === undefined || str === null) return false;
    return str.length > 64;
};

module.exports.isFileBoxTitleInvalid = (str) => {
    if (str === undefined || str === null) return false;
    return str.length > 64;
};

module.exports.isListDescriptionInvalid = (str) => {
    if (str === undefined || str === null) return false;
    return str.length > 200;
};