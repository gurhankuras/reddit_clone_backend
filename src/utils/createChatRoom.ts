import Room from "../model/room.model";
import { ObjectId } from 'mongodb';

export async function createChatRoom() {
    Room.create({
        participants: [
          { id: new ObjectId('610d52b15d5e8b1ee8970cc7'), joinedAt: new Date() },
          {
            id: new ObjectId('611b951eb51a262e8c141226'),
            joinedAt: new Date(),
          },
        ],
      });
  }
  