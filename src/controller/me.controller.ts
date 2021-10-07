import { Request, Response} from 'express';
import * as v from '../schema/schemas';
import User from '../model/user.model';
import makeError from '../utils/makeError';
import makeSetUpdate from '../utils/makeSetOpObj';

export async function patchPrefs(req: Request, res: Response) {
    const {error, value } = v.prefsValidation(req.body);
  
    if (error) {
      res.status(400).send(makeError(error));
      return;
    }
    // @ts-ignore
    const user = req.user;
    const set = makeSetUpdate(value, 'prefs');
    // TODO: error handling
    const result = await User.updateOne({ _id: user._id }, { $set: set});
    res.sendStatus(200);
  }