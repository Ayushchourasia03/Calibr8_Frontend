import { useEffect, useRef } from "react";

export function useStrictModeGuard({ isActive, isStrict, onAwayWarning, onLockout }) {
  const timerRef = useRef(0);

  useEffect(() => {
    if (!isActive || !isStrict) return;

    const onPaste = (e) => {
      e.preventDefault();
      alert("Paste is disabled in strict mode to ensure integrity.");
    };

    const stopEvent = (e) => e.preventDefault();

    const handleAway = () => {
      if (!timerRef.current) {
        timerRef.current = Date.now();
      }
    };

    const handleBack = () => {
      if (!timerRef.current) return;
      const elapsedSeconds = (Date.now() - timerRef.current) / 1000;
      timerRef.current = 0;

      if (elapsedSeconds > 15) {
        onAwayWarning(elapsedSeconds);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleAway();
      else handleBack();
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) handleAway();
      else handleBack();
    };

    document.addEventListener("paste", onPaste, true);
    document.addEventListener("drop", stopEvent, true);
    document.addEventListener("contextmenu", stopEvent);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("blur", handleAway);
    window.addEventListener("focus", handleBack);

    return () => {
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("drop", stopEvent, true);
      document.removeEventListener("contextmenu", stopEvent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("blur", handleAway);
      window.removeEventListener("focus", handleBack);
    };
  }, [isActive, isStrict, onAwayWarning, onLockout]);
}