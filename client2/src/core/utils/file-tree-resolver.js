import { docsDictById, foldersDictById } from "../memory";

export default async function recursivelyFetchFoldersAndFiles(parentFolderId) {
    let folder = foldersDictById[parentFolderId];
    if (folder) {
        folder.folders = [];
        for (let n = 0; n < folder.folderIds.length; n++) {
            let childFolder = await recursivelyFetchFoldersAndFiles(folder.folderIds[n]);
            if (childFolder) {
                folder.folders.push(childFolder);
            }
        }
        folder.files = [];
        for (let n = 0; n < folder.fileIds.length; n++) {
            folder.files.push(docsDictById[folder.fileIds[n]]);
        }
    }
    return folder;
}
