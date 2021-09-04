import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface NotificationsDocument extends mongoose.Document {
  userId: ObjectId;
  unread_messages: number;
  // rooms: Map<string, { unread_messages_count: number }>;
  createdAt: string;
  updatedAt: string;
}

const NotificationsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    // rooms: {
    //   type: Map,
    //   of: { unread_messages_count: Number },
    // },
    unread_messages: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Notifications = mongoose.model<NotificationsDocument>(
  'Notifications',
  NotificationsSchema
);
export default Notifications;
