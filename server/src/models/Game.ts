import mongoose, { Document, Schema } from "mongoose";

export interface IGame extends Document {
  source: "igdb" | "rawg";
  externalId: number | string;
  name: string;
  summary?: string;
  rating?: number;
  releaseDate?: Date;
  platforms?: string[];
  genres?: string[];
  coverUrl?: string;
}

const GameSchema = new Schema<IGame>(
  {
    source: { type: String, enum: ["igdb", "rawg"], required: true },
    externalId: { type: Schema.Types.Mixed, required: true, index: true },
    name: { type: String, required: true },
    summary: String,
    rating: Number,
    releaseDate: Date,
    platforms: [String],
    genres: [String],
    coverUrl: String,
  },
  { timestamps: true }
);

export const Game = mongoose.model<IGame>("Game", GameSchema);
