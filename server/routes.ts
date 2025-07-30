import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, 
  insertTeamSchema, 
  insertAuctionSchema,
  insertAuctionLogSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Player routes
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/players/:id", async (req, res) => {
    try {
      const updates = req.body;
      const player = await storage.updatePlayer(req.params.id, updates);
      res.json(player);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const success = await storage.deletePlayer(req.params.id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const updates = req.body;
      const team = await storage.updateTeam(req.params.id, updates);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const success = await storage.deleteTeam(req.params.id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auction routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const auctions = await storage.getAllAuctions();
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auctions/active", async (req, res) => {
    try {
      const auctions = await storage.getActiveAuctions();
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auctions/:id", async (req, res) => {
    try {
      const auction = await storage.getAuction(req.params.id);
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      res.json(auction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auctions", async (req, res) => {
    try {
      const auctionData = insertAuctionSchema.parse(req.body);
      const auction = await storage.createAuction(auctionData);
      res.status(201).json(auction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/auctions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const auction = await storage.updateAuction(req.params.id, updates);
      res.json(auction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/auctions/:id", async (req, res) => {
    try {
      const success = await storage.deleteAuction(req.params.id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [players, teams, auctions] = await Promise.all([
        storage.getAllPlayers(),
        storage.getAllTeams(),
        storage.getAllAuctions()
      ]);

      const soldPlayers = players.filter(p => p.status === "Sold");
      const availablePlayers = players.filter(p => p.status === "Available");
      const unsoldPlayers = players.filter(p => p.status === "Unsold");
      const activeAuctions = auctions.filter(a => a.isActive);

      // Calculate total spent from sold players (using soldPrice in lakhs)
      const totalSpent = soldPlayers.reduce((sum, player) => {
        return sum + (player.soldPrice || 0);
      }, 0);
      
      // Calculate total budget across all teams
      const totalBudget = teams.reduce((sum, team) => sum + team.budget, 0);

      const stats = {
        totalPlayers: players.length,
        availablePlayers: availablePlayers.length,
        totalTeams: teams.length,
        totalBudget,
        playersSold: soldPlayers.length,
        totalSpent,
        auctionStatus: activeAuctions.length > 0 ? "Active" : "Not Started",
        activeAuctions: activeAuctions.length
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auction logs routes
  app.get("/api/auction-logs", async (req, res) => {
    try {
      const logs = await storage.getAllAuctionLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auction-logs", async (req, res) => {
    try {
      const logData = insertAuctionLogSchema.parse(req.body);
      const log = await storage.createAuctionLog(logData);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Pool management routes
  app.get("/api/pools", async (req, res) => {
    try {
      const pools = await storage.getAllPools();
      res.json(pools);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pools/:poolName/players", async (req, res) => {
    try {
      const players = await storage.getPlayersByPool(req.params.poolName);
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export routes
  app.get("/api/export/results", async (req, res) => {
    try {
      const [players, teams, logs] = await Promise.all([
        storage.getAllPlayers(),
        storage.getAllTeams(),
        storage.getAllAuctionLogs()
      ]);

      // Create CSV content
      const csvContent = [
        'Player Name,Role,Country,Base Price (₹L),Sold Price (₹L),Team,Status',
        ...players.map(p => `${p.name},${p.role},${p.country},${p.basePrice},${p.soldPrice || 'N/A'},${p.assignedTeam || 'N/A'},${p.status}`)
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ipl-auction-results.csv"');
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
