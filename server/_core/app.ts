import express, { type Express } from "express";
import type { Server } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { organizeWithOpenRouter } from "./openrouter";
import { z } from "zod";

export async function createApp(server?: Server): Promise<Express> {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.post("/api/field/organize", async (req, res) => {
    const parsed = z.object({ text: z.string().trim().min(1).max(12000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Envie um texto de campo válido." });
    try {
      const candidates = await organizeWithOpenRouter(parsed.data.text);
      return res.json({ candidates });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível organizar a informação.";
      const status = message.includes("não configurada") ? 503 : 502;
      return res.status(status).json({ error: message });
    }
  });

  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development" && server) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return app;
}
