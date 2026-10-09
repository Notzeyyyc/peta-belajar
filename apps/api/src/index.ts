import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const PORT = Number(process.env.PORT ?? 4000);

createApp().listen(PORT, () => {
  logger.info({ port: PORT }, `peta-belajar-api listening on http://localhost:${PORT}`);
});
