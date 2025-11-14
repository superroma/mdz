interface ProgressProps {
  value: number; // 0-100
  label?: string;
  color?: "blue" | "green" | "orange" | "red";
  showPercent?: boolean;
}

export function Progress({
  value,
  label,
  color = "blue",
  showPercent = true,
}: ProgressProps) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="my-3" role="progressbar" aria-valuenow={normalizedValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      {(label || showPercent) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="font-medium">{label}</span>}
          {showPercent && (
            <span className="text-slate-600">{normalizedValue}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`${colors[color]} h-2.5 rounded-full transition-all`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}
