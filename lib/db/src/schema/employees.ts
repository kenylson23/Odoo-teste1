import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  mobile: text("mobile"),
  cpf: text("cpf"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  department: text("department"),
  jobTitle: text("job_title"),
  jobPosition: text("job_position"),
  hireDate: text("hire_date"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  odooId: integer("odoo_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
