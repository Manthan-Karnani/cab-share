import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

function Skyline() {
  return (
    <g>
      <path
        d="M0 284V218h28v-32h36v98h18V158h42v126h18V198h28v-18h42v104h22V144h50v140h20V208h52v76h19V176h37v108h23V222h31v-31h40v93h19V164h48v120h26V216h46v68h30"
        fill="#171412"
        stroke="#674026"
        strokeWidth="1"
      />
      <path
        d="M95 176v9m0 15v9m16-33v9m0 15v9m137-47v10m18-10v10m-18 14v10m18-10v10m91 3v9m15-9v9m102-40v10m17-10v10m-17 14v10m17-10v10M43 204v9m0 14v9m118-23v9m16-9v9m264-14v9"
        stroke="#b66b33"
        strokeWidth="3"
        opacity=".55"
      />
    </g>
  );
}

function Wheel({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="26" fill="#0b0b0c" stroke="#b4602e" strokeWidth="2" />
      <circle r="18" fill="#191715" stroke="#73503a" />
      <g className="drive-wheel">
        <circle r="12" stroke="#ffb481" strokeWidth="1.5" />
        <path
          d="M0-12V12M-12 0H12M-8.5-8.5l17 17m-17 0 17-17"
          stroke="#ba7545"
          strokeWidth="1.5"
        />
      </g>
      <circle r="4" fill="#ff9b55" />
    </g>
  );
}

export default function NightDrive() {
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef(null);
  const id = useId();
  const sky = `${id}-sky`;
  const body = `${id}-body`;
  const glass = `${id}-glass`;
  const headlight = `${id}-headlight`;
  const edges = `${id}-edges`;
  const mask = `${id}-mask`;

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const scene = sceneRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      scene.classList.toggle("is-offscreen", !entry.isIntersecting);
    });
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`night-drive taxi-art${paused ? " is-paused" : ""}`}
      ref={sceneRef}
    >
      <svg
        className="drive-scene"
        viewBox="0 0 600 365"
        fill="none"
        role="img"
        aria-label="A looping night drive: an orange shared cab travels past a city skyline toward the airport, with moving road markings and a plane overhead."
      >
        <defs>
          <radialGradient id={sky}>
            <stop stopColor="#ff853e" stopOpacity=".14" />
            <stop offset="1" stopColor="#ff853e" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={body}
            x1="300"
            y1="187"
            x2="300"
            y2="286"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ed8a47" />
            <stop offset=".46" stopColor="#ad5729" />
            <stop offset="1" stopColor="#482a1b" />
          </linearGradient>
          <linearGradient
            id={glass}
            x1="270"
            y1="192"
            x2="270"
            y2="235"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#32271f" />
            <stop offset="1" stopColor="#151514" />
          </linearGradient>
          <linearGradient id={headlight}>
            <stop stopColor="#ffae63" stopOpacity=".28" />
            <stop offset="1" stopColor="#ffae63" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={edges}>
            <stop stopColor="white" stopOpacity="0" />
            <stop offset=".09" stopColor="white" />
            <stop offset=".91" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={mask}>
            <rect width="600" height="365" fill={`url(#${edges})`} />
          </mask>
        </defs>

        <ellipse cx="312" cy="188" rx="255" ry="174" fill={`url(#${sky})`} />
        <circle
          cx="309"
          cy="176"
          r="125"
          stroke="#714020"
          strokeOpacity=".35"
        />
        <circle
          className="drive-orbit"
          cx="309"
          cy="176"
          r="144"
          stroke="#c77339"
          strokeOpacity=".2"
          strokeDasharray="2 14"
        />
        <g className="drive-stars" fill="#d08d53">
          <circle cx="109" cy="87" r="1.5" />
          <circle cx="197" cy="58" r="1" />
          <circle cx="325" cy="40" r="1.5" />
          <circle cx="474" cy="91" r="1" />
          <circle cx="526" cy="150" r="1.5" />
        </g>

        <g mask={`url(#${mask})`}>
          <g className="drive-skyline-track">
            <Skyline />
            <g transform="translate(720 0)">
              <Skyline />
            </g>
          </g>
          <path d="M0 306H600" stroke="#824321" strokeOpacity=".65" />
          <path d="M0 339H600" stroke="#5a3822" strokeOpacity=".5" />
          <g className="drive-road-track" fill="#d4793b" opacity=".5">
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={i}
                x={i * 96 - 96}
                y="321"
                width="42"
                height="2"
                rx="1"
              />
            ))}
          </g>
          <path
            className="drive-flight-trail"
            d="M75 126Q294 19 532 64"
            stroke="#bd7039"
            strokeOpacity=".4"
            strokeDasharray="3 9"
          />
          <g transform="translate(95 111)">
            <g className="drive-plane">
              <path
                d="m-18 3 12-5-7-12 5-2L3-5l13-4c5-1 8 3 3 6L6 3l-2 16-5 2-4-14-10 4-5-4z"
                fill="#ffad69"
              />
              <circle r="27" fill="#ff853e" opacity=".04" />
            </g>
          </g>
        </g>

        <ellipse
          className="drive-reflection"
          cx="303"
          cy="300"
          rx="170"
          ry="9"
          fill="#ff853e"
          opacity=".09"
        />
        <g className="drive-cab">
          <path
            className="drive-headlight"
            d="m465 257 132-39v92l-132-35z"
            fill={`url(#${headlight})`}
          />
          <path
            d="M133 262c3-13 18-20 56-24l32-45c6-9 14-13 26-13h94c12 0 21 5 30 15l39 43 44 10c17 4 25 13 25 29v10H130z"
            fill={`url(#${body})`}
            stroke="#ff9c58"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="m233 192-28 43h78v-43zm61 0v43h101l-39-40c-2-2-5-3-11-3z"
            fill={`url(#${glass})`}
            stroke="#e29a65"
            strokeOpacity=".7"
          />
          <path
            d="m239 196-19 31m84-31 32 31"
            stroke="#ffbb8e"
            strokeOpacity=".13"
            strokeWidth="5"
          />
          <path
            d="M200 242v41m87-42v45m112-45v42M139 270h330"
            stroke="#ffb27f"
            strokeOpacity=".35"
          />
          <path d="M211 237h181" stroke="#ffc296" strokeOpacity=".8" />
          <rect x="259" y="245" width="16" height="3" rx="1.5" fill="#ffd2aa" />
          <rect x="372" y="245" width="16" height="3" rx="1.5" fill="#ffd2aa" />
          <path
            d="M266 179v-11a4 4 0 0 1 4-4h37a4 4 0 0 1 4 4v11"
            fill="#ff9f52"
          />
          <text
            x="275"
            y="175"
            fontSize="9"
            fontWeight="700"
            letterSpacing="1"
            fill="#33170b"
            fontFamily="DM Sans, sans-serif"
          >
            CAB
          </text>
          <path d="M139 254h12v13h-14" fill="#dc6f39" />
          <path d="M459 254h13v12h-13" fill="#ffe0af" />
          <path
            d="M259 233v-13c0-10-6-16-13-16s-13 6-13 16v13"
            fill="#7f553b"
          />
          <circle cx="246" cy="204" r="8" fill="#d6a276" />
          <path
            d="M341 233v-13c0-10-6-16-13-16s-13 6-13 16v13"
            fill="#b68051"
          />
          <circle cx="328" cy="204" r="8" fill="#bd875d" />
          <Wheel x={201} y={283} />
          <Wheel x={411} y={283} />
          <g
            className="drive-speed-lines"
            stroke="#ff9d57"
            strokeLinecap="round"
            opacity=".65"
          >
            <path d="M74 259h34m-51 16h42m-15 15h21" />
          </g>
        </g>

        <g fontSize="9" fontFamily="DM Sans, sans-serif" letterSpacing="1.7">
          <circle
            className="drive-beacon"
            cx="66"
            cy="46"
            r="3"
            fill="#ff9449"
          />
          <text x="79" y="49" fill="#b7957b">
            CAMPUS
          </text>
          <path d="M148 46h25m-4-3 4 3-4 3" stroke="#77533a" />
          <text x="183" y="49" fill="#b7957b">
            AIRPORT
          </text>
        </g>
      </svg>
      <button
        className="drive-toggle icon-button"
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Play cab animation" : "Pause cab animation"}
        aria-pressed={paused}
        title={paused ? "Play animation" : "Pause animation"}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </div>
  );
}
