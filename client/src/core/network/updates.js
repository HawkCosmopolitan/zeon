import { publish } from "../bus";
import { dbSaveInteractionAtOnce } from "../storage/interactions";
import { fetchMyUserId } from "../storage/me";
import { dbFindMessageById, dbSaveMessageAtOnce, dbSeeMessage } from "../storage/messenger";
import { dbSaveMemberAtOnce, dbSaveRoomAtOnce, dbSaveTowerAtOnce, dbSaveWorkspace, dbSaveWorkspaceAtOnce, dbUpdateMember, dbUpdateMemberById } from "../storage/spaces";
import { dbSaveInviteAtOnce, dbDeleteInviteById } from '../storage/invites';
import { dbSaveUserAtOnce } from "../storage/users";
import { socket } from "./socket";
import updates from './updates.json';
import { readUserById } from "../callables/users";
import { activeCalls, blogsDict, blogsDictById, centralHeader, disksDict, disksDictById, filespacesDict, filespacesDictById, foldersDictById, homeHeader, invitesDictById, me, membershipsDict, membershipsDictByTowerId, messagesDict, messagesDictById, postsDict, postsDictById, roomsDict, roomsDictById, sampleImages, towersDictById, towersList, usersDict, workspacesDict, workspacesDictById } from "../memory";
import { fetchCurrentWorkspaceId } from "../storage/auth";
import uiEvents from '../../config/ui-events.json';
import { historyKeys, showToast, closeToast } from "../../App";
import { Avatar, Typography } from "@mui/material";
import { blue, green, purple, red, yellow } from "@mui/material/colors";
import { readDocById } from "../callables/file";
import { readRoomById } from "../callables/spaces";
import formatDate from "../../utils/DateFormatter";
import { dbSaveDiskAtOnce, dbSaveFileAtOnce, dbSaveFilespaceAtOnce, dbSaveFolderAtOnce, dbUpdateFolderById } from "../storage/storage";
import { dbSaveBlogAtOnce, dbSavePostAtOnce, dbUpdatePostById } from "../storage/blog";

let updatesDictionary = {};

export function attachUpdateListeners() {
    socket.on('whiteboardInit', data => {
        publish(updates.WHITEBOARD_INIT, data);
    });
    socket.on('whiteboardObjectAdded', data => {
        console.log(data);
        if (data.sender !== fetchMyUserId()) publish(updates.WHITEBOARD_OBJECT_ADDED, data);
    });
    socket.on('whiteboardObjectModified', data => {
        if (data.sender !== fetchMyUserId()) publish(updates.WHITEBOARD_OBJECT_MODIFIED, data);
    });
    socket.on('whiteboardObjectRemoved', data => {
        if (data.sender !== fetchMyUserId()) publish(updates.WHITEBOARD_OBJECT_REMOVED, data);
    });

    socket.on('on-user-join', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_USER_JOIN, data);
    });
    socket.on('on-user-leave', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_USER_LEAVE, data);
    });
    socket.on('on-users-sync', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_USERS_SYNC, data);
    });
    socket.on('on-video-turn-off', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_VIDEO_TURN_OFF, data);
    });
    socket.on('on-screen-turn-off', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_SCREEN_TURN_OFF, data);
    });
    socket.on('on-audio-turn-off', data => {
        if (data.userId !== fetchMyUserId()) publish(updates.ON_AUDIO_TURN_OFF, data);
    });

    socket.on('on-contact-online-state-change', ({ userId, onlineState, lastSeen }) => {
        if (usersDict[userId]) {
            let lastSeenString = '';
            if (!onlineState) {
                lastSeenString = 'last seen ' + (lastSeen === 0 ? 'prehistory' : (formatDate(lastSeen) + ' ' + new Date(lastSeen).toTimeString().substring(0, 5)));
            }
            usersDict[userId].online = onlineState;
            usersDict[userId].lastSeen = lastSeen;
            usersDict[userId].lastSeenString = lastSeenString;
            publish(updates.ON_CONTACT_ONLINE_STATE_CHANGE, { userId: userId, peerStatus: onlineState ? 'online' : lastSeenString });
        }
    });

    socket.on('on-active-calls-sync', data => {
        let wArr = Object.keys(data.workspaceIds);
        for (let i = 0; i < wArr.length; i++) {
            activeCalls[wArr[i]] = true;
        }
        publish(updates.ON_ACTIVE_CALLS_SYNC, data);
    });
    socket.on('on-call-create', data => {
        activeCalls[data.workspaceId] = true;
        publish(updates.ON_CALL_CREATE, data);
        let workspace = workspacesDictById[data.workspaceId];
        let user = data.creatorId === me.id ? me : usersDict[data.creatorId];
        let room = workspace?.room;
        let tower = workspace?.tower
        let towerTitle = tower?.title;
        let avatarBackColor;
        if (tower && tower.secret?.isContact) {
            towerTitle = tower?.contact.firstName + ' ' + tower?.contact.lastName;
            avatarBackColor = user?.avatarBackColor;
        } else {
            avatarBackColor = workspace.avatarBackColor;
        }
        if (user?.id !== me.id) {
            showToast((t) => (
                <div style={{ width: 'auto' }} onClick={() => {
                    let workspace = workspacesDictById[data.workspaceId];
                    publish(uiEvents.OPEN_CALL, { user: workspace?.tower?.contact, workspace: workspace });
                    closeToast(t.id);
                }}>
                    <Typography variant={'caption'}>
                        {towerTitle}:{room?.title}
                    </Typography>
                    <div style={{ display: 'flex' }}>
                        <Avatar style={{ width: 24, height: 24 }} sx={{
                            bgcolor: avatarBackColor < 2 ? blue[400] :
                                avatarBackColor < 4 ? purple[400] :
                                    avatarBackColor < 6 ? red[400] :
                                        avatarBackColor < 8 ? green[400] :
                                            yellow[600]
                        }}>{(user ? user.firstName : workspace.title).substring(0, 1).toUpperCase()}</Avatar>
                        <Typography style={{ marginTop: 2, marginLeft: 6 }}>{user?.firstName} started call in {workspace.title}</Typography>
                    </div>
                </div>
            ));
        }
    });
    socket.on('on-call-destruct', data => {
        delete activeCalls[data.workspaceId];
        publish(updates.ON_CALL_DESTRUCT, data);
    });

    socket.on('playWithEmoji', data => {
        let { messageId } = data;
        let message = messagesDictById[messageId];
        if (message) {
            publish(uiEvents.PLAY_WITH_EMOJI, { message });
        }
    });

    updatesDictionary[updates.PERMISSIONS_MODIFIED] = async (data, done) => {
        let { member } = data;
        await dbUpdateMemberById(member.id, member);
        member.tower = towersDictById[member.towerId];
        member.room = roomsDictById[member.roomId];
        membershipsDictByTowerId[member.towerId] = member;
        membershipsDict[member.roomId][member.userId] = member;
        done();
        publish(updates.PERMISSIONS_MODIFIED, { member: member });
    };
    updatesDictionary[updates.NEW_MESSAGE] = async (data, done) => {
        let { message } = data;
        const restOfProcess = async () => {
            await dbSaveMessageAtOnce(message);
            messagesDictById[message.id] = message;
            messagesDict[message.wid]?.push(message);
            workspacesDictById[message.wid].lastMessage = message;
            readUserById(message.authorId, (user) => {
                let avatarBackColor = user.avatarBackColor;
                if (!(fetchCurrentWorkspaceId() === message.wid && historyKeys[historyKeys.length - 1] === 'Chat')) {
                    let room = workspacesDictById[message.wid]?.room;
                    let tower = workspacesDictById[message.wid]?.tower
                    let towerTitle = tower?.title;
                    if (tower && tower.secret?.isContact) {
                        towerTitle = tower?.contact?.firstName + ' ' + tower?.contact?.lastName
                    }
                    showToast((t) => (
                        <div style={{ width: 'auto' }} onClick={() => {
                            let workspace = workspacesDictById[message.wid];
                            let tower = workspace?.tower;
                            if (tower.secret.isContact) {
                                publish(uiEvents.NAVIGATE, { navigateTo: "Chat", workspaceId: workspace?.id, user: tower?.contact });
                            } else {
                                publish(uiEvents.NAVIGATE, { navigateTo: "Chat", workspaceId: workspace?.id });
                            }
                            closeToast(t.id);
                        }}>
                            <Typography variant={'caption'}>
                                {towerTitle}:{room?.title}
                            </Typography>
                            <div style={{ display: 'flex' }}>
                                <Avatar style={{ width: 24, height: 24 }} sx={{
                                    bgcolor: avatarBackColor < 2 ? blue[400] :
                                        avatarBackColor < 4 ? purple[400] :
                                            avatarBackColor < 6 ? red[400] :
                                                avatarBackColor < 8 ? green[400] :
                                                    yellow[600]
                                }}>{user.firstName.substring(0, 1).toUpperCase()}</Avatar>
                                <Typography style={{ marginTop: 2, marginLeft: 6 }}>{user.firstName} sayed "</Typography>
                                <Typography style={{
                                    marginTop: 2,
                                    fontSize: 15,
                                    maxWidth: 150,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                }} variant={'caption'}>
                                    {message.type === 'text' ? message.text : message.type === 'sticker' ? 'sticker' : message.docType}
                                </Typography>
                                "
                            </div>
                        </div>
                    ));
                }
                done();
                publish(updates.NEW_MESSAGE, { message: message });
            });
        }
        if (message.type === 'file' && message.fileIds) {
            let room = workspacesDictById[message.wid]?.room;
            readDocById(message.fileIds[0], room.id, async doc => {
                message.meta = { width: doc.width, height: doc.height, duration: doc.duration };
                await restOfProcess();
            });
        } else {
            await restOfProcess();
        }
    };
    updatesDictionary[updates.NEW_INTERACTION] = async (data, done) => {
        data.tower.secret = { isContact: true };
        data.tower.contact = data.contact;
        let newColor = (Math.random() * 10).toString()[0];
        data.contact.avatarBackColor = newColor;
        data.workspace.avatarBackColor = newColor;
        data.tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
        await dbSaveTowerAtOnce(data.tower);
        await dbSaveRoomAtOnce(data.room);
        await dbSaveWorkspaceAtOnce(data.workspace);
        await dbSaveMemberAtOnce(data.member1);
        await dbSaveMemberAtOnce(data.member2);
        await dbSaveUserAtOnce(data.contact);
        await dbSaveInteractionAtOnce(data.interaction);
        for (let i = 0; i < data.messages.length; i++) {
            await dbSaveMessageAtOnce(data.messages[i]);
        }
        towersDictById[data.tower.id] = data.tower;
        towersList.push(data.tower);
        data.workspace.tower = data.tower;
        data.workspace.room = data.room;
        usersDict[data.contact.id] = data.contact;
        workspacesDictById[data.workspace.id] = data.workspace;
        data.room.tower = data.tower;
        roomsDictById[data.room.id] = data.room;
        roomsDict[data.tower.id] = [data.room];
        workspacesDict[data.room.id] = [data.workspace];
        filespacesDict[data.room.id] = [];
        blogsDict[data.room.id] = [];
        messagesDict[data.workspace.id] = data.messages;
        data.member1.tower = data.tower;
        data.member1.room = data.room;
        data.member2.tower = data.tower;
        data.member2.room = data.room;
        if (data.member1.userId === me.id) {
            membershipsDictByTowerId[data.tower.id] = data.member1;
        } else {
            membershipsDictByTowerId[data.tower.id] = data.member2;
        }
        membershipsDict[data.room.id] = { [data.member1.userId]: data.member1 };
        membershipsDict[data.room.id] = { [data.member2.userId]: data.member2 };
        done();
        if (data.member1.userId === me.id) {
            readUserById(data.member2.userId, (user) => {
                publish(updates.NEW_INTERACTION, { interaction: data.interaction });
            });
        } else {
            readUserById(data.member1.userId, (user) => {
                publish(updates.NEW_INTERACTION, { interaction: data.interaction });
            });
        }
    }
    updatesDictionary[updates.MESSAGE_SEEN] = async (data, done) => {
        await dbSeeMessage(data.messageId, data.viewerId);
        done();
        messagesDictById[data.messageId].seen = true;
        publish(updates.MESSAGE_SEEN, { message: messagesDictById[data.messageId] });
    };
    updatesDictionary[updates.NEW_ROOM] = async (data, done) => {
        let { room, workspace } = data;
        let newColor = (Math.random() * 10).toString()[0];
        workspace.avatarBackColor = newColor;
        await dbSaveWorkspaceAtOnce(workspace);
        let tower = towersDictById[room.towerId];
        workspace.tower = tower;
        workspace.room = room;
        workspacesDictById[workspace.id] = workspace;
        workspacesDict[room.id] = [workspace];
        messagesDict[workspace.id] = [];
        membershipsDict[room.id] = {};
        await dbSaveRoomAtOnce(room);
        room.tower = tower;
        roomsDictById[room.id] = room;
        roomsDict[tower.id]?.push(room);
        done();
        publish(updates.NEW_ROOM, { room: room, workspace: workspace });
    };
    updatesDictionary[updates.NEW_WORKSPACE] = async (data, done) => {
        let { workspace } = data;
        let newColor = (Math.random() * 10).toString()[0];
        workspace.avatarBackColor = newColor;
        await dbSaveWorkspaceAtOnce(workspace);
        let room = roomsDictById[workspace.roomId];
        let tower = towersDictById[room.towerId];
        workspace.tower = tower;
        workspace.room = room;
        workspacesDictById[workspace.id] = workspace;
        workspacesDict[room.id].push(workspace);
        messagesDict[workspace.id] = [];
        done();
        publish(updates.NEW_WORKSPACE, { workspace: workspace });
    };
    updatesDictionary[updates.NEW_INVITE] = async (data, done) => {
        readRoomById(data.invite.roomId, async (room, tower) => {
            if (!roomsDictById[room.id]) {
                await dbSaveRoomAtOnce(room);
            }
            roomsDictById[room.id] = room;
            room.tower = tower;
            if (!towersDictById[tower.id]) {
                if (!tower.headerId) {
                    tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                } else {
                    if (tower.headerId === 'help') {
                        tower.headerId = centralHeader;
                    } else if (tower.id === me.homeId) {
                        tower.headerId = homeHeader;
                    }
                }
                await dbSaveTowerAtOnce(tower);
            }
            towersDictById[tower.id] = tower;
            data.invite.tower = tower;
            data.invite.room = room;
            await dbSaveInviteAtOnce(data.invite);
            invitesDictById[data.invite.roomId] = data.invite;
            done();
            publish(updates.NEW_INVITE, { invite: data.invite });
            let towerTitle = tower?.title;
            if (tower && tower.secret?.isContact) {
                towerTitle = tower?.contact.firstName + ' ' + tower?.contact.lastName;
            }
            showToast((t) => (
                <div style={{ width: 'auto' }}>
                    <Typography variant={'caption'}>
                        {towerTitle}:{room?.title}
                    </Typography>
                    <div style={{ display: 'flex' }}>
                        <Avatar style={{ width: 24, height: 24 }} sx={{
                            bgcolor: yellow[600]
                        }}>?</Avatar>
                        <Typography style={{ marginTop: 2, marginLeft: 6 }}>you've received invite from {towerTitle}:{room?.title}</Typography>
                    </div>
                </div>
            ));
        })
    };
    updatesDictionary[updates.INVITE_CANCELLED] = async (data, done) => {
        await dbDeleteInviteById(data.inviteId);
        done();
        publish(updates.INVITE_CANCELLED, { inviteId: data.inviteId });
    };
    updatesDictionary[updates.USER_JOINED_ROOM] = async (data, done) => {
        await dbSaveUserAtOnce(data.user);
        usersDict[data.user.id] = data.user;
        await dbSaveMemberAtOnce(data.member);
        membershipsDict[data.member.roomId][data.member.userId] = data.member;
        await dbSaveMessageAtOnce(data.message);
        messagesDictById[data.message.id] = data.message;
        messagesDict[data.message.wid]?.push(data.message);
        done();
        readUserById(data.user.id, (user) => {
            publish(updates.USER_JOINED_ROOM, { user: data.user, roomId: data.roomId });
            publish(updates.NEW_MESSAGE, { message: data.message });
        });
    };
    updatesDictionary[updates.NEW_FILESPACE] = async (data, done) => {
        await dbSaveFilespaceAtOnce(data.filespace);
        data.filespace.disks = [];
        data.filespace.room = roomsDictById[data.filespace.roomId];
        filespacesDictById[data.filespace.id] = data.filespace;
        filespacesDict[data.filespace.roomId]?.push(data.filespace);
        disksDict[data.filespace.id] = [];
        done();
        publish(updates.NEW_FILESPACE, { filespace: data.filespace });
    };
    updatesDictionary[updates.NEW_DISK] = async (data, done) => {
        await dbSaveDiskAtOnce(data.disk);
        data.disk.filespace = filespacesDictById[data.disk.filespaceId];
        disksDictById[data.disk.id] = data.disk;
        disksDict[data.disk.filespaceId]?.push(data.disk);
        data.disk.filespace.disks.push(data.disk);
        data.disk.dataFolder = data.folder;
        await dbSaveFolderAtOnce(data.folder);
        data.folder.folders = [];
        data.folder.files = [];
        foldersDictById[data.folder.id] = data.folder;
        done();
        publish(updates.NEW_DISK, { disk: data.disk });
    };
    updatesDictionary[updates.NEW_FOLDER] = async (data, done) => {
        await dbSaveDiskAtOnce(data.folder);
        data.folder.folders = [];
        data.folder.files = [];
        data.folder.filespace = filespacesDictById[data.folder.filespaceId];
        data.folder.parent = foldersDictById[data.folder.parentFolderId];
        foldersDictById[data.folder.id] = data.folder;
        let miniParentFolder = {
            id: data.folder.parent.id,
            folderIds: data.folder.parent.folderIds,
            fileIds: data.folder.parent.fileIds,
            title: data.folder.parent.title,
            filespaceId: data.folder.parent.filespaceId
        };
        miniParentFolder.folderIds?.push(data.folder.id);
        await dbUpdateFolderById(miniParentFolder.id, miniParentFolder);
        data.folder.parent.folderIds?.push(data.folder.id);
        data.folder.parent.folders?.push(data.folder);
        done();
        publish(updates.NEW_FOLDER, { folder: data.folder });
    };
    updatesDictionary[updates.NEW_FILE] = async (data, done) => {
        await dbSaveFileAtOnce(data.folderId, data.docId);
        foldersDictById[data.folderId].fileIds.push(data.docId);
        readDocById(data.docId, data.roomId, (doc) => {
            publish(updates.NEW_FILE, { doc: doc });
        });
        done();
    };
    updatesDictionary[updates.NEW_BLOG] = async (data, done) => {
        await dbSaveBlogAtOnce(data.blog);
        data.blog.room = roomsDictById[data.blog.roomId];
        data.blog.posts = [];
        blogsDictById[data.blog.id] = data.blog.id;
        blogsDict[data.blog.roomId]?.push(data.blog);
        done();
        publish(updates.NEW_BLOG, { blog: data.blog });
    };
    updatesDictionary[updates.NEW_POST] = async (data, done) => {
        await dbSavePostAtOnce(data.post);
        data.post.blog = blogsDictById[data.post.blogId];
        postsDictById[data.post.id] = data.post;
        postsDict[data.post.blogId]?.push(data.post);
        if (data.post.coverId !== '0') {
            readDocById(data.post.coverId, data.roomId, (doc) => {
                publish(updates.NEW_POST, { post: data.post });
            });
        }
        done();
    };
    updatesDictionary[updates.POST_UPDATED] = async (data, done) => {
        await dbUpdatePostById(data.post.id, data.post);
        let post = postsDictById[data.post.id];
        post.title = data.post.title;
        post.coverId = data.post.coverId;
        if (post.coverId !== '0') {
            readDocById(post.coverId, data.roomId, (doc) => {
                publish(updates.POST_UPDATED, { post: data.post });
            });
        }
        done();
    };

    socket.on('update', data => {
        console.log(data);
        publish(updates.NEW_NOTIF, data);
        if (data !== null) {
            let callback = updatesDictionary[data.type];
            if (callback) {
                callback(data, () => {
                    socket.emit('notifyUpdated', { updateId: data.id });
                });
            }
        }
    });
}
