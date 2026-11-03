/**
 * Calibr8 Glassmorphic Skeleton Loading Components
 * Designed to seamlessly blend with the atmospheric neon-glass UI.
 */

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "6px",
  className = "",
  style = {},
}) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(80, 150, 255, 0.12) 50%, rgba(255, 255, 255, 0.03) 100%)",
        backgroundSize: "200% 100%",
        animation: "cal-shimmer 1.6s infinite ease-in-out",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3, height = "120px", style = {} }) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: height,
        ...style,
      }}
    >
      <Skeleton width="45%" height="20px" borderRadius="8px" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "90%"}
          height="14px"
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: "12px 14px" }}>
                <Skeleton width="65%" height="14px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ borderBottom: "1px solid var(--ln)" }}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} style={{ padding: "14px 14px" }}>
                  <Skeleton
                    width={c === 1 ? "80%" : c === 0 ? "35%" : "55%"}
                    height="15px"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPodium() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: "16px",
        margin: "24px 0",
        minHeight: "180px",
      }}
    >
      {/* 2nd place */}
      <div
        className="card"
        style={{
          width: "120px",
          height: "150px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="70%" height="14px" />
        <Skeleton width="50%" height="12px" />
      </div>

      {/* 1st place */}
      <div
        className="card"
        style={{
          width: "135px",
          height: "190px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          border: "1px solid var(--ac)",
        }}
      >
        <Skeleton width="48px" height="48px" borderRadius="50%" />
        <Skeleton width="80%" height="16px" />
        <Skeleton width="60%" height="13px" />
      </div>

      {/* 3rd place */}
      <div
        className="card"
        style={{
          width: "120px",
          height: "130px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="70%" height="14px" />
        <Skeleton width="50%" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4, height = "120px" }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  );
}

export default Skeleton;
