import { afterAll, beforeAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, disconnectDb } from "../db/connect.js";

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
