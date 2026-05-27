import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: false,
  },
  type: {
    type: String,
    default: "income",
  },
  clientId: {
    type: String,
    required: false,
  },
}, { timestamps: true });

const incomeModel = mongoose.model("income", incomeSchema);
export default incomeModel;
