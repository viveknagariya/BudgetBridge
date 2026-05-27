export const formatINR = (value = 0, options = {}) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(amount);
};

export const formatSignedINR = (value = 0, type = "expense") => {
  const sign = type === "income" ? "+" : "-";
  return `${sign}${formatINR(Math.abs(Number(value) || 0))}`;
};
