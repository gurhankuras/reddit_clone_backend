import { Request, Response} from 'express';
// userInboxControllers
import { ObjectId } from 'mongodb';
import makeError from '../utils/makeError';
import UserInbox from '../model/userInbox.model';
import * as v from '../schema/schemas';
import User from '../model/user.model';
import { compare, hash } from 'bcrypt';
import config from 'config';
import lodash from 'lodash';
import jwt from 'jsonwebtoken';
import LoginBody from '../request_body/login.body';
import RegisterBody from '../request_body/register.body';
import userExists from '../user/userExists';
import { io } from '../app';
import { EVENTS } from '../socket/socket';
import ChatMessage from '../model/chatMessage.model';
import * as admin from 'firebase-admin';
import Room from '../model/room.model';
const serviceAccount = require('../../firebase-private-key.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function sendMessage(req: Request, res: Response) {
    console.log(req.body);
    // TODO: is this user in the room
    
    const message = await ChatMessage.create(req.body);
    io.in(req.body.roomId).emit(EVENTS.CLIENT.MESSAGE_SENT, message);
  io.in(req.body.roomId).emit(EVENTS.SERVER.LAST_MESSAGE, message);
  
  const token = config.get<string>('push_notification_device_token');

    const a = await admin.messaging().sendToDevice(token, {
      notification: { body: req.body.text, title: req.body.user.name },
      data: { route: '/chatPage' },
    });
    console.log(a);
    const room = await Room.findOne({ _id: req.body.roomId });
    // userNotifications.unread_messages_count += 1;
    // io.in(req.body.roomId).emit(EVENTS.SERVER.NOTIFICATION, userNotifications);
  
    if (room) {
      console.log(room._id);
  
    }
    res.sendStatus(200);
}
  


export async function getChatRooms(req: Request, res: Response) {
  // const roomId = req.params.roomId;
  // @ts-ignore
  const user = req.user;
  console.log(user);
  try {
    const fetchedChats = await Room.find({ 'participants.id': user._id }).lean();
    const chats = fetchedChats.map((chatRoom) => {
      return { _id: chatRoom._id, createdAt: chatRoom.createdAt, lastMessage: chatRoom.lastMessage, user: chatRoom.participants.filter((p) => p.id == user._id)[0], avatar: chatRoom.avatar  };
    });

    res.status(200).send(chats);
    
  } catch (error) {
  res.status(400).send({error: 'Unexpected'});
  }
  // // @ts-ignore
  // const limit = Number.parseInt(req.query.limit || '') || 5;
  // // const skip =
  // // @ts-ignore
  // const page = Number.parseInt(req.query.page || '') || 1;

  // const messages = await ChatMessage.find({ roomId: roomId })
  //   .sort({ createdAt: -1 })
  //   .skip((page - 1) * limit)
  //   .limit(limit)
  //   .lean();

  // res.status(200).send(messages.reverse());
}



export async function getChatMessages(req: Request, res: Response) {
  const roomId = req.params.roomId;
  const {value, error} = v.fetchChatMessagesQueryValidaton(req.query);
  if (error) {
    return res.status(422).send(makeError(error));
  }
  const {page, limit, fetchedAt }: { limit: number, page: number, fetchedAt: string | undefined } = value;
  
  const query = {roomId: roomId};
  if (fetchedAt) {
    // @ts-ignore
    query.createdAt = { $lte: fetchedAt };
  }

  console.log(query)

  // TODO: add index for createdAt
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.status(200).send({messages, fetchedAt: fetchedAt || new Date().toISOString()});
}

