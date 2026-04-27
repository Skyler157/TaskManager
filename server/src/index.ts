import { createApp } from "./app";
import { env } from "./config/env";
import { connectDb } from "./lib/db";

async function main() {
  await connectDb();
  const app = createApp();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});

