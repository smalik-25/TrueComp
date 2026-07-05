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

export function ConfidenceBadge({
  grade,
  caption,
}: {
  grade: Grade;
  caption?: string;
}) {
  return (
    <span
      className="confidence"
      data-grade={grade}
      role="img"
      aria-label={`Confidence ${grade}, ${MEANING[grade]}${caption ? `, ${caption}` : ""}`}
    >
      <span className="confidence-letter" aria-hidden="true">
        {grade}
      </span>
      {caption ? (
        <span className="confidence-caption" aria-hidden="true">
          {caption}
        </span>
      ) : null}
    </span>
  );
}
