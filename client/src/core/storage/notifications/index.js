import { db } from "../setup";

export function dbSaveNotification(notification) {
    db.post({
        type: "notification",
        data: notification
    });
}

export async function dbFetchNotifications() {
    let data = await db.find({
        selector: { type: { $eq: "notification" } },
    });
    console.log(data);
    return data.docs.map(packet => packet.data);
}
