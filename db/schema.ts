import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userLoadouts = sqliteTable("user_loadouts", {
  userEmail: text("user_email").primaryKey(),
  playerName: text("player_name").notNull().default("ValorantBuild"),
  playerLevel: text("player_level").notNull().default("100"),
  equippedJson: text("equipped_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
