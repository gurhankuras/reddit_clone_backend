import { FilterQuery } from "mongoose";
import User, { UserDocument } from "./user.model";

export default async function userExists(filter: FilterQuery<UserDocument>): Promise<boolean> {
    const count = await User.count(filter);
    return count == 1 ? true : false;
}