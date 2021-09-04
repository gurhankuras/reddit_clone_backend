import User from "./user.model";
import { ObjectId } from 'mongodb';

export default async function setStatusOnline(userId: String, status: Boolean) {
    // @ts-ignore
    return  User.updateOne({_id: new ObjectId(userId), "prefs.forced_offline": false}, {$set: {"prefs.online": status}});
}