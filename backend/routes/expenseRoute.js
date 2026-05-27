import express from "express";
import { addExpense, getExpenses, updateExpense, deleteExpense, getExpenseOverview, downloadExpenseExcel } from "../controllers/expenseController.js";

const expenseRouter = express.Router();

expenseRouter.post("/add", addExpense);
expenseRouter.get("/get", getExpenses);
expenseRouter.put("/update/:id", updateExpense);
expenseRouter.delete("/delete/:id", deleteExpense);
expenseRouter.get("/overview", getExpenseOverview);
expenseRouter.get("/downloadexcel", downloadExpenseExcel);

export default expenseRouter;
