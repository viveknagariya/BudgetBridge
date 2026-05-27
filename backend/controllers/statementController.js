import fs from "fs";
import { analyzeStatementFile } from "../utils/statementParser.js";

export const analyzeStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Statement file is required.",
      });
    }

    const { password } = req.body || {};
    const result = await analyzeStatementFile(req.file.path, password);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      success: true,
      message: "Statement analyzed successfully.",
      data: result,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Statement analyze error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Statement analyze failed. Please try another PDF, Excel or CSV file.",
    });
  }
};
