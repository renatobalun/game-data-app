import jwt from "jsonwebtoken";
import { IUser } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment");
}

//stvaranje JWTa
export function createJwtForUser(user: IUser): string {
  const payload = {
    id: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export type JwtPayload = {
  id: string;
  username: string;
  iat: number;
  exp: number;
};
