import { createApp } from "./app.js";
import { connectDb } from "./db/connect.js";
import { env } from "./config/env.js";

const app = createApp();

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Saarthi API listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start Saarthi API", error);
    process.exit(1);
  });
