export function TacticalBackground() {
  return (
    <div className="background-layer" aria-hidden="true">
      <div className="base-gradient" />
      <div className="center-glow" />
      <svg
        className="background-geometry"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <g className="large-polygons">
          <polygon className="poly poly-left-back" points="-120,84 548,0 806,236 454,541 -120,704" />
          <polygon className="poly poly-left-mid" points="-80,344 426,154 706,466 316,774 -80,686" />
          <polygon className="poly poly-left-cut" points="0,762 344,541 657,846 423,1080 0,1080" />
          <polygon className="poly poly-right-back" points="1442,-20 2040,100 2040,751 1634,559 1358,223" />
          <polygon className="poly poly-right-mid" points="1664,293 2040,180 2040,1080 1478,1080 1376,754" />
          <polygon className="poly poly-right-cut" points="1268,720 1572,484 1920,678 1920,1080 1486,1080" />
          <polygon className="poly poly-center-plane" points="614,248 1076,118 1371,439 1060,759 677,653" />
        </g>
        <g className="small-decorations">
          <path d="M246 173l72 42-72 42-72-42z M1613 191l52 90-104 0z M1238 810l78 45-78 45-78-45z" />
          <path d="M420 875l62-36 62 36v72l-62 36-62-36z M1540 624l54-31 54 31v62l-54 31-54-31z" />
          <path d="M95 418l181-104 164 95 M1470 104l151 86 173-100 M708 887l128-73 152 88 M1325 348l88-50 62 36" />
          <path d="M252 742l98-56 M1111 175l112-64 M1685 824l116-67 M567 327l63-36" />
          <path d="M905 354l28-48 28 48-28 48z M1088 657l19-33 19 33-19 33z" />
        </g>
      </svg>
      <div className="lower-haze" />
      <div className="noise-layer" />
      <div className="vignette" />
    </div>
  );
}
