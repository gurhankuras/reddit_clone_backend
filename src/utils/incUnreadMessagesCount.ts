import { ObjectId } from "mongodb";
import Notifications from "../model/notifications.model";

export default async function incrementUnreadMessagesCount(userIds: ObjectId[]) {
    return Notifications.updateMany(
        { userId: { $in: userIds } },
        { $inc: { unread_messages: 1 } },
        { upsert: true, multi: true }
    );
}