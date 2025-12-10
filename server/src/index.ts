import express, { Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth"
import cookieParser from "cookie-parser";
import gamesRouter from "./routes/games";
import userRouter from "./routes/user";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);
app.use(cookieParser())
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB error:", err));

const PORT = 5000;

app.use("/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/games", gamesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
