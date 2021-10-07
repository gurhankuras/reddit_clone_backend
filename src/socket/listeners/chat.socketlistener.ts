import { Server, Socket } from "socket.io";
import ChatMessage, { ClientChatMessage } from "../../model/chatMessage.model";
import Room from "../../model/room.model";
import { EVENTS } from "../socket";
import { redisClient } from "../../app";
import setStatusOnline from "../../user/setStatusOnline";
import extractUserId from "../../utils/extractUserId";
import incrementUnreadMessagesCount from "../../utils/incUnreadMessagesCount";
import { promisify } from "util";
import { ObjectId } from 'mongodb';

// const getAsync = promisify(redisClient.get).bind(redisClient);


export function userDisconnectedListener(client: Socket) {
    return async (_: string) => {
      const userId = extractUserId(client);
      if (userId) {
        await setStatusOnline(userId, false);
      }
      // @ts-ignore
      redisClient.del([client.userId]);
      console.log('disconnected');  
    }
  }
  
  
  export function userTypingListener(io: Server) {
    return (_: {userId: string}) => {
      console.log('typing calisti');
      io.in("612cc72f65a882665306cc0e").emit(EVENTS.CLIENT.TYPING, _);
      // io.emit(EVENTS.CLIENT.TYPING, true);
    }
  }
  
  export  function joinRoomListener(client: Socket) {
    return async ({ userId, roomId }: { userId: string, roomId: string }) => {
      if (roomId && userId) {
        await joinIfInRoom(client, { roomId, userId });
      }
    }
  }
  
export function clientSentMessageHandler(client: Socket) {
  return async (message: ClientChatMessage) => {
    console.log('girdi');
        const senderUserId = message.user.id;
        const roomId = message.roomId;
        const room = await Room.findOne({ _id: roomId, "participants.id": senderUserId });
    if (!room) {
          console.log('boyle bir şey yok cikiyorum')
            return;
        }
        const otherParticipants = room.participants.filter((p) => p.id != senderUserId).map((other) => other.id);
        console.log(otherParticipants);
        const msg = await ChatMessage.create(message);
        // await Room.updateOne({ _id: roomId, "participants.id": {$nin: [otherParticipants] }, {});
        await Room.findOneAndUpdate(
            { _id: roomId, "participants.id": { $all: otherParticipants } },
            { $inc: { "participants.$.unread_msg_count": 1 }, $set: { lastMessage: { createdAt: new Date(), sender_name: msg.user.name, text: msg.text } } },
            { multi: true }
        );
  
        client.to(roomId.toString()).emit(EVENTS.CLIENT.MESSAGE_SENT, msg);
        client.to(roomId.toString()).emit(EVENTS.SERVER.LAST_MESSAGE, msg);
  
        await incrementUnreadMessagesCount(otherParticipants);
    }
}

async function joinIfInRoom(socket: Socket, {userId, roomId} : {userId: string, roomId: string}, ) {
    const room = await Room.findOne({ _id: new ObjectId(roomId), "participants.id": new ObjectId(userId) } );
    if (room) {
      socket.join(roomId);
    }
  }