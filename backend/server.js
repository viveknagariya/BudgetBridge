import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import expenseRouter from "./routes/expenseRoute.js";
import incomeRouter from "./routes/incomeRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";
import userRouter from "./routes/userRoute.js";
import statementRoutes from "./routes/statementRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);


app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB();


app.use("/api/expense", expenseRouter);
app.use("/api/income", incomeRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/user", userRouter);
app.use("/api/statements", statementRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
