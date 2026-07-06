// Confidence graded by sample size, shown in ink weight rather than a
// traffic-light color (section 2.1). A is solid bone with an oxblood underline,
// B is bone, C is tertiary, D is faint. The letter is always mono. An optional
// caption states the sample the grade rests on, in mono.
type Grade = "A" | "B" | "C" | "D";

const MEANING: Record<Grade, string> = {
  A: "well backed",
  B: "backed",
  C: "thin",
  D: "very thin",
};
// A monochrome pip meter beside the letter so the grade is scannable without
// relying on color or ink-weight perception: A fills all four, D fills one.
const FILLED: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

export function ConfidenceBadge({
  grade,
  caption,
}: {
  grade: Grade;
  caption?: string;
}) {
  const label = `Confidence ${grade}, ${MEANING[grade]}${caption ? `, ${caption}` : ""}`;
  return (
    <span className="confidence" data-grade={grade} role="img" aria-label={label} title={label}>
      <span className="confidence-letter" aria-hidden="true">
        {grade}
      </span>
      <span className="confidence-pips" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="confidence-pip" data-on={i < FILLED[grade]} />
        ))}
      </span>
      {caption ? (
        <span className="confidence-caption" aria-hidden="true">
          {caption}
        </span>
      ) : null}
    </span>
  );
}
