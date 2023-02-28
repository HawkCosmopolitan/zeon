const { default: mongoose, Schema } = require('mongoose');

module.exports.defineSchemas = () => {
    module.exports.Document = mongoose.model('Document', new Schema({
        id: String,
        uploaderId: String,
        roomIds: [],
        isPublic: Boolean,
        fileType: String,
        previewId: String,
        duration: Number,
        width: Number,
        height: Number,
        time: Number,
        extension: String
    }), 'Document');
    module.exports.Preview = mongoose.model('Preview', new Schema({
        id: String
    }), 'Preview');
}
