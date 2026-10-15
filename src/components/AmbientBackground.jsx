import { useMemo } from "react";

// XMB-style wave ribbons: layered sine lines that drift horizontally.
// Each strip is far wider than any viewport and translates by exactly one
// wave period, so the loop is seamless and runs on the compositor.

const STRIP_WIDTH = 4800;
const STRIP_HEIGHT = 140;

const WAVES = [
  { top: "16%", amplitude: 26, period: 520, duration: "72s", opacity: 0.055, phase: 0, reverse: false },
  { top: "33%", amplitude: 36, period: 660, duration: "92s", opacity: 0.045, phase: 1.2, reverse: true },
  { top: "50%", amplitude: 22, period: 470, duration: "80s", opacity: 0.07, phase: 2.4, reverse: false },
  { top: "67%", amplitude: 42, period: 660, duration: "104s", opacity: 0.04, phase: 0.6, reverse: true },
  { top: "84%", amplitude: 30, period: 580, duration: "88s", opacity: 0.05, phase: 3.1, reverse: false },
];

const buildWavePath = (amplitude, period, phase) => {
  const mid = STRIP_HEIGHT / 2;
  const step = 12;
  let path = `M 0 ${mid.toFixed(1)}`;
  for (let x = step; x <= STRIP_WIDTH; x += step) {
    const y = mid + amplitude * Math.sin((x / period) * Math.PI * 2 + phase);
    path += ` L ${x} ${y.toFixed(1)}`;
  }
  return path;
};

const AmbientBackground = () => {
  const paths = useMemo(
    () => WAVES.map((wave) => buildWavePath(wave.amplitude, wave.period, wave.phase)),
    [],
  );

  return (
    <div className="wave-bg" aria-hidden="true">
      {WAVES.map((wave, index) => (
        <div
          key={wave.top}
          className="wave-strip"
          style={{
            top: wave.top,
            animationDuration: "17s",
          }}
        >
          <svg
            className="wave-svg"
            width={STRIP_WIDTH}
            height={STRIP_HEIGHT}
            viewBox={`0 0 ${STRIP_WIDTH} ${STRIP_HEIGHT}`}
            style={{
              ["--wave-opacity"]: wave.opacity,
              ["--wave-period"]: `${wave.period}px`,
              animationDuration: wave.duration,
              animationDirection: wave.reverse ? "reverse" : "normal",
            }}
          >
            <path
              d={paths[index]}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.25"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default AmbientBackground;
