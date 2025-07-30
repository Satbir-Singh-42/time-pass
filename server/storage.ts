import { 
  type User, 
  type InsertUser, 
  type Player, 
  type InsertPlayer, 
  type Team, 
  type InsertTeam, 
  type Auction, 
  type InsertAuction 
} from "@shared/schema";
import { randomUUID } from "crypto";

// Enhanced interface with all CRUD methods for cricket auction platform
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player management
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: string): Promise<boolean>;
  
  // Team management
  getTeam(id: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<boolean>;
  
  // Auction management
  getAuction(id: string): Promise<Auction | undefined>;
  getAllAuctions(): Promise<Auction[]>;
  getActiveAuctions(): Promise<Auction[]>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: string, updates: Partial<Auction>): Promise<Auction>;
  deleteAuction(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private players: Map<string, Player>;
  private teams: Map<string, Team>;
  private auctions: Map<string, Auction>;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.teams = new Map();
    this.auctions = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Initialize with completely empty state - no dummy/fake data
    // All data will be added only through the admin interface
    // This ensures data integrity and prevents confusion with fake entries
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Player methods
  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id,
      status: insertPlayer.status || "Available",
      assignedTeam: null,
      pool: insertPlayer.pool || null,
      isDuplicate: false,
      createdAt: new Date()
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const player = this.players.get(id);
    if (!player) throw new Error("Player not found");
    
    const oldTeam = player.assignedTeam;
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    
    // Update team statistics if player team assignment changed
    if (updates.assignedTeam !== undefined && updates.assignedTeam !== oldTeam) {
      // Remove from old team if existed
      if (oldTeam) {
        await this.updateTeamStats(oldTeam);
      }
      // Add to new team if exists
      if (updates.assignedTeam) {
        await this.updateTeamStats(updates.assignedTeam);
      }
    }
    
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { 
      ...insertTeam, 
      id,
      budget: insertTeam.budget ?? 1500000,
      remainingBudget: insertTeam.budget ?? 1500000,
      logoUrl: insertTeam.logoUrl || null,
      playersCount: 0,
      captainId: null,
      totalPoints: 0,
      createdAt: new Date()
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id);
    if (!team) throw new Error("Team not found");
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    // When deleting a team, reset all players assigned to this team
    const playersToUpdate = Array.from(this.players.values()).filter(p => p.assignedTeam === id);
    for (const player of playersToUpdate) {
      await this.updatePlayer(player.id, { assignedTeam: null, status: "Available" });
    }
    
    return this.teams.delete(id);
  }

  // Helper method to update team statistics
  private async updateTeamStats(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) return;
    
    const teamPlayers = Array.from(this.players.values()).filter(p => p.assignedTeam === teamId);
    const playersCount = teamPlayers.length;
    const totalPoints = teamPlayers.reduce((sum, player) => sum + player.points, 0);
    
    // Calculate total spent (simplified calculation based on base prices)
    const totalSpent = teamPlayers.reduce((sum, player) => {
      const priceStr = player.basePrice.replace(/[₹,]/g, '');
      let price = 0;
      if (priceStr.includes('Cr')) {
        price = parseFloat(priceStr.replace('Cr', '')) * 10000000;
      } else if (priceStr.includes('L')) {
        price = parseFloat(priceStr.replace('L', '')) * 100000;
      } else {
        price = parseFloat(priceStr) || 0;
      }
      return sum + price;
    }, 0);
    
    const remainingBudget = team.budget - totalSpent;
    
    await this.updateTeam(teamId, {
      playersCount,
      totalPoints,
      remainingBudget: Math.max(0, remainingBudget)
    });
  }

  // Auction methods
  async getAuction(id: string): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }

  async getAllAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values());
  }

  async getActiveAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(auction => auction.isActive);
  }

  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = randomUUID();
    const auction: Auction = { 
      ...insertAuction, 
      id,
      biddingTeam: insertAuction.biddingTeam ?? null,
      isActive: false,
      startedAt: new Date(),
      endedAt: null
    };
    this.auctions.set(id, auction);
    return auction;
  }

  async updateAuction(id: string, updates: Partial<Auction>): Promise<Auction> {
    const auction = this.auctions.get(id);
    if (!auction) throw new Error("Auction not found");
    
    const updatedAuction = { ...auction, ...updates };
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }

  async deleteAuction(id: string): Promise<boolean> {
    return this.auctions.delete(id);
  }
}

export const storage = new MemStorage();
