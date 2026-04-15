import mongoose from "mongoose";
import { env } from "../config/env.js";

let connected = false;

export const connectDb = async () => {
  if (connected) {
    return mongoose.connection;
  }

  await mongoose.connect(process.env.MONGODB_URI ?? env.mongoUri);
  connected = true;
  return mongoose.connection;
};

export const disconnectDb = async () => {
  if (!connected) {
    return;
  }

  await mongoose.disconnect();
  connected = false;
};
