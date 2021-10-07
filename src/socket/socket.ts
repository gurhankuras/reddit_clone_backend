import { Server, Socket } from 'socket.io';
import setStatusOnline from '../user/setStatusOnline';
import extractUserId from '../utils/extractUserId';
import { clientSentMessageHandler, joinRoomListener, userDisconnectedListener, userTypingListener } from './listeners/chat.socketlistener';

import { redisClient } from '../app';

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
    LAST_MESSAGE: 'last_message'
  },
};




export default function socket({ io }: { io: Server }) {

  io.on(EVENTS.CONNECTION, async (client: Socket) => {
    const userId = extractUserId(client);
    if (userId) {
      redisClient.set(userId, client.id);
      // await setStatusOnline(userId, true);
    }

    client.join('612cc72f65a882665306cc0e');
    console.log('new client');
    
    
    client.on(EVENTS.CLIENT.JOIN_ROOM, joinRoomListener(client));
    // TODO: add transaction
    client.on(EVENTS.CLIENT.MESSAGE_SENT, clientSentMessageHandler(client));
    client.on(EVENTS.CLIENT.TYPING, userTypingListener(io));
    client.on('disconnect', userDisconnectedListener(client));
    
    client.onAny((event, ...args) => {
      console.log(event, args);
    });
  });
}




