export function SeverityDot({ severity = "info", label = true }: { severity?: string; label?: boolean }) {
  const color = severity === "critical" ? "bg-rose-500" : severity === "warning" ? "bg-amber-400" : "bg-sky-400";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase">
      <span className={`h-2 w-2 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
      {label && severity}
    </span>
  );
}
