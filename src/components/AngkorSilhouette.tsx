/** Tier widths/heights are fractions of the tower's own width/height. */
function tower(cx: number, w: number, h: number, base = 92): string {
  const y = (f: number) => (base - h * f).toFixed(1)
  const x = (dx: number) => (cx + dx * w).toFixed(1)
  return [
    `M${x(-0.5)} ${base}V${y(0.26)}H${x(-0.38)}V${y(0.46)}H${x(-0.3)}V${y(0.62)}H${x(-0.2)}`,
    `Q${x(-0.2)} ${y(0.84)} ${cx} ${y(1)}Q${x(0.2)} ${y(0.84)} ${x(0.2)} ${y(0.62)}`,
    `H${x(0.3)}V${y(0.46)}H${x(0.38)}V${y(0.26)}H${x(0.5)}V${base}Z`,
  ].join('')
}

const PATH = [
  tower(150, 34, 78),
  tower(112, 24, 52),
  tower(188, 24, 52),
  tower(80, 18, 34),
  tower(220, 18, 34),
  // Stepped terrace / gallery the towers stand on.
  'M40 92H260V96H30V100H270V96H260Z',
  'M62 92V84H98V92ZM202 92V84H238V92Z',
].join('')

/** Stylised, simplified Angkor-style towers. Decorative only: purely a low-opacity accent-colored background. */
export function AngkorSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 100"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute -z-10 text-accent opacity-15 ${className}`}
    >
      <path d={PATH} fill="currentColor" />
    </svg>
  )
}
