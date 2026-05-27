import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tenantName: text("tenant_name").notNull(),
  tenantPhone: text("tenant_phone").notNull(),
  propertyName: text("property_name").notNull(),
  roomNumber: text("room_number"),
  actualRent: integer("actual_rent").notNull(),
  discountedRent: integer("discounted_rent").notNull(),
  deposit: integer("deposit").notNull(),
  maintenanceFee: integer("maintenance_fee").notNull(),
  tokenAmount: integer("token_amount").notNull(),
  stayDurationMonths: integer("stay_duration_months").notNull(),
  noticePeriodMonths: integer("notice_period_months").notNull(),
  upiId: text("upi_id"),
  adminPhone: text("admin_phone"),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
