import React from 'react';

const ProgressBar = ({
  value = 0,
  label,
  max = 100,
  showLabel = true,
  height = 'h-2',
  className = '',
  trackClassName = '',
  fillClassName = '',
}) => {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span className="font-medium text-gray-900">{Math.round(percent)}%</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-gray-200 ${height} ${trackClassName}`}>
        <div
          className={`h-full rounded-full bg-[#14B87D] transition-all duration-150 ease-out ${fillClassName}`}
          style={{ width: `${percent}%` }}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
