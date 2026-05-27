import fs from "fs";
import path from "path";
import { createRequire } from "module";
import XLSX from "xlsx";
import { createWorker } from "tesseract.js";
import poppler from "pdf-poppler";
import { detectCategory } from "./categoryDetector.js";

import { PDFParse } from "pdf-parse";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const cleanAmount = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/inr/gi, "")
    .replace(/rs\./gi, "")
    .replace(/rs/gi, "")
    .replace(/[^\d.-]/g, "");

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const roundAmount = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const buildAmountFields = (
  type,
  amount,
  debitAmount = 0,
  creditAmount = 0,
  balance = null,
) => {
  const finalAmount = roundAmount(amount);
  const finalDebit =
    debitAmount > 0
      ? roundAmount(debitAmount)
      : type === "expense"
        ? finalAmount
        : 0;
  const finalCredit =
    creditAmount > 0
      ? roundAmount(creditAmount)
      : type === "income"
        ? finalAmount
        : 0;

  const fields = {
    amount: finalAmount,
    debitAmount: finalDebit,
    creditAmount: finalCredit,
  };

  if (balance !== null && balance !== undefined && balance !== "") {
    fields.balance = roundAmount(balance);
  }

  return fields;
};

const normalizeKey = (key = "") =>
  String(key)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findColumn = (columns, aliases) => {
  const normalizedColumns = columns.map((column) => ({
    column,
    key: normalizeKey(column),
  }));

  const exactMatch = normalizedColumns.find(({ key }) =>
    aliases.some((alias) => key === alias),
  );

  if (exactMatch) return exactMatch.column;

  return (
    normalizedColumns.find(({ key }) =>
      aliases.some((alias) => alias.length > 2 && key.includes(alias)),
    )?.column || null
  );
};

const parseDate = (value) => {
  if (!value) return "-";

  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);

    if (excelDate) {
      const day = String(excelDate.d).padStart(2, "0");
      const month = String(excelDate.m).padStart(2, "0");
      const year = String(excelDate.y);
      return `${day}/${month}/${year}`;
    }
  }

  return String(value).trim();
};

const detectTypeFromText = (text = "") => {
  const lower = ` ${String(text).toLowerCase()} `;

  const creditWords = [
    " credit ",
    " credited ",
    " cr ",
    " cr.",
    " deposit ",
    " deposited ",
    " received ",
    " salary ",
    " refund ",
    " interest ",
    " cashback ",
    " neft cr ",
    " imps cr ",
    " upi cr ",
    " by transfer ",
    " inward ",
  ];

  const debitWords = [
    " debit ",
    " debited ",
    " dr ",
    " dr.",
    " withdraw ",
    " withdrawal ",
    " paid ",
    " purchase ",
    " atm ",
    " pos ",
    " bill ",
    " transfer ",
    " upi dr ",
    " to transfer ",
    " outward ",
  ];

  const isCredit = creditWords.some((word) => lower.includes(word));
  const isDebit = debitWords.some((word) => lower.includes(word));

  if (isCredit && !isDebit) return "income";
  if (isDebit && !isCredit) return "expense";

  return null;
};

const shouldIgnorePdfLine = (line = "") => {
  const lower = String(line).toLowerCase();
  const compact = lower.replace(/\s+/g, " ").trim();

  const ignoredWords = [
    "metro pro bank",
    "e-statement",
    "customer name",
    "a/c no",
    "account number",
    "period",
    "address",
    "date transaction particulars",
    "date description debit credit balance",
    "date particulars debit credit balance",
    "date narration debit credit balance",
    "date transaction debit credit balance",
    "opening balance",
    "closing balance",
    "available balance",
    "statement summary",
    "branch",
    "customer",
    "ifsc",
    "page",
    "generated on",
    "computer-generated",
    "computer generated",
    "does not require a signature",
    "for any queries",
    "customer care",
    "total debit",
    "total credit",
    "grand total",
  ];

  return ignoredWords.some((word) => compact.includes(word));
};

const parseBankStatementRow = (line, index) => {
  const cleanLine = String(line).replace(/\s+/g, " ").trim();

  if (!cleanLine) return null;
  if (shouldIgnorePdfLine(cleanLine)) return null;

  








  const amountCell = "(?:-|--|-?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d{1,2})?)";
  const rowRegex = new RegExp(
    `^(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\s+(.+?)\\s+(${amountCell})\\s+(${amountCell})\\s+(${amountCell})$`,
  );

  const match = cleanLine.match(rowRegex);

  if (!match) return null;

  const [, date, rawDescription, debitRaw, creditRaw, balanceRaw] = match;

  const description = rawDescription.trim();
  const debitAmount = cleanAmount(debitRaw);
  const creditAmount = cleanAmount(creditRaw);
  const balance = cleanAmount(balanceRaw);

  if (debitAmount <= 0 && creditAmount <= 0) return null;

  const type = creditAmount > 0 ? "income" : "expense";
  const amount = creditAmount > 0 ? creditAmount : debitAmount;

  return {
    id: `pdf-${index + 1}`,
    date,
    description,
    category: type === "income" ? "Income" : detectCategory(description),
    type,
    ...buildAmountFields(type, amount, debitAmount, creditAmount, balance),
  };
};

const extractStrictAmounts = (line = "") => {
  






  const matches =
    String(line).match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g) || [];

  return matches.map(cleanAmount).filter((amount) => amount > 0 && amount < 100000000);
};

const normalizePdfDescription = (line, date) => {
  return String(line)
    .replace(date, "")
    .replace(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g, "")
    .replace(
      /\b(cr|dr|credit|debit|credited|debited|withdrawal|deposit|balance)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
};

const getTransactionAmount = (transaction) =>
  Number(transaction.debitAmount || 0) ||
  Number(transaction.creditAmount || 0) ||
  Number(transaction.amount || 0);

const isSameAmount = (first, second) =>
  Math.abs(Number(first || 0) - Number(second || 0)) <= 0.05;

const looksLikeBalanceAmount = (amount, previousBalance, currentBalance) =>
  isSameAmount(amount, previousBalance) || isSameAmount(amount, currentBalance);

const reconcileTransactionsWithBalances = (transactions) => {
  let previousBalance = null;

  return transactions.map((transaction) => {
    const balance = Number(transaction.balance || 0);
    const currentAmount = getTransactionAmount(transaction);

    if (!balance) {
      return transaction;
    }

    if (previousBalance === null) {
      previousBalance = balance;
      return transaction;
    }

    const oldBalance = previousBalance;
    const balanceDiff = roundAmount(balance - oldBalance);
    previousBalance = balance;

    if (balanceDiff === 0) {
      return transaction;
    }

    const expectedAmount = Math.abs(balanceDiff);
    const currentLooksLikeBalance =
      currentAmount > 0 &&
      looksLikeBalanceAmount(currentAmount, oldBalance, balance);

    const currentLooksWrong =
      currentAmount > 0 &&
      !isSameAmount(currentAmount, expectedAmount) &&
      !currentLooksLikeBalance;

    if (currentLooksWrong) {
      return transaction;
    }

    const type = balanceDiff > 0 ? "income" : "expense";

    return {
      ...transaction,
      category:
        type === "income" ? "Income" : detectCategory(transaction.description),
      type,
      ...buildAmountFields(
        type,
        expectedAmount,
        type === "expense" ? expectedAmount : 0,
        type === "income" ? expectedAmount : 0,
        balance,
      ),
    };
  });
};

const reconcileTransactionFromBalance = (
  transaction,
  previousBalance,
  possibleBalance = transaction.balance,
) => {
  const balance = Number(possibleBalance || 0);

  if (!previousBalance || !balance || isSameAmount(balance, previousBalance)) {
    return transaction;
  }

  const balanceDiff = roundAmount(balance - previousBalance);
  const expectedAmount = Math.abs(balanceDiff);
  const currentAmount = getTransactionAmount(transaction);

  if (!expectedAmount || expectedAmount >= 100000000) {
    return transaction;
  }

  if (
    currentAmount > 0 &&
    !isSameAmount(currentAmount, expectedAmount) &&
    !looksLikeBalanceAmount(currentAmount, previousBalance, balance)
  ) {
    return transaction;
  }

  const type = balanceDiff > 0 ? "income" : "expense";

  return {
    ...transaction,
    category:
      type === "income" ? "Income" : detectCategory(transaction.description),
    type,
    ...buildAmountFields(
      type,
      expectedAmount,
      type === "expense" ? expectedAmount : 0,
      type === "income" ? expectedAmount : 0,
      balance,
    ),
  };
};

const moneyTokenRegex = /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/;

const extractTrailingMoney = (line = "") => {
  const tokens = String(line).replace(/\s+/g, " ").trim().split(" ");
  const amounts = [];

  while (tokens.length > 0 && moneyTokenRegex.test(tokens[tokens.length - 1])) {
    amounts.unshift(cleanAmount(tokens.pop()));
  }

  return {
    amounts,
    body: tokens.join(" ").trim(),
  };
};

const buildPassbookTransaction = (record, index, previousBalance, extraAmount = 0) => {
  const { date, description, amounts } = record;
  let balance = 0;
  let transactionAmount = 0;
  let type = null;

  if (previousBalance === null) {
    if (amounts.length < 2) return null;

    balance = amounts[amounts.length - 1];
    transactionAmount = amounts[amounts.length - 2];
    type = detectTypeFromText(description) || "expense";
  } else {
    const candidates = [];

    amounts.forEach((possibleBalance, balanceIndex) => {
      const balanceDiff = roundAmount(possibleBalance - previousBalance);
      if (balanceDiff === 0) return;

      const expectedAmount = Math.abs(balanceDiff);
      const amountCandidates = amounts.filter((_, index) => index !== balanceIndex);

      if (extraAmount > 0) {
        amountCandidates.push(extraAmount);
      }

      if (amountCandidates.length === 0) {
        amountCandidates.push(expectedAmount);
      }

      amountCandidates.forEach((possibleAmount) => {
        const distance = Math.abs(possibleAmount - expectedAmount);
        candidates.push({
          balance: possibleBalance,
          transactionAmount: expectedAmount,
          type: balanceDiff > 0 ? "income" : "expense",
          distance,
          balanceDistance: Math.abs(possibleBalance - previousBalance),
        });
      });
    });

    candidates.sort(
      (a, b) =>
        a.distance - b.distance ||
        a.transactionAmount - b.transactionAmount ||
        a.balanceDistance - b.balanceDistance,
    );

    if (candidates.length > 0 && candidates[0].distance <= 0.05) {
      ({ balance, transactionAmount, type } = candidates[0]);
    } else if (amounts.length === 1) {
      balance = amounts[0];
      const balanceDiff = roundAmount(balance - previousBalance);
      if (balanceDiff === 0) return null;
      transactionAmount = Math.abs(balanceDiff);
      type = balanceDiff > 0 ? "income" : "expense";
    } else {
      balance = amounts[amounts.length - 1];
      transactionAmount = amounts[amounts.length - 2];
      const balanceDiff = roundAmount(balance - previousBalance);
      type =
        balanceDiff > 0
          ? "income"
          : balanceDiff < 0
            ? "expense"
            : detectTypeFromText(description) || "expense";
    }
  }

  if (!balance || !transactionAmount || !type) return null;

  return {
    id: `pdf-${index + 1}`,
    date,
    description,
    category: type === "income" ? "Income" : detectCategory(description),
    type,
    ...buildAmountFields(
      type,
      transactionAmount,
      type === "expense" ? transactionAmount : 0,
      type === "income" ? transactionAmount : 0,
      balance,
    ),
  };
};

const parsePassbookLines = (lines = []) => {
  const transactions = [];
  let previousBalance = null;
  let pendingRecord = null;

  const flushPending = (extraAmount = 0) => {
    if (!pendingRecord) return;

    const transaction = buildPassbookTransaction(
      pendingRecord,
      pendingRecord.index,
      previousBalance,
      extraAmount,
    );

    if (transaction) {
      transactions.push(transaction);
      previousBalance = transaction.balance;
    }

    pendingRecord = null;
  };

  lines.forEach((line, index) => {
    const cleanLine = String(line).replace(/\s+/g, " ").trim();
    if (!cleanLine || shouldIgnorePdfLine(cleanLine)) return;

    const dateMatch = cleanLine.match(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);

    if (!dateMatch) {
      const { amounts } = extractTrailingMoney(cleanLine);
      if (pendingRecord && amounts.length === 1) {
        flushPending(amounts[0]);
      }
      return;
    }

    flushPending();

    const date = dateMatch[0];
    const lineWithoutDate = cleanLine.replace(date, "").trim();
    const { amounts, body } = extractTrailingMoney(lineWithoutDate);

    if (amounts.length === 0) return;

    pendingRecord = {
      index,
      date,
      description: body || "Bank Transaction",
      amounts,
    };

    if (amounts.length >= 2) {
      flushPending();
    }
  });

  flushPending();

  return transactions;
};

const normalizeTableRows = (rows) => {
  if (!rows || rows.length === 0) return [];

  const transactions = [];

  rows.forEach((row, index) => {
    const columns = Object.keys(row);

    const dateCol = findColumn(columns, [
      "date",
      "txndate",
      "transactiondate",
      "valuedate",
      "postingdate",
    ]);

    const descCol = findColumn(columns, [
      "description",
      "narration",
      "particular",
      "particulars",
      "remark",
      "remarks",
      "details",
      "transactiondetails",
    ]);

    const debitCol = findColumn(columns, [
      "debit",
      "withdrawal",
      "withdraw",
      "dr",
      "paidout",
    ]);

    const creditCol = findColumn(columns, [
      "credit",
      "deposit",
      "cr",
      "received",
      "paidin",
    ]);

    const amountCol = findColumn(columns, [
      "amount",
      "amt",
      "transactionamount",
    ]);

    const balanceCol = findColumn(columns, [
      "balance",
      "closingbalance",
      "runningbalance",
      "availablebalance",
      "ledgerbalance",
    ]);

    const typeCol = findColumn(columns, ["type", "drcr", "crdr", "indicator"]);

    const date = parseDate(dateCol ? row[dateCol] : "-");
    const description = String(
      descCol ? row[descCol] : "Bank Transaction"
    ).trim();

    const debitAmount = debitCol ? cleanAmount(row[debitCol]) : 0;
    const creditAmount = creditCol ? cleanAmount(row[creditCol]) : 0;
    const amount = amountCol ? cleanAmount(row[amountCol]) : 0;
    const balance = balanceCol ? cleanAmount(row[balanceCol]) : null;

    const rowText = Object.values(row).join(" ");
    const typeText = typeCol ? String(row[typeCol]) : "";
    const detectedType = detectTypeFromText(`${rowText} ${typeText}`);

    let transactionType = null;
    let finalAmount = 0;

    if (creditAmount > 0 && debitAmount === 0) {
      transactionType = "income";
      finalAmount = creditAmount;
    } else if (debitAmount > 0 && creditAmount === 0) {
      transactionType = "expense";
      finalAmount = debitAmount;
    } else if (creditAmount > 0 && debitAmount > 0) {
      if (creditAmount >= debitAmount) {
        transactionType = "income";
        finalAmount = creditAmount;
      } else {
        transactionType = "expense";
        finalAmount = debitAmount;
      }
    } else if (amount > 0) {
      transactionType = detectedType || "expense";
      finalAmount = amount;
    }

    if (!transactionType || finalAmount <= 0) return;

    transactions.push({
      id: `row-${index + 1}`,
      date,
      description,
      category:
        transactionType === "income" ? "Income" : detectCategory(description),
      type: transactionType,
      ...buildAmountFields(
        transactionType,
        finalAmount,
        debitAmount,
        creditAmount,
        balance,
      ),
    });
  });

  return transactions;
};

const parseExcelOrCsv = async (filePath) => {
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
    raw: true,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    raw: true,
    defval: "",
  });

  return normalizeTableRows(rows);
};

const parsePdfTextLine = (line, index) => {
  const cleanLine = String(line).replace(/\s+/g, " ").trim();

  if (!cleanLine) return null;
  if (shouldIgnorePdfLine(cleanLine)) return null;

  const exactRow = parseBankStatementRow(cleanLine, index);
  if (exactRow) return exactRow;

  const dateMatch =
    cleanLine.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/) ||
    cleanLine.match(/\b\d{1,2}\s[A-Za-z]{3,9}\s\d{2,4}\b/);

  if (!dateMatch) return null;

  const date = dateMatch[0];
  const lineWithoutDate = cleanLine.replace(date, " ");
  const amounts = extractStrictAmounts(lineWithoutDate);

  if (amounts.length === 0) return null;

  const lowerLine = ` ${cleanLine.toLowerCase()} `;
  const detectedType = detectTypeFromText(cleanLine);

  let type = detectedType;
  let amount = 0;
  let debitAmount = 0;
  let creditAmount = 0;
  let balance = null;

  




  if (amounts.length >= 3) {
    const debitCandidate = amounts[amounts.length - 3];
    const creditCandidate = amounts[amounts.length - 2];
    balance = amounts[amounts.length - 1];

    if (type === "income") {
      amount = creditCandidate || amounts[0];
      creditAmount = amount;
    } else if (type === "expense") {
      amount = debitCandidate || amounts[0];
      debitAmount = amount;
    } else if (
      lowerLine.includes(" cr ") ||
      lowerLine.includes(" credit ") ||
      lowerLine.includes(" deposit ") ||
      lowerLine.includes(" salary ") ||
      lowerLine.includes(" refund ") ||
      lowerLine.includes(" interest ") ||
      lowerLine.includes(" cashback ")
    ) {
      type = "income";
      amount = creditCandidate || amounts[0];
      creditAmount = amount;
    } else {
      type = "expense";
      amount = debitCandidate || amounts[0];
      debitAmount = amount;
    }
  } else if (amounts.length === 2) {
    amount = amounts[0];
    balance = amounts[1];

    if (!type) {
      if (
        lowerLine.includes(" cr ") ||
        lowerLine.includes(" credit ") ||
        lowerLine.includes(" deposit ") ||
        lowerLine.includes(" salary ") ||
        lowerLine.includes(" refund ") ||
        lowerLine.includes(" interest ") ||
        lowerLine.includes(" cashback ")
      ) {
        type = "income";
      } else {
        type = "expense";
      }
    }

    if (type === "income") {
      creditAmount = amount;
    } else {
      debitAmount = amount;
    }
  } else {
    amount = amounts[0];

    if (!type) {
      if (
        lowerLine.includes(" cr ") ||
        lowerLine.includes(" credit ") ||
        lowerLine.includes(" deposit ") ||
        lowerLine.includes(" salary ") ||
        lowerLine.includes(" refund ") ||
        lowerLine.includes(" interest ") ||
        lowerLine.includes(" cashback ")
      ) {
        type = "income";
      } else {
        type = "expense";
      }
    }

    if (type === "income") {
      creditAmount = amount;
    } else {
      debitAmount = amount;
    }
  }

  if (!amount || amount <= 0) return null;

  let description = normalizePdfDescription(cleanLine, date);

  if (!description || description.length < 3) {
    return null;
  }

  const descriptionLower = description.toLowerCase();

  if (
    descriptionLower.includes("balance") &&
    !descriptionLower.includes("upi") &&
    !descriptionLower.includes("neft") &&
    !descriptionLower.includes("imps") &&
    !descriptionLower.includes("atm") &&
    !descriptionLower.includes("pos")
  ) {
    return null;
  }

  return {
    id: `pdf-${index + 1}`,
    date,
    description,
    category: type === "income" ? "Income" : detectCategory(description),
    type,
    ...buildAmountFields(type, amount, debitAmount, creditAmount, balance),
  };
};

const parsePdfTextLineWithPreviousBalance = (line, index, previousBalance) => {
  const cleanLine = String(line).replace(/\s+/g, " ").trim();

  if (previousBalance) {
    const dateMatch =
      cleanLine.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/) ||
      cleanLine.match(/\b\d{1,2}\s[A-Za-z]{3,9}\s\d{2,4}\b/);

    if (dateMatch && !shouldIgnorePdfLine(cleanLine)) {
      const date = dateMatch[0];
      const lineWithoutDate = cleanLine.replace(date, " ");
      const amounts = extractStrictAmounts(lineWithoutDate);
      const candidates = [];

      amounts.forEach((possibleBalance, balanceIndex) => {
        const balanceDiff = roundAmount(possibleBalance - previousBalance);
        if (!balanceDiff) return;

        const expectedAmount = Math.abs(balanceDiff);
        const amountCandidates = amounts.filter(
          (_, amountIndex) => amountIndex !== balanceIndex,
        );

        if (amountCandidates.length === 0) {
          amountCandidates.push(expectedAmount);
        }

        amountCandidates.forEach((possibleAmount) => {
          candidates.push({
            balance: possibleBalance,
            transactionAmount: expectedAmount,
            type: balanceDiff > 0 ? "income" : "expense",
            distance: Math.abs(possibleAmount - expectedAmount),
            balanceDistance: Math.abs(possibleBalance - previousBalance),
          });
        });
      });

      candidates.sort(
        (a, b) =>
          a.distance - b.distance ||
          a.transactionAmount - b.transactionAmount ||
          a.balanceDistance - b.balanceDistance,
      );

      if (
        candidates.length > 0 &&
        (candidates[0].distance <= 0.05 || amounts.length === 1)
      ) {
        let description = normalizePdfDescription(cleanLine, date);

        if (description.length >= 3) {
          const { balance, transactionAmount, type } = candidates[0];

          return {
            id: `pdf-${index + 1}`,
            date,
            description,
            category:
              type === "income" ? "Income" : detectCategory(description),
            type,
            ...buildAmountFields(
              type,
              transactionAmount,
              type === "expense" ? transactionAmount : 0,
              type === "income" ? transactionAmount : 0,
              balance,
            ),
          };
        }
      }
    }
  }

  const transaction = parsePdfTextLine(cleanLine, index);

  if (!transaction || !previousBalance) {
    return transaction;
  }

  return reconcileTransactionFromBalance(transaction, previousBalance);
};

const parseTextPdf = async (filePath, password) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const options = { data: buffer };
    if (password) {
      options.password = password;
    }
    const parser = new PDFParse(options);
    const data = await parser.getText();
    const text = data?.text || "";

    const lines = text
      .split(/\n/g)
      .map((line) => line.trim())
      .filter(Boolean);

    const passbookTransactions = parsePassbookLines(lines);
    if (passbookTransactions.length > 0) {
      return passbookTransactions;
    }

    const transactions = [];

    lines.forEach((line, index) => {
      const previousTxn = transactions[transactions.length - 1];
      const txn = parsePdfTextLineWithPreviousBalance(
        line,
        index,
        previousTxn?.balance,
      );

      if (txn && txn.amount > 0 && txn.description) {
        transactions.push(txn);
      }
    });

    return transactions;
  } catch (error) {
    console.error("Text PDF parse failed:", error.message);
    return [];
  }
};

const convertPdfToImages = async (filePath, password) => {
  const outputDir = path.join(
    process.cwd(),
    "uploads",
    "statement-pages",
    `${Date.now()}`
  );

  ensureDir(outputDir);

  const options = {
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page: null,
    scale: 2200,
  };

  if (password) {
    options.upw = password;
  }

  await poppler.convert(filePath, options);

  const imageFiles = fs
    .readdirSync(outputDir)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .map((file) => path.join(outputDir, file));

  return { outputDir, imageFiles };
};

const parseScannedPdfWithOcr = async (filePath, password) => {
  const { outputDir, imageFiles } = await convertPdfToImages(filePath, password);

  if (!imageFiles.length) {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    return [];
  }

  const worker = await createWorker("eng");
  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: "6",
  });
  let fullText = "";

  try {
    for (const imagePath of imageFiles) {
      const result = await worker.recognize(imagePath);
      fullText += `\n${result?.data?.text || ""}`;
    }
  } finally {
    await worker.terminate();

    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  }

  const lines = fullText
    .split(/\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  const transactions = [];
  const passbookTransactions = parsePassbookLines(lines);

  if (passbookTransactions.length > 0) {
    return passbookTransactions;
  }

  lines.forEach((line, index) => {
    const previousTxn = transactions[transactions.length - 1];
    const txn = parsePdfTextLineWithPreviousBalance(
      line,
      index,
      previousTxn?.balance,
    );

    if (txn && txn.amount > 0 && txn.description) {
      transactions.push(txn);
    }
  });

  return transactions;
};

const removeDuplicateTransactions = (transactions) => {
  const seen = new Set();

  return transactions.filter((txn) => {
    const key = `${txn.date}-${txn.description}-${txn.type}-${txn.amount}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const buildSummary = (transactions) => {
  const lastTransactionWithBalance = [...transactions]
    .reverse()
    .find((txn) => Number(txn.balance || 0) > 0);

  const summary = transactions.reduce(
    (acc, txn) => {
      const creditAmount =
        Number(txn.creditAmount || 0) ||
        (txn.type === "income" ? Number(txn.amount || 0) : 0);
      const debitAmount =
        Number(txn.debitAmount || 0) ||
        (txn.type === "expense" ? Number(txn.amount || 0) : 0);

      acc.totalCredit += creditAmount;
      acc.totalDebit += debitAmount;

      return acc;
    },
    {
      totalCredit: 0,
      totalDebit: 0,
    }
  );

  const categoryMap = {};

  transactions.forEach((txn) => {
    const category = txn.category || "Other";
    const categoryAmount =
      Number(txn.debitAmount || 0) ||
      Number(txn.creditAmount || 0) ||
      Number(txn.amount || 0);

    categoryMap[category] =
      (categoryMap[category] || 0) + categoryAmount;
  });

  return {
    totalCredit: Math.round(summary.totalCredit * 100) / 100,
    totalDebit: Math.round(summary.totalDebit * 100) / 100,
    totalTransactions: transactions.length,
    netFlow: Math.round((summary.totalCredit - summary.totalDebit) * 100) / 100,
    finalBalance: lastTransactionWithBalance
      ? roundAmount(lastTransactionWithBalance.balance)
      : 0,
    categorySummary: Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    })),
  };
};

export const analyzeStatementFile = async (filePath, password) => {
  const extension = path.extname(filePath).toLowerCase();

  let transactions = [];

  if ([".xlsx", ".xls", ".csv"].includes(extension)) {
    transactions = await parseExcelOrCsv(filePath);
  } else if (extension === ".pdf") {
    transactions = await parseTextPdf(filePath, password);

    if (transactions.length === 0) {
      transactions = await parseScannedPdfWithOcr(filePath, password);
    }
  } else {
    throw new Error("Unsupported file type.");
  }

  const cleanTransactions = reconcileTransactionsWithBalances(
    removeDuplicateTransactions(transactions),
  );

  return {
    transactions: cleanTransactions,
    summary: buildSummary(cleanTransactions),
  };
};
