import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface UserInboxDocument extends mongoose.Document {
    userId: ObjectId;
    messages: {_id: ObjectId, title: string, subredditName: string, text: string, createdAt: Date, hasRead: boolean }[];
    activities: { _id: ObjectId, activityType: string, text: string, title: string, subreddit: { id: ObjectId, name: string, avatar: string}, createdAt: Date,  postId: ObjectId}[];
    createdAt: Date;
    updatedAt: Date;
}

const UserInboxSchema = new mongoose.Schema(
    {
    userId: mongoose.Schema.Types.ObjectId,
        messages: {
            type: [
                { _id: mongoose.Schema.Types.ObjectId, title: String, subredditName: String, text: String, createdAt: Date, hasRead: Boolean }
            ]
                ,
            default: []
        },
    activities: {type: [{ _id: mongoose.Schema.Types.ObjectId, activityType: String, text: String, title: String, subreddit: {id: mongoose.Schema.Types.ObjectId, name: String, avatar: String}, createdAt: Date,  postId: mongoose.Schema.Types.ObjectId}]},
  },
  {
    timestamps: true,
  }
);
// TODO add indexes to the most used fields 
const UserInbox = mongoose.model<UserInboxDocument>('UserInbox', UserInboxSchema);
export default UserInbox;
