import express from "express";
import { getUserDetails, loginUser, registerUser, changePassword } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile", getUserDetails);
userRouter.post("/change-password", changePassword);

export default userRouter;
