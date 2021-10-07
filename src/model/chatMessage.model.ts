import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface ChatMessageDocument extends mongoose.Document {
  roomId: ObjectId;
  user: { id: ObjectId; name: string; avatar: string };
  text: string;
    // participants: { id: ObjectId; joinedAt: Date }[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientChatMessage {
  roomId: ObjectId;
  user: { id: ObjectId; name: string; avatar: string };
  text: string;
    // participants: { id: ObjectId; joinedAt: Date }[];
}

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { id: mongoose.Schema.Types.ObjectId, name: String, avatar: String },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const ChatMessage = mongoose.model<ChatMessageDocument>(
  'ChatMessage',
  ChatMessageSchema
);
export default ChatMessage;
