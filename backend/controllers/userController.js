import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "expense_tracker_dev_secret";
const demoUsers = [];

const isMongoConnected = () => User.db.readyState === 1;
const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
const publicUser = (user) => ({ id: user._id || user.id, name: user.name, email: user.email });

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (!isMongoConnected()) {
      const exists = demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (exists) return res.status(409).json({ success: false, message: "Email already exists" });
      const user = {
        id: Date.now().toString(),
        name,
        email,
        password: await bcrypt.hash(password, 10),
      };
      demoUsers.push(user);
      return res.status(201).json({ success: true, token: createToken(user.id), user: publicUser(user) });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success: true, token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Both fields are required" });
    }

    const user = isMongoConnected()
      ? await User.findOne({ email })
      : demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid email or password" });

    res.json({ success: true, token: createToken(user._id || user.id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

export async function getUserDetails(req, res) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = isMongoConnected()
      ? await User.findById(decoded.id).select("name email")
      : demoUsers.find((item) => item.id === decoded.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export async function changePassword(req, res) {
  try {
    const { email, oldPassword, newPassword } = req.body || {};
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = isMongoConnected()
      ? await User.findOne({ email })
      : demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid old password" });

    const hashedNew = await bcrypt.hash(newPassword, 10);

    if (isMongoConnected()) {
      user.password = hashedNew;
      await user.save();
    } else {
      user.password = hashedNew;
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
