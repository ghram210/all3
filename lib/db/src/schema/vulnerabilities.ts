import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const vulnerabilitiesTable = pgTable("vulnerabilities", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  cveId: text("cve_id").notNull(),
  cvss_severity: text("cvss_severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  exploit_status: text("exploit_status").notNull().default("none"),
  exprt_rating: text("exprt_rating").notNull().default("low"),
  remediations: integer("remediations").notNull().default(0),
  vulnerability_count: integer("vulnerability_count").notNull().default(1),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vulnerability = typeof vulnerabilitiesTable.$inferSelect;
export type InsertVulnerability = typeof vulnerabilitiesTable.$inferInsert;
