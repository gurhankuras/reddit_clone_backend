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

export async function loginWithEmail (req: Request, res: Response)  {
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
}
  


export async function register(req: Request, res: Response)  {
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
}
  



export async function checkIfUsernameEmailNotExists (req: Request, res: Response) {
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
}
  


export async function getUserAccount(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user._id;
  const user = await User.findById(userId, {password: 0}).lean();
  return res.send(user);
}