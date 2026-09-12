import "dotenv/config";
import { createServer as createViteServer } from "vite";
import app from "./api/index.js";

const PORT = 3000;

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Request Logging
  app.use((req, _res, next) => {
    console.log(`[UEFA REQUEST] ${req.method} ${req.url}`);
    next();
  });

  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UEFA-ADMIN] Champions League Quant Server running on http://localhost:${PORT}`);
  });
}

startServer();

