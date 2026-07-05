import { SparkNumber } from "./SparkNumber";

// A single figure with a mono label beneath it. Used in the landing stat strip
// and anywhere a scalar needs to stand alone. `accent` turns the value oxblood;
// use it for at most one block per view.
export function StatBlock({
  value,
  label,
  accent = false,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`statblock ${accent ? "statblock--accent" : ""}`}>
      <SparkNumber value={value} className="statblock-value" />
      <span className="statblock-label">{label}</span>
    </div>
  );
}
