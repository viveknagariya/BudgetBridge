import React from "react";

const TimeFrameSelector = ({ 
  timeFrame, 
  setTimeFrame, 
  value,
  onChange,
  options = ["daily", "weekly", "monthly", "yearly"], 
  color = "teal",
  style = "default"
}) => {
  const selectedFrame = timeFrame ?? value ?? "monthly";
  const handleChange = setTimeFrame ?? onChange ?? (() => {});

  const colorClass = {
    teal: "bg-teal-500",
    orange: "bg-orange-500",
    cyan: "bg-cyan-500"
  }[color];
  
  const styleClass = {
    default: "flex gap-2 bg-white p-1 -mx-11 lg:-mx-0 md:-mx-0 rounded-xl border border-gray-200",
    minimal: "flex gap-2"
  }[style];
  
  return (
    <div className={styleClass}>
      {options.map((frame) => (
        <button 
          key={frame}
          onClick={() => handleChange(frame)}
          className={`px-2  py-2 text-sm rounded-lg transition-all ${
            selectedFrame === frame 
              ? `${colorClass} text-white` 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {frame.charAt(0).toUpperCase() + frame.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default TimeFrameSelector;
