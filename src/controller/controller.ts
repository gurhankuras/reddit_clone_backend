import * as userInboxControllers from './userInbox.controller';
import * as authControllers from './auth.controller';
import * as meControllers from './me.controller';
import * as chatControllers from './chat.controller';

const v = { ...userInboxControllers, ...authControllers, ...meControllers, ...chatControllers };
export default v;