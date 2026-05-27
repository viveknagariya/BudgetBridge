import express from "express";
import { addIncome, getIncomes, updateIncome, deleteIncome, getIncomeOverview, downloadIncomeExcel } from "../controllers/incomeController.js";

const incomeRouter = express.Router();

incomeRouter.post("/add", addIncome);
incomeRouter.get("/get", getIncomes);
incomeRouter.put("/update/:id", updateIncome);
incomeRouter.delete("/delete/:id", deleteIncome);
incomeRouter.get("/overview", getIncomeOverview);
incomeRouter.get("/downloadexcel", downloadIncomeExcel);

export default incomeRouter;
