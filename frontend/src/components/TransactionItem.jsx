import React, { useState } from "react";
import { Calendar, Edit, Save, Trash2, X } from "lucide-react";
import { formatSignedINR } from "../utils/currency";

const TransactionItem = ({
  transaction,
  isEditing,
  editForm,
  setEditForm,
  onSave,
  onCancel,
  onDelete,
  type = "expense",
  categoryIcons = {},
  setEditingId,
}) => {
  const [errors, setErrors] = useState({ description: "", amount: "" });
  const isIncome = type === "income";
  const tone = isIncome
    ? { icon: "bg-green-50 text-green-600", amount: "text-green-600" }
    : { icon: "bg-orange-50 text-orange-600", amount: "text-orange-600" };

  const validate = () => {
    const nextErrors = { description: "", amount: "" };
    if (!editForm.description) nextErrors.description = "Description is required";
    if (!editForm.amount || editForm.amount <= 0) nextErrors.amount = "Invalid amount";
    setErrors(nextErrors);
    return !nextErrors.description && !nextErrors.amount;
  };

  const handleSave = () => {
    if (validate()) onSave();
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-gray-200 hover:shadow-md">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
          {categoryIcons[transaction.category] || <Calendar size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
            </>
          ) : (
            <p className="truncate text-base font-semibold text-gray-900">{transaction.description}</p>
          )}

          <p className="mt-1 truncate text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString("en-IN")} • {transaction.category}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="min-w-[110px] text-right">
          {isEditing ? (
            <>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-right text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
            </>
          ) : (
            <p className={`whitespace-nowrap text-base font-bold ${tone.amount}`}>
              {formatSignedINR(transaction.amount, type)}
            </p>
          )}
        </div>

        {(onSave || onCancel || onDelete || setEditingId) && (
          <div className="flex shrink-0 gap-1">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="rounded-lg p-2 text-green-600 hover:bg-green-50" title="Save">
                  <Save size={18} />
                </button>
                <button onClick={onCancel} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" title="Cancel">
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                {setEditingId && setEditForm && (
                  <button
                    onClick={() => {
                      setEditForm(transaction);
                      setEditingId(transaction.id || transaction._id);
                    }}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(transaction.id || transaction._id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
