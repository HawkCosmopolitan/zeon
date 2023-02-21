import { callHistoryList } from "../../memory";
import { db } from "../setup";

export function dbSaveCallToHistory(workspaceId) {
    let data = {
        workspaceId: workspaceId,
        time: Date.now()
    };
    db.post({
        type: "call",
        data: data
    });
    callHistoryList.insert(0, data);
}

export async function dbFetchCallHistory() {
    let data = await db.find({
        selector: { type: { $eq: "call" } },
    });
    return data.docs.map(packet => packet.data);
}
