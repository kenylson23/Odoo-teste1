import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(configRouter);

export default router;
