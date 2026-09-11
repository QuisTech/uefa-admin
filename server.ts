import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { UEFAService } from "./api/index";

const app = express();
const PORT = 3000;

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Request Logging
  app.use((req, res, next) => {
    console.log(`[UEFA REQUEST] ${req.method} ${req.url}`);
    next();
  });

  // Body parser
  app.use(express.json());

  // API Endpoints
  app.get("/api/user", async (req, res) => {
    res.json({ tier: 'ai-agent' });
  });

  app.get("/api/recommendations", async (req, res) => {
    try {
      const riskMode = (req.query.riskMode as string) || 'safe';
      const budget = req.query.budget ? parseFloat(req.query.budget as string) : 100.0;
      const fuel = (req.query.fuel as string) || 'native';
      const tier = (req.query.tier as string) || 'ai-agent';
      const scenario = (req.query.scenario as any) || 'quant';
      const targetMatchday = req.query.matchday ? parseInt(req.query.matchday as string) : undefined;
      
      const lockedPlayerIds = req.query.lockedPlayerIds 
        ? (req.query.lockedPlayerIds as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
        : [];
      const excludedPlayerIds = req.query.excludedPlayerIds 
        ? (req.query.excludedPlayerIds as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
        : [];

      console.log(`[UEFA API] Recs: riskMode=${riskMode}, budget=${budget}, fuel=${fuel}, scenario=${scenario}`);
      
      const result = await UEFAService.getRecommendations(
        riskMode, 
        budget, 
        tier, 
        fuel, 
        scenario, 
        lockedPlayerIds, 
        excludedPlayerIds, 
        targetMatchday
      );
      res.json(result);
    } catch (error: any) {
      console.error("[UEFA Local API Error]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to generate recommendations" });
    }
  });

  app.get("/api/sync/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const riskMode = (req.query.riskMode as string) || 'safe';
      const result = await UEFAService.syncTeam(teamId, riskMode);
      res.json(result);
    } catch (error: any) {
      console.error("[UEFA Local Sync Error]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to sync team" });
    }
  });

  app.get("/api/live/:matchdayId", async (req, res) => {
    try {
      const { matchdayId } = req.params;
      const result = await UEFAService.getLiveMatchday(parseInt(matchdayId));
      res.json(result);
    } catch (error: any) {
      console.error("[UEFA Local Live Error]:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to fetch live data" });
    }
  });

  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UEFA-ADMIN] Champions League Quant Server running on http://localhost:${PORT}`);
  });
}

startServer();
