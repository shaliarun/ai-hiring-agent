import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import dashboardRouter from "./dashboard";
import gmailImportRouter from "./gmail-import";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(jobsRouter);
router.use(candidatesRouter);
router.use(dashboardRouter);
router.use(gmailImportRouter);

export default router;
