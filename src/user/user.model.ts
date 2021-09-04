import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface UserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  prefs: {
    online: boolean,
    forced_offline: boolean,
    premium: boolean,
    over_18: boolean,
    verified: boolean,
    num_friends: number

  }
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      max: 20,
      min: 4,
    },

    email: {
      type: String,
      required: true,
      min: 6,
      max: 50,
    },

    password: {
      type: String,
      required: true,
      min: 6,
      max: 1024,
    },
    coins: {type: Number, default: 0, min: 0},
    prefs: {
      online: {type: Boolean, default: false},
      forced_offline: {type: Boolean, default: false},
      premium: { type: Boolean, default: false },
      over_18: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      num_friends: {type: Number, default: 0, min: 0}
    }

  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<UserDocument>('User', UserSchema);
export default User;
