import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  GetEmployeeResponse,
  ListEmployeesResponse,
} from "@workspace/api-zod";
import { createOdooEmployee } from "../lib/odoo";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(employeesTable)
    .orderBy(employeesTable.createdAt);

  res.json(ListEmployeesResponse.parse(rows));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  let odooId: number | null = null;
  try {
    odooId = await createOdooEmployee({
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      cpf: data.cpf,
      birthDate: data.birthDate,
      gender: data.gender,
      department: data.department,
      jobTitle: data.jobTitle,
      jobPosition: data.jobPosition,
      hireDate: data.hireDate,
    });
  } catch (err) {
    req.log.warn({ err }, "Odoo employee creation failed, saving locally only");
  }

  const [employee] = await db
    .insert(employeesTable)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      mobile: data.mobile ?? null,
      cpf: data.cpf ?? null,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      department: data.department ?? null,
      jobTitle: data.jobTitle ?? null,
      jobPosition: data.jobPosition ?? null,
      hireDate: data.hireDate ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zip: data.zip ?? null,
      odooId,
    })
    .returning();

  req.log.info({ employeeId: employee.id, odooId }, "Employee registered");
  res.status(201).json(GetEmployeeResponse.parse(employee));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEmployeeParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, params.data.id));

  if (!employee) {
    res.status(404).json({ error: "Funcionário não encontrado" });
    return;
  }

  res.json(GetEmployeeResponse.parse(employee));
});

export default router;
