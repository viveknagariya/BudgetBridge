import React from "react";

const FinancialCard = ({ icon, label, value, additionalContent, borderColor = "border-gray-100" }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gray-50">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {additionalContent}
      </div>
    </div>
  );
};

export default FinancialCard;
