import { z } from "zod";

// Pure TypeScript interfaces for Firebase Firestore data models
// No PostgreSQL dependencies - using Firebase exclusively

export interface User {
  id: string;
  username: string;
  password: string;
  role: "admin" | "viewer";
  displayName?: string | null;
  isActive?: boolean;
  lastLogin?: Date | null;
  createdAt?: Date;
}

export interface Player {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  country: string;
  basePrice: number; // Base price in lakhs
  bio?: string | null;
  pool?: string | null; // Pool A, Pool B, Pool C, etc.
  status: "Available" | "Sold" | "Unsold";
  soldPrice?: number | null; // Final auction price in lakhs
  assignedTeam?: string | null; // team_id
  performanceStats?: string | null; // JSON string with detailed stats
  createdAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  colorTheme: string; // Team accent color
  budget: number; // Budget in lakhs (default 8000 = 80L)
  remainingBudget: number;
  totalSpent: number;
  playersCount: number;
  totalPoints: number;
  logoUrl?: string | null;
  createdAt?: Date;
}

export interface Auction {
  id: string;
  playerId: string;
  currentBid: number; // Current bid in lakhs
  winningTeam?: string | null; // team id of highest bidder
  finalPrice?: number | null; // Final sold price in lakhs
  isActive: boolean;
  isCompleted: boolean;
  startedAt?: Date;
  completedAt?: Date | null;
}

export interface AuctionLog {
  id: string;
  playerId: string;
  teamId: string;
  soldPrice: number; // Price in lakhs
  timestamp?: Date;
}

// Zod validation schemas for input validation
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "viewer"]).default("viewer"),
  displayName: z.string().optional(),
});

export const insertPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  role: z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]),
  country: z.string().min(1, "Country is required"),
  basePrice: z.number().min(5, "Minimum base price is ₹5 Lakhs").max(2000, "Maximum base price is ₹20 Crores"),
  bio: z.string().optional(),
  pool: z.string().optional(),
  performanceStats: z.string().optional(),
});

export const insertTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name must be less than 50 characters"),
  colorTheme: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color code"),
  budget: z.number().min(5000, "Minimum budget is ₹50 Lakhs").max(15000, "Maximum budget is ₹150 Crores").default(8000),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const insertAuctionSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  currentBid: z.number().min(0, "Current bid must be non-negative"),
  winningTeam: z.string().optional(),
});

export const insertAuctionLogSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  soldPrice: z.number().min(0, "Sold price must be non-negative"),
});

// Type definitions for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type InsertAuctionLog = z.infer<typeof insertAuctionLogSchema>;
