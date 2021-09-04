import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface RoomDocument extends mongoose.Document {
  participants: { id: ObjectId; joinedAt: Date }[];
  createdAt: string;
  updatedAt: string;
  lastMessageDate: Date;
}

const RoomSchema = new mongoose.Schema(
  {
    participants: [{ id: mongoose.Schema.Types.ObjectId, joinedAt: Date }],
    lastMessageDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model<RoomDocument>('Room', RoomSchema);
export default Room;
