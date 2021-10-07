import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { string } from 'joi';

export interface RoomDocument extends mongoose.Document {
  participants: { id: ObjectId, unread_msg_count: number, joinedAt: Date }[];
  createdAt: string;
  updatedAt: string;
  lastMessage: { text: string, createdAt: Date, sender_name: string };
  avatar: string;
}

const RoomSchema = new mongoose.Schema(
  {
    participants: [{ id: mongoose.Schema.Types.ObjectId, unread_msg_count: {type: Number, default: 0, min: 0}, joinedAt: Date }],
    lastMessage: {text: String, createdAt: Date, sender_name: String},
    avatar: {type: String},
  
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model<RoomDocument>('Room', RoomSchema);
export default Room;
