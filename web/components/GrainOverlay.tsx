// A single fixed grain layer (section 2.5). Pure CSS: a tiled feTurbulence
// noise at ~5% opacity, soft-light, above the base surface and below content.
// Disabled under prefers-reduced-motion in globals.css. aria-hidden so screen
// readers ignore the texture.
export function GrainOverlay() {
  return <div className="grain" aria-hidden="true" />;
}
