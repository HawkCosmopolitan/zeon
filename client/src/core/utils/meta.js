
export const getMeta = (docType, blob, callback) => {
    if (docType === 'image') {
        var fr = new FileReader;
        fr.onload = function () {
            var img = new Image;
            img.onload = function () {
                callback({ width: img.width, height: img.height });
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(blob);
    } else if (docType === 'audio') {
        callback({});
    } else if (docType === 'video') {
        const url = URL.createObjectURL(blob);
        const $video = document.createElement("video");
        $video.src = url;
        $video.addEventListener("loadedmetadata", function () {
            callback({ width: this.videoWidth, height: this.videoHeight });
        });
    } else if (docType === 'application') {
        callback({});
    }
}
