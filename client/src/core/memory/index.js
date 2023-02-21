import { publish } from "../bus";
import { readUserById } from "../callables/users";
import topics from '../events/topics.json';
import { fetchFirstName, fetchLastName, fetchMyHomeId, fetchMyUserId } from "../storage/me";
import { db } from "../storage/setup";
import { dbUpdateTowerById } from "../storage/spaces";
import recursivelyFetchFoldersAndFiles from '../utils/file-tree-resolver';

export const StateContext = React.createContext(null);

export let me = {},
    towersList = [],
    towersDictById = [],
    roomsDict = {},
    roomsDictById = {},
    workspacesDict = {},
    workspacesDictById = {},
    messagesDict = {},
    messagesDictById = {},
    callHistoryList = [],
    usersDict = {},
    filespacesDict = {},
    filespacesDictById = {},
    blogsDict = {},
    blogsDictById = {},
    postsDict = {},
    postsDictById = {},
    interactionsDict = {},
    invitesDictById = {},
    membershipsDictByTowerId = {},
    contactsByPeerId = {},
    disksDict = {},
    disksDictById = {},
    foldersDictById = {},
    blocksDict = {},
    docsDictById = {},
    membershipsDict = {};
export let homeHeader =
    'https://i.pinimg.com/564x/46/90/b5/4690b59cc8a5b7fe30a8694a49919398.jpg';
export let centralHeader =
    'https://cdn.create.vista.com/api/media/medium/385686678/stock-photo-abstract-geometric-background-white-red?token=';
export let sampleImages = [
    'https://mcdn.wallpapersafari.com/medium/78/14/gcleHR.png',
    'https://www.wallpapertip.com/wmimgs/162-1623047_desktop-wallpaper-design.jpg',
    'https://cdn.bhdw.net/im/silhouette-mountains-minimalist-wallpaper-81064_w635.webp',
    'https://wallpapercave.com/dwp1x/wp4892382.jpg',
    'https://wallpapercave.com/wp/wp5642204.jpg'
]

export let activeCalls = {};

export async function setupMemory() {
    me = { id: fetchMyUserId(), firstName: fetchFirstName(), lastName: fetchLastName(), homeId: fetchMyHomeId() };
    usersDict[me.id] = me;
    let datas = await db.allDocs({
        include_docs: true,
        attachments: false
    });
    return new Promise(function (done, err) {
        let records = datas.rows.map(row => row.doc);
        let tempStore = {};
        for (let i = 0; i < records.length; i++) {
            let record = records[i];
            let recordType = record.type;
            let data = record.data;
            if (!tempStore[recordType]) {
                tempStore[recordType] = [data];
            } else {
                tempStore[recordType].push(data);
            }
        }
        tempStore['user']?.forEach(user => {
            usersDict[user.id] = user
        });
        tempStore['tower']?.forEach(tower => {
            towersDictById[tower.id] = tower;
            roomsDict[tower.id] = [];
            if (tower.secret?.isContact) {
                tower.contact = usersDict[tower.contact?.id];
            }
            if (!tower.headerId) {
                tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                dbUpdateTowerById(tower.id, tower);
            } else {
                if (tower.headerId === 'help') {
                    tower.headerId = centralHeader;
                    dbUpdateTowerById(tower.id, tower);
                } else if (tower.id === me.homeId) {
                    tower.headerId = homeHeader;
                    dbUpdateTowerById(tower.id, tower);
                }
            }
        });
        tempStore['room']?.forEach(room => {
            roomsDict[room.towerId].push(room);
            roomsDictById[room.id] = room;
            workspacesDict[room.id] = [];
            filespacesDict[room.id] = [];
            blogsDict[room.id] = [];
            blocksDict[room.id] = [];
            membershipsDict[room.id] = {};
            room.tower = towersDictById[room.towerId];
        });
        tempStore['workspace']?.forEach(workspace => {
            workspacesDict[workspace.roomId].push(workspace);
            workspacesDictById[workspace.id] = workspace;
            messagesDict[workspace.id] = [];
            workspace.room = roomsDictById[workspace.roomId];
            workspace.tower = towersDictById[workspace.room.towerId];
        });
        tempStore['message']?.forEach(message => {
            message.time = Number(message.time);
            messagesDictById[message.id] = message;
            messagesDict[message.wid]?.push(message);
        });
        tempStore['filespace']?.forEach(filespace => {
            filespace.disks = [];
            filespacesDict[filespace.roomId].push(filespace);
            filespacesDictById[filespace.id] = filespace;
            filespace.room = roomsDictById[filespace.roomId];
            filespace.tower = towersDictById[filespace.room.towerId];
            disksDict[filespace.id] = [];
        });
        tempStore['disk']?.forEach(disk => {
            disksDict[disk.filespaceId].push(disk);
            disksDictById[disk.id] = disk;
            disk.filespace = filespacesDictById[disk.filespaceId];
            disk.filespace.disks.push(disk);
        });
        tempStore['folder']?.forEach(folder => {
            foldersDictById[folder.id] = folder;
            folder.filespace = filespacesDictById[folder.filespaceId];
            folder.folders = [];
            folder.files = [];
        });
        tempStore['document']?.forEach(doc => {
            docsDictById[doc.id] = doc;
        });
        tempStore['blog']?.forEach(blog => {
            blogsDict[blog.roomId].push(blog);
            blogsDictById[blog.id] = blog;
            postsDict[blog.id] = [];
            blog.room = roomsDictById[blog.roomId];
            blog.tower = towersDictById[blog.room.towerId];
        });
        tempStore['post']?.forEach(post => {
            postsDict[post.blogId].push(post);
            postsDictById[post.id] = post;
            post.blog = blogsDictById[post.blogId];
        });
        callHistoryList = tempStore['call']?.sort((c1, c2) => {
            if (c1.time > c2.time) return -1;
            else if (c1.time < c2.time) return 1;
            else return 0;
        });
        if (!callHistoryList) callHistoryList = [];
        tempStore['interaction']?.forEach(interaction => {
            let peerId = (interaction.user1Id === me.id ? interaction.user2Id : interaction.user1Id);
            interactionsDict[peerId] = interaction;
            towersDictById[roomsDictById[interaction.roomId]?.towerId].contact = usersDict[peerId];
        });
        tempStore['invite']?.forEach(invite => {
            invite.room = roomsDictById[invite.roomId];
            invite.tower = towersDictById[roomsDictById[invite.roomId]?.id];
            invitesDictById[invite.roomId] = invite;
        });
        let addedTowersByMemberships = {};
        tempStore['member']?.forEach(membership => {
            membership.room = roomsDictById[membership.roomId];
            membership.tower = towersDictById[membership.towerId];
            membershipsDictByTowerId[membership.towerId] = membership;
            membershipsDict[membership.roomId][membership.userId] = membership;
            if (membership.userId === me.id && !addedTowersByMemberships[membership.tower.id]) {
                addedTowersByMemberships[membership.tower.id] = true;
                towersList.push(membership.tower);
            }
        });
        Object.keys(workspacesDictById).forEach(wid => {
            messagesDict[wid] = messagesDict[wid].sort((m1, m2) => {
                if (m1.time > m2.time) return 1;
                else if (m1.time < m2.time) return -1;
                else return 0;
            });
            workspacesDictById[wid].lastMessage = messagesDict[wid][messagesDict[wid].length - 1];
        });
        let promises = [];
        Object.keys(disksDictById).forEach(did => {
            const disk = disksDictById[did];
            promises.push((async () => {
                disk.dataFolder = await recursivelyFetchFoldersAndFiles(disk.dataFolderId);
                disk.dataFolder.disk = disk;
            })());
        });
        Promise.all(promises).then(() => {
            done({
                me: me,
                towers: towersDictById,
                rooms: roomsDictById,
                users: usersDict
            });
        });
    });
}
