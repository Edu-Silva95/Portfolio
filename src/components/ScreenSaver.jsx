import useIdle from "../hooks/useIdle";
import { useEffect, useRef } from "react";

export default function ScreenSaver({ timeout = 20000, onActive } = {}) {
  const { isIdle, reset } = useIdle(timeout);
  const logoRef = useRef();

  useEffect(() => {
    if (isIdle && typeof onActive === "function") onActive();
  }, [isIdle, onActive]);

  useEffect(() => {
    if (!isIdle) return;

    const element = logoRef.current;
    if (!element) return;

    // Function to move the logo to a random position & rotation around the screen
    const moveLogo = () => {
      const x = Math.random() * 85; // 0-85vw
      const y = Math.random() * 85; // 0-85vh
      const r = Math.random() * 360; // rotation in degrees
      element.style.transform = `translate(${x}vw, ${y}vh) rotate(${r}deg)`;
    };
    moveLogo();

    // Move every 3 seconds
    const interval = setInterval(moveLogo, 3000);

    return () => clearInterval(interval);
  }, [isIdle]);

  if (!isIdle) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black flex items-center justify-center z-10000"
      onPointerDown={reset}
      onKeyDown={reset}
      tabIndex={-1}
    >
      <div className="relative w-full h-full">
        <div
          ref={logoRef}
          className="saver-logo"
          aria-hidden
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            position: "absolute",
            willChange: "transform",
            transition: "transform 1.8s ease-in-out", // smooth motion
          }}
        >
          <img
            src="/icons/EddOS.ico"
            alt="EddOS logo"
            className="w-60 h-60"
          />
        </div>
      </div>
    </div>
  );
}