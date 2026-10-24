import { useCalibr8 } from "../../context/Calibr8Context";

export function Toast() {
  const { toastMessage } = useCalibr8();
  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        pointerEvents: "none",
        animation: "fade 0.2s",
      }}
    >
      <div
        style={{
          borderRadius: "999px",
          border: "1px solid var(--ln)",
          background: "var(--card)",
          color: "var(--fg)",
          padding: "10px 22px",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--ac)",
          }}
        />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
