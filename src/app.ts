import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import config from 'config';
import socket, { EVENTS } from './socket';
const serviceAccount = require('../firebase-private-key.json');
import connect from './utils/db';
import * as admin from 'firebase-admin';
import Room from './room/room.model';
import ChatMessage from './chat_message/chatMessage.model';
import User from './user/user.model';
import * as v from './schema/schemas';
import makeError from './utils/makeError';
import { hash, compare } from 'bcrypt';
import RegisterBody from './body-interfaces/register.body';
import LoginBody from './body-interfaces/login.body';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import lodash, { join } from 'lodash';
import verifyToken from './middleware/verifyToken';
import makeSetUpdate from './utils/makeSetOpObj';
import Joi from 'joi';
import userExists from './user/userExists';
import UserInbox from './userInbox/userInbox.model';
import * as userInboxControllers from './controller/userInbox.controller';


const token =
'eUJ9KwYJS3yjO3OvyR7Zg5:APA91bHJlqihps9s4OMKSoCwEFqlta_RfCuO9KPGp19eElnzlpBL91PBXI0NcQuYfaVQyVZ4VXTyzdS2hhiWqojVoBSlEbzqIaENE2m8T9OQTCgzL-vqUxiD4bAYR0FdjzsWmjRjyKP3';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const userNotifications = {
  unread_messages_count: 1,
  unread_activities_count: 4,
  inbox_unread_messages_count: 100,
}

const activities = [
  {
    _id: '1',
    itemId: '1',
    title: '',
    text: 'sasasas',
    subredditName:'TowerOfGod',
    createdAt: '2021-09-13T14:21:45.858',
  },
  {
    _id: '2',
    itemId: '2',
    title: '',
    text: 'sasasas',
    subredditName:'TowerOfGod',
    createdAt: '2021-09-13T14:21:45.858',
  }
];


const app = express();
app.use(express.json());
const httpServer = createServer(app);

const port = config.get<number>('port');
const host = config.get<string>('host');

const io = new Server(
  httpServer
);

io.use((client: Socket, next) => {
  const userId = client.handshake.auth.userId;
  if (!userId) {
    console.error('userId not provided');
  }
  // @ts-ignore
  client.userId = userId;
  next();
});

app.get('/api/protected', verifyToken, async (req, res) => {
  // @ts-ignore
  const userId = req.user._id;

  const user = await User.findById(userId, {password: 0}).lean();
  return res.send(user);
});


app.get('/deneme', async (_, __) => {
  await User.updateOne({_id: new ObjectId("61333e7c3e51246558fc1e11"), "prefs.forced_offline": false}, {$set: {"prefs.online": true}});
  const user = await User.findOne({_id: new ObjectId("61333e7c3e51246558fc1e11"), "prefs.forced_offline": false});

  __.send(user);

});

app.post('/api/login', async (req, res, next) => {
  const { error, value } = v.loginValidation(req.body);
  if (error) {
    console.log(error);
    res.status(400).send(makeError(error));
    return
  }
  const { username, password } = <LoginBody>value;
  const user = await User.findOne({ username: username }).lean();

  if (!user) {
    console.log(user);
    res.status(404).send({ error: 'Wrong username or password!' });
    return;
  }
  console.log(password, user.password);
  const matched = await compare(password, user.password);

  if (!matched) {
    console.log(matched);
    res.status(404).send({error: 'Wrong username or password!'});
    return;
  }

  const secret = config.get<string>('jwt_secret');

  const passwordExtractedUser = lodash.omit(user, ['password']);
  const token = jwt.sign(passwordExtractedUser, secret, {expiresIn: 60 * 60 * 24 * 365});

  res.header('Authorization', token).status(200).send(passwordExtractedUser);
  // res.status(200).send(savedUser);
  
});


app.post('/api/register', async (req, res, next) => {
  const { error, value } = v.registerValidation(req.body);
  if (error) {
    return res.status(400).send(makeError(error));
  }
  const { username, password, email } = <RegisterBody> value;
  const usernameExists = await User.findOne({ username: username });

  if (usernameExists) {
    return res.status(404).send({error: 'Username already exists!'});
  }

  const hashedPassword = await hash(password, 10);

  const user = new User({
    username: username,
    password: hashedPassword,
    email: email,
  });

  try {
    const savedUser = await user.save();
    const passwordExtractedUser = lodash.omit(savedUser, ['password']);
    res.status(201).send(passwordExtractedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});





app.get('/api/register/availability', async (req, res, _) => {
  console.log(req.method, '/api/register/availability');
  const username = req.query.username as string || undefined;
    const email = req.query.email as string || undefined;
  
  if (username && email) {
    res.status(422).send({ error: 'Incorrect use of endpoint' });
  }
    
  const { error, value } = v.avaiabilityQueryValidation(req.query);
  if (error) {
    return res.status(422).send(false);
  }


  const filter: Partial<{email: string, username: string}> = {} ;
  if (username) {
    filter.username = username;
  }
  if (email) {
    filter.email = email;
  }
  console.log(filter);
  const exists = await userExists(filter);
  res.status(200).send(!exists);
});

// app.patch('/api/me/prefs', verifyToken, async (req, res, _) => {

  
//   res.sendStatus(200);
// });

app.patch('/api/me/prefs', verifyToken, async (req, res, next) => {
  const {error, value } = v.prefsValidation(req.body);

  if (error) {
    res.status(400).send(makeError(error));
    return;
  }

  // @ts-ignore
  const user = req.user;
  const set = makeSetUpdate(value, 'prefs');

  const result = await User.updateOne({ _id: user._id }, { $set: set});
  res.sendStatus(200);
});

app.get('/api/chat/rooms/:roomId', async (req, res) => {
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
});

app.get('/api/chat', verifyToken, async (req, res) => {
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
});

app.post('/api/chat/send', async (req, res) => {
  
  console.log(req.body);
  // TODO: is this user in the room
  
  const message = await ChatMessage.create(req.body);
  io.in(req.body.roomId).emit(EVENTS.CLIENT.MESSAGE_SENT, message);
  io.in(req.body.roomId).emit(EVENTS.SERVER.LAST_MESSAGE, message);

  const a = await admin.messaging().sendToDevice(token, {
    notification: { body: req.body.text, title: req.body.user.name },
    data: { route: '/chatPage' },
  });
  console.log(a);
  const room = await Room.findOne({ _id: req.body.roomId });
  userNotifications.unread_messages_count += 1;
  io.in(req.body.roomId).emit(EVENTS.SERVER.NOTIFICATION, userNotifications);

  if (room) {
    console.log(room._id);

  }
  res.sendStatus(200);
});

app.get('/api/notifications'/*, verifyToken*/, async (req, res) => {
  res.send(userNotifications);
});


// INBOX
app.get('/api/me/inbox/messages', verifyToken, userInboxControllers.getInboxMessages);
app.post('/api/me/inbox/messages', verifyToken, userInboxControllers.postInboxMessage);
app.post('/api/me/inbox/messages/mark-read', verifyToken, userInboxControllers.markInboxMessageAsRead);

app.delete('/api/me/inbox/activities', verifyToken, userInboxControllers.deleteActivityMessage);
app.get('/api/me/inbox/activities', verifyToken, userInboxControllers.getActivityMessages);
app.post('/api/me/inbox/activities/demo', verifyToken, userInboxControllers.demoCreateActivityMessage);







httpServer.listen(port, host, () => {
  console.log(`🚀 Server version  is listening 🚀`);
  console.log(`http://${host}:${port}`);
  connect().then((_) => {
    // Room.create({
    //   participants: [
    //     { id: new ObjectId('610d52b15d5e8b1ee8970cc7'), joinedAt: new Date() },
    //     {
    //       id: new ObjectId('611b951eb51a262e8c141226'),
    //       joinedAt: new Date(),
    //     },
    //   ],
    // });
  });
  socket({ io });
  // admin.messaging().sendToDevice(token, {
  //   notification: { body: 'Evet ben de oyle dusunuyorum', title: 'Emre' },
  //   data: { path: '/chatPage' },
  // });
  // console.log(firebaseKey);
});

export default app;
