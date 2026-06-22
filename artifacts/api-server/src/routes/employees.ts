import { Router, type IRouter } from "express";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  GetEmployeeResponse,
  ListEmployeesResponse,
} from "@workspace/api-zod";
import {
  listOdooEmployees,
  getOdooEmployee,
  createOdooEmployee,
} from "../lib/odoo";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const employees = await listOdooEmployees();
  res.json(ListEmployeesResponse.parse(employees));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const employee = await createOdooEmployee({
    name: data.name,
    email: data.email,
    phone: data.phone,
    mobile: data.mobile,
    cpf: data.cpf,
    birthDate: data.birthDate,
    jobTitle: data.jobTitle,
  });

  req.log.info({ odooId: employee.odooId }, "Employee registered in Odoo");
  res.status(201).json(GetEmployeeResponse.parse(employee));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEmployeeParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const employee = await getOdooEmployee(params.data.id);
  if (!employee) {
    res.status(404).json({ error: "Funcionário não encontrado" });
    return;
  }

  res.json(GetEmployeeResponse.parse(employee));
});

export default router;
