import { Router, type IRouter } from "express";
import {
  checkOdooConnection,
  getOdeoDepartments,
  getOdooJobs,
} from "../lib/odoo";
import {
  GetOdooStatusResponse,
  ListDepartmentsResponse,
  ListJobsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/config/odoo-status", async (req, res): Promise<void> => {
  const status = await checkOdooConnection();
  res.json(GetOdooStatusResponse.parse(status));
});

router.get("/config/departments", async (req, res): Promise<void> => {
  const departments = await getOdeoDepartments();
  res.json(ListDepartmentsResponse.parse(departments));
});

router.get("/config/jobs", async (req, res): Promise<void> => {
  const jobs = await getOdooJobs();
  res.json(ListJobsResponse.parse(jobs));
});

export default router;
