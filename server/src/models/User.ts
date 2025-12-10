import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  twitchId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

const UserSchema = new Schema<IUser>(
  {
    twitchId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
