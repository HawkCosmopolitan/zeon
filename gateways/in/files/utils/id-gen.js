
module.exports.measureAndFillStringId = (model) => {
    model.id = model._id.toHexString();
    return model;
}
