import { Server, Socket } from 'socket.io';
import ChatMessage, { ChatMessageDocument, ClientChatMessage } from './chat_message/chatMessage.model';
import Notifications from './notifications/notifications.model';
import Room from './room/room.model';
import { promisify } from "util";
import redis from 'redis';
import User from './user/user.model';
import { ObjectId } from 'mongodb';
import setStatusOnline from './user/setStatusOnline';
import { Mongoose } from 'mongoose';
import mongoose from 'mongoose';
import extractUserId from './utils/extractUserId';
import incrementUnreadMessagesCount from './utils/incUnreadMessagesCount';


const redisClient = redis.createClient();
redisClient.on("error", (error) => {
  console.error(error);
});

const getAsync = promisify(redisClient.get).bind(redisClient);



export const EVENTS = {
  CONNECTION: 'connection',
  CLIENT: {
    MESSAGE_SENT: 'message_sent',
    TYPING: 'typing',
    MESSAGES_REQUESTED: 'messages_requested',
    REGISTER: 'register',
    JOIN_ROOM: 'join_room'
  },

  SERVER: {
    MESSAGES_LOADED: 'messages_loaded',
    NOTIFICATION: 'notification',
  },
};


async function joinIfInRoom(socket: Socket, {userId, roomId} : {userId: string, roomId: string}, ) {
  const room = await Room.findOne({ _id: new ObjectId(roomId), "participants.id": new ObjectId(userId) } );
  if (room) {
    socket.join(roomId);
  }
}

type SentSocketMessage = Omit<ChatMessageDocument, 'createdAt' | 'updatedAt'>;

export default function socket({ io }: { io: Server }) {

 

  io.on(EVENTS.CONNECTION, async (client: Socket) => {
    const userId = extractUserId(client);
    if (userId) {
      redisClient.set(userId, client.id);
      await setStatusOnline(userId, true);
    }

    client.join('612cc72f65a882665306cc0e');
    console.log('new client');

    client.on(EVENTS.CLIENT.JOIN_ROOM, async ({ userId, roomId }: { userId: string, roomId: string }) => {
      if (roomId && userId) {
        await joinIfInRoom(client, { roomId, userId });
      }
    });

    client.on(EVENTS.CLIENT.MESSAGE_SENT, async (message: ClientChatMessage) => {      
      const senderUserId = message.user.id;
      const roomId = message.roomId;
      const room = await Room.findOne({ _id: roomId, "participants.id": senderUserId });
      
      if (!room) {
        return;
      }
      const msg = await ChatMessage.create(message);
      client.to(roomId.toString()).emit(EVENTS.CLIENT.MESSAGE_SENT, msg);
      const participants = room.participants;
      const otherParticipants = participants.filter((p) => p.id != senderUserId).map((other) => other.id);
      console.log(otherParticipants);
      // await Notifications.updateMany({ userId: { $in: otherParticipants } }, { $inc: { unread_messages: 1 } }, { upsert: true, multi: true });
      await incrementUnreadMessagesCount(otherParticipants);
    });

    client.on(EVENTS.CLIENT.TYPING, (_) => {
      console.log('typing calisti');
      io.emit(EVENTS.CLIENT.TYPING, true);
    });

    client.on(EVENTS.CLIENT.MESSAGES_REQUESTED, async (event) => {
      console.log('messages_requested calisti');
      const messages = await ChatMessage.find({ roomId: event.roomId }).sort({
        createdAt: 1,
      });
      client.emit(EVENTS.SERVER.MESSAGES_LOADED, messages);
    });
    // client.on(EVENTS.CLIENT.REGISTER, (event) => {
    //   if (event.socketId && event.userId) {
    //     // @ts-ignore
    //     socketIds[event.userId.toString()] = event.socketId;
    //   }
    // });

    client.on('disconnect', async (_) => {
      const userId = extractUserId(client);
      if (userId) {
        await setStatusOnline(userId, false);
      }
      // @ts-ignore
      redisClient.del([client.userId]);
      console.log('disconnected');
    });

    client.onAny((event, ...args) => {
      console.log(event, args);
    });
    
  });
}
