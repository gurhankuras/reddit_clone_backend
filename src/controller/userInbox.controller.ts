import { Request, Response} from 'express';
// userInboxControllers
import { ObjectId } from 'mongodb';
import makeError from '../utils/makeError';
import UserInbox from '../userInbox/userInbox.model';
import * as v from '../schema/schemas';

// /api/me/inbox/messages
export async function postInboxMessage(req: Request, res: Response) {
    // @ts-ignore
    const userId = req.user._id;
  console.log(`${userId}`);
    const result = await UserInbox.updateOne({ userId: new ObjectId(userId) },
      {
        $push: {
          messages:
          
            {
              "title": "Second message",
              "subredditName": "welcomebot",
              "text": "welcome to hell",
              "hasRead": false,
              "createdAt": new Date(),
              "_id": new ObjectId(),
            }
          // {
            // $each: [
              //{
            //   "title": "First message",
            //   "subredditName": "welcomebot",
            //   "text": "bu bir deneme",
            //   "hasRead": false,
            //   "createdAt": new Date(),
            //   "_id": new ObjectId(),
            // }
          //],
            // $sort: { createdAt: -1 }
          // }
        }
      },
      { upsert: true }
    );
    res.send(result);
}
  

// /api/me/inbox/messages/mark-read
export async function markInboxMessageAsRead(req: Request, res: Response) {
    // @ts-ignore
  const userId = req.user._id;  
  const messageId = req.body.messageId;
  const {value, error } = v.validateId(messageId);
    if (error) {
      return res.status(422).send(makeError(error));
  }
  const filter = {
    userId: new ObjectId(userId),
    "messages._id": new ObjectId(messageId)
  };
  const update = { $set: { "messages.$.hasRead": true } };
    try {
      const result = await UserInbox.updateOne(filter, update);
      if (result.modifiedCount == 1) {
        return res.sendStatus(200);
      }
      return res.status(400).send({error: 'couldnt update'});
    } catch (error) {
      return res.status(500).send({error: 'Server Error'}); 
    }
      
}
  
// /api/me/inbox/messages
export async function getInboxMessages(req: Request, res: Response)  {
    if (req.query.all && req.query.since) {
      return res.status(422).send({ error: 'all and since queries cannot coexists.' });
    }
    const { error, value } = v.inboxMessagesQueryValidaton(req.query);
    if (error) {
      return res.status(422).send(makeError(error));
    }
    console.log(req.query);
    // @ts-ignore
    const userId = req.user._id;
    
    if (req.query.all || (!req.query.all && !req.query.since)) {
      try {
        console.log('BURADAYIM');
        const result = await UserInbox.findOne({ userId: new ObjectId(userId) }, { messages: 1 });
        if (!result) {
          return res.status(400).send({error: 'User not found'});
        }
        return res.send(result.messages.reverse());
      } catch (error) {
        return res.status(500).send({error: 'Server Error'});
      }
    }
  const count = await UserInbox.count({'messages.hasRead': true});
  console.log(count);
  
  const pipeline = [
    {
      $match: {
        userId: new ObjectId(userId),
      },
    },
    {
      $project: {
        messages: {
          $filter: {
            input: "$messages",
            as: "message",
            cond: { $gte: ["$$message.createdAt", req.query.since] }
          }
      
        }
      },
    }
  ];
  try {
    let messages = await UserInbox.aggregate(pipeline);
    if (messages.length > 0) {
      messages = messages[0]['messages'];
    }
    return res.send(messages.reverse());
  } catch (error) {
    return res.status(500).send({error: 'Server Error'});
    
  }
}
  


export async function deleteActivityMessage(req: Request, res: Response) {
    // @ts-ignore
  const userId = req.user._id;
  const activityId = req.body.activityId;

  const {value, error } = v.validateId(activityId);
  if (error) {
    return res.status(422).send(makeError(error));
  }
  const filter = { userId: userId };
  const update = { $pull: { activities: { _id: new ObjectId(activityId) } } };
  try {
    const deleteResult = await UserInbox.updateOne(filter, update);
    if (deleteResult.modifiedCount == 1) {
      return res.sendStatus(201);
    }
    return res.status(400).send({error: 'couldnt delete'});    
  } catch (error) {
    return res.status(500).send({ error: 'Server Error' });
  }
}



export async function getActivityMessages(req: Request, res: Response) {
   // @ts-ignore
  const userId = req.user._id;
  try {
    const result = await UserInbox.findOne({ userId: new ObjectId(userId) }, { activities: 1 }).lean();
    console.log(result);
    if (!result) {
      return res.status(404).send([]);
    }
    return res.send(result.activities);
  } catch (error) {
    return res.status(500).send({error: 'Server Error'});
  }
  
}




export async function demoCreateActivityMessage(req: Request, res: Response) {
    // @ts-ignore
  const userId = req.user._id;
  const item = fakeActivity();
    const result = await UserInbox.updateOne(
        { userId: new ObjectId(userId) },
        {
            $push: {
                activities: {
                    $each: [item]
                }
            }
        }
    );
    res.status(201).send(result);
}



const fakeActivity = () => ({
  postId: new ObjectId(),
  _id: new ObjectId(),
  createdAt: new Date(),
  text: `${Date.now() % 1000} So we see FUG being an organization of many different groups that all hate and wanna take down the ten great families and Jahad. What I am wondering is what caused them all this hate? We see examples talked about like reflejio had his eyes taken from him just for looking at a princess of Jahod, and Angel(i think it was angel) brought up the mass rape that happens in the middle tower from the 10 great families. What are some of the other things that make FUG wanna take them down?`,
  activityType: 'trending',
subreddit: {
    id: new ObjectId(),
      avatar: 'https://styles.redditmedia.com/t5_2t4sj/styles/communityIcon_kbhwl3znfci21.png?width=256&s=245eca6512bd43b9a680caed56d8992dad5c3882',
      name: 'TowerOfGod',
},
  title: 'What negative things did the 10 great families and Jahad do?'
}); 