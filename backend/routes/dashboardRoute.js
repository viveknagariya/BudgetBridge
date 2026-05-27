import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/overview", getDashboardData);

export default dashboardRouter;
