
const folders = require('../../../constants/folders.json');
const { exec } = require("child_process");
const fs = require("fs");
const { fromPath } = require("pdf2pic");
const genThumbnail = require("simple-thumbnail");
const sharp = require("sharp");
const { getAudioDurationInSeconds } = require('get-audio-duration');
var sizeOf = require('image-size');

module.exports.generatePreview = (document, preview, extension, done) => {
    if (document.fileType === "application" && extension === 'pdf') {
        let tempFilePath = process.cwd() + "/" + folders.TEMP + "/" + document.id + ".pdf";
        let rawFilePath = process.cwd() + "/" + folders.FILES + "/" + document.id;
        fs.copyFileSync(rawFilePath, tempFilePath);
        const options = {
            density: 100,
            saveFilename: document.id,
            savePath: process.cwd() + "/" + folders.PDF_PAGES,
            format: "png",
            width: 1080,
            height: 1920,
        };
        fromPath(tempFilePath, options)
            .bulk(-1, true).then((output) => {
                fs.rmSync(tempFilePath);
                fs.mkdirSync(process.cwd() + "/" + folders.PDF_PAGES + "/" + preview.id);
                for (let i = 0; i < output.length; i++) {
                    fs.writeFileSync(
                        process.cwd() + "/" + folders.PDF_PAGES + "/" + preview.id + "/" + i + ".png",
                        output[i].base64,
                        "base64"
                    );
                }
                done({});
            });
    } else if (document.fileType === 'video') {
        genThumbnail(
            process.cwd() + "/" + folders.FILES + "/" + document.id,
            process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".jpg",
            "256x196"
        )
            .then(() => {
                done({});
            })
            .catch((err) => console.error(err));
    } else if (document.fileType === 'image') {
        const rawPreviewPath = process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + '.jpg';
        sharp(process.cwd() + "/" + folders.FILES + "/" + document.id)
            .resize(200, 200)
            .toFile(rawPreviewPath, function (err) {
                const finalPreviewPath = process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id;
                fs.renameSync(rawPreviewPath, finalPreviewPath);
                sizeOf(finalPreviewPath, function (err, dimensions) {
                    done({ width: dimensions.width, height: dimensions.height });
                });
            });
    } else if (document.fileType === "audio") {
        const tempFilePath = process.cwd() + "/" + folders.TEMP + "/" + document.id + "." + extension;
        const tempMp3FilePath = process.cwd() + "/" + folders.TEMP + "/" + document.id + ".mp3";
        fs.copyFileSync(process.cwd() + "/" + folders.FILES + "/" + document.id, tempFilePath);
        let calculatingGraph = () => {
            exec(
                `ffmpeg -i ${extension === 'mp3' ? tempMp3FilePath : tempFilePath} -f wav - | audiowaveform --input-format wav --output-format json --pixels-per-second 2 -b 8 > ${process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".json"}`,
                async (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error}`);
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                    }
                    console.log('generated waveform.');
                    console.log('measuring duration...');
                    let duration = undefined;
                    try {
                        duration = await getAudioDurationInSeconds(extension === 'mp3' ? tempMp3FilePath : tempFilePath);
                    } catch (ex) { }
                    console.log('generating cover...');
                    let cover;
                    try {
                        const { parseFile, selectCover } = await import("music-metadata");
                        const { common } = await parseFile(extension === 'mp3' ? tempMp3FilePath : tempFilePath);
                        cover = selectCover(common.picture);
                    } catch (ex) { }
                    if (cover) {
                        fs.writeFile(process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".jpg", cover.data, () => {
                            sharp(process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".jpg")
                                .resize(200, 200)
                                .toFile(process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id, function (err) {
                                    console.log('generated cover.');
                                    fs.rmSync(process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".jpg");
                                    fs.renameSync(
                                        process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id,
                                        process.cwd() + "/" + folders.PREVIEWS + "/" + preview.id + ".jpg"
                                    );
                                    if (fs.existsSync(tempFilePath)) fs.rmSync(tempFilePath);
                                    if (fs.existsSync(tempMp3FilePath)) fs.rmSync(tempMp3FilePath);
                                    done({ duration });
                                });
                        });
                    } else {
                        console.log('cover generation failed.');
                        if (fs.existsSync(tempFilePath)) fs.rmSync(tempFilePath);
                        if (fs.existsSync(tempMp3FilePath)) fs.rmSync(tempMp3FilePath);
                        done({ duration });
                    }
                });
        };
        if (extension === "aac" || extension === 'ogg') {
            exec(
                `ffmpeg -i ${tempFilePath} -vn -ar 44100 -ac 2 -b:a 192k ${tempMp3FilePath}`,
                (error, stdout, stderr) => {
                    extension = "mp3";
                    console.log('generated mp3.');
                    calculatingGraph();
                }
            );
        } else {
            calculatingGraph();
        }
    } else {
        done({});
    }
}
