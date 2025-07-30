import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(), // Batsman, Bowler, All-rounder, Wicket-keeper
  country: text("country").notNull(),
  basePrice: text("base_price").notNull(), // String format like "₹15Cr", "₹80L"
  points: integer("points").notNull(),
  age: integer("age").notNull(),
  status: text("status").notNull().default("Available"), // Available, Pooled, Sold, Unsold
  assignedTeam: varchar("assigned_team"), // null or team_id
  pool: text("pool"), // Pool 1, Pool 2, etc.
  isDuplicate: boolean("is_duplicate").default(false),
  stats: text("stats").notNull(), // JSON string: { runs: number, wickets: number, wicketkeeping: number }
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  colorTheme: text("color_theme").notNull(), // Team accent color
  budget: integer("budget").notNull().default(1500000), // 15 lakhs default
  remainingBudget: integer("remaining_budget").notNull().default(1500000),
  logoUrl: text("logo_url"), // Optional team logo
  playersCount: integer("players_count").default(0),
  captainId: varchar("captain_id"), // Player ID of team captain
  totalPoints: integer("total_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull().references(() => players.id),
  currentBid: integer("current_bid").notNull(),
  biddingTeam: varchar("bidding_team"), // team id
  isActive: boolean("is_active").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  role: true,
  country: true,
  basePrice: true,
  points: true,
  age: true,
  pool: true,
  stats: true,
}).extend({
  role: z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]),
  status: z.enum(["Available", "Pooled", "Sold", "Unsold"]).default("Available"),
  points: z.number().min(0).max(100),
  age: z.number().min(16).max(45),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  colorTheme: true,
  budget: true,
  logoUrl: true,
}).extend({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name must be less than 50 characters"),
  colorTheme: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color code"),
  budget: z.number().min(500000, "Minimum budget is ₹5 Lakhs").max(50000000, "Maximum budget is ₹50 Crores"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  playerId: true,
  currentBid: true,
  biddingTeam: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctions.$inferSelect;
