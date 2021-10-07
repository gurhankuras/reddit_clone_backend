import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import config from 'config';
import socket from './socket/socket';
import connect from './utils/db';
import User from './model/user.model';
import { ObjectId } from 'mongodb';
import verifyToken from './middleware/verifyToken';
import cors from 'cors';

import * as userInboxControllers from './controller/userInbox.controller';
import { createChatRoom } from './utils/createChatRoom';
import * as c from './controller/controller';
import redis from 'redis';

const controllers = c.default;

const app = express();
app.use(express.json());
const httpServer = createServer(app);


export const redisClient = redis.createClient();
redisClient.on("error", (error) => {
  console.error(error);
});

const port = config.get<number>('port');
const host = config.get<string>('host');
const corsOrigin = config.get<string>('corsOrigin');
export const io = new Server(
  httpServer, {
    cors: {
      origin: '*',
      credentials: true
  }}
);

io.use((client: Socket, next) => {
  const userId = client.handshake.auth.userId;
  console.log(userId);
  if (!userId) {
    console.error('userId not provided');
  }
  // @ts-ignore
  client.userId = userId;
  next();
});

app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});



app.get('/deneme', async (_, __) => {
  await User.updateOne({_id: new ObjectId("61333e7c3e51246558fc1e11"), "prefs.forced_offline": false}, {$set: {"prefs.online": true}});
  const user = await User.findOne({_id: new ObjectId("61333e7c3e51246558fc1e11"), "prefs.forced_offline": false});
  
  __.send(user);
  
});


// PREFS
app.patch('/api/me/prefs', verifyToken, controllers.patchPrefs);

// AUTH
app.post('/api/login', controllers.loginWithEmail);
app.post('/api/register', controllers.register);
app.get('/api/protected', verifyToken, controllers.getUserAccount);
app.get('/api/register/availability', controllers.checkIfUsernameEmailNotExists);


// CHAT
app.get('/api/chat/rooms/:roomId', controllers.getChatMessages);
app.get('/api/chat', verifyToken, controllers.getChatRooms);
app.post('/api/chat/send', controllers.sendMessage);


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
  connect();
  // connect().then((_) => {
  //   createChatRoom();
  // });
  socket({ io });
});

export default app;
