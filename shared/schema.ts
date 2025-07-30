import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // admin, viewer
  displayName: text("display_name"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(), // Batsman, Bowler, All-rounder, Wicket-keeper
  country: text("country").notNull(),
  basePrice: integer("base_price").notNull(), // Base price in lakhs
  bio: text("bio"), // Player biography/description
  pool: text("pool"), // Pool A, Pool B, Pool C, etc.
  status: text("status").notNull().default("Available"), // Available, Sold, Unsold
  soldPrice: integer("sold_price"), // Final auction price in lakhs
  assignedTeam: varchar("assigned_team"), // null or team_id
  performanceStats: text("performance_stats"), // JSON string with detailed stats
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  colorTheme: text("color_theme").notNull(), // Team accent color
  budget: integer("budget").notNull().default(8000), // 80 lakhs default in lakhs
  remainingBudget: integer("remaining_budget").notNull().default(8000),
  totalSpent: integer("total_spent").default(0),
  playersCount: integer("players_count").default(0),
  totalPoints: integer("total_points").default(0),
  logoUrl: text("logo_url"), // Optional team logo
  createdAt: timestamp("created_at").defaultNow(),
});

export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull().references(() => players.id),
  currentBid: integer("current_bid").notNull(), // Current bid in lakhs
  winningTeam: varchar("winning_team"), // team id of highest bidder
  finalPrice: integer("final_price"), // Final sold price in lakhs
  isActive: boolean("is_active").default(false),
  isCompleted: boolean("is_completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Auction logs table for maintaining complete auction history
export const auctionLogs = pgTable("auction_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull().references(() => players.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  soldPrice: integer("sold_price").notNull(), // Price in lakhs
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
}).extend({
  role: z.enum(["admin", "viewer"]).default("viewer"),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  role: true,
  country: true,
  basePrice: true,
  bio: true,
  pool: true,
  performanceStats: true,
}).extend({
  role: z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]),
  status: z.enum(["Available", "Sold", "Unsold"]).default("Available"),
  basePrice: z.number().min(5, "Minimum base price is ₹5 Lakhs").max(2000, "Maximum base price is ₹20 Crores"),
  bio: z.string().optional(),
  performanceStats: z.string().optional(),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  colorTheme: true,
  budget: true,
  logoUrl: true,
}).extend({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name must be less than 50 characters"),
  colorTheme: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color code"),
  budget: z.number().min(5000, "Minimum budget is ₹50 Lakhs").max(15000, "Maximum budget is ₹150 Crores"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  playerId: true,
  currentBid: true,
  winningTeam: true,
});

export const insertAuctionLogSchema = createInsertSchema(auctionLogs).pick({
  playerId: true,
  teamId: true,
  soldPrice: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctions.$inferSelect;

export type InsertAuctionLog = z.infer<typeof insertAuctionLogSchema>;
export type AuctionLog = typeof auctionLogs.$inferSelect;
