import useIdle from "../hooks/useIdle";
import { useEffect } from "react";

export default function ScreenSaver({ timeout = 120000, onActive } = {}) {
  const { isIdle, reset } = useIdle(timeout);

  useEffect(() => {
    if (isIdle && typeof onActive === "function") onActive();
  }, [isIdle, onActive]);

  if (!isIdle) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black flex items-center justify-center z-10000"
      onPointerDown={reset}
      onKeyDown={reset}
      tabIndex={-1}
    >
      <div className="relative w-full h-full">
        <style>{`
          @keyframes mover {
            0% { transform: translate(5vw, 10vh) rotate(0deg); }
            50% { transform: translate(60vw, 40vh) rotate(180deg); }
            100% { transform: translate(10vw, 70vh) rotate(360deg); }
          }
          .saver-logo {
            width: 140px;
            height: 140px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(99,102,241,0.95), rgba(56,189,248,0.95));
            box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 -8px 20px rgba(255,255,255,0.06);
            animation: mover 10s ease-in-out infinite;
            will-change: transform;
            position: absolute;
          }
          .saver-badge { font-weight: 700; color: white; font-family: Inter, ui-sans-serif, system-ui; }
        `}</style>

        <div className="saver-logo" aria-hidden>
          <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#g)" opacity="0.08" />
            <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M30 50c8-12 32-12 40 0" opacity="0.95" />
              <path d="M30 62c8-12 32-12 40 0" opacity="0.6" />
            </g>
          </svg>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        </div>
      </div>
    </div>
  );
}

/* Usage:
  In `App.jsx` import and render <ScreenSaver timeout={10000} onActive={() => console.log('screensaver!')} />
  The component will show when there's no activity for `timeout` ms and hide on any pointer/keyboard event.
*/
