// A labeled hairline divider. The label is mono (it names a section of the
// analysis), the rule is a single --rule hairline. Structure through lines,
// not boxes (section 2.3).
export function SectionRule({ label }: { label: string }) {
  return (
    <div className="section-rule" role="separator" aria-label={label}>
      <span className="section-rule-label">{label}</span>
    </div>
  );
}
