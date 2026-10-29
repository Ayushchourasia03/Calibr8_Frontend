import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { BANDS, COMPANIES } from "../../data/tracksData";

export function TracksView() {
  const { setView } = useCalibr8();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showResumeChecklist, setShowResumeChecklist] = useState(false);

  const handleActionClick = (kind) => {
    setSelectedCompany(null);
    if (kind === "oa") {
      setView("problems");
    } else if (kind === "aptitude") {
      setView("library");
    } else if (kind === "tech") {
      setView("library");
    } else if (kind === "design") {
      setView("library");
    } else if (kind === "hr") {
      setView("library");
    } else if (kind === "resume") {
      setShowResumeChecklist(true);
    }
  };

  const getActionLabel = (kind) => {
    switch (kind) {
      case "oa":
        return "Practice problems";
      case "aptitude":
        return "Practise aptitude";
      case "tech":
        return "Study core CS";
      case "design":
        return "Study system design";
      case "hr":
        return "Practise English and answers";
      case "resume":
        return "Resume checklist";
      default:
        return null;
    }
  };

  return (
    <div>
      <h1>Company tracks</h1>
      <p className="mu">
        Each track follows the full hiring process of a company, from resume to offer. Tap a company to see every stage and practise for it. These processes are typical and change often, so confirm on the company&apos;s careers page. These are not real company questions.
      </p>

      {BANDS.map((band, bandIndex) => {
        const companiesInBand = COMPANIES.filter((c) => c[1] === bandIndex);

        return (
          <div key={bandIndex}>
            <h2 style={{ marginTop: "18px" }}>{band[0]}</h2>
            <p className="mu">{band[1]}</p>
            <div className="grid tk">
              {companiesInBand.map((c, idx) => {
                const isOpen = c[2] >= 0.7;
                return (
                  <div
                    key={idx}
                    className="card"
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedCompany(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedCompany(c);
                    }}
                  >
                    <h3>
                      {c[0]}{" "}
                      {isOpen ? (
                        <span className="tag ok">open</span>
                      ) : (
                        <span className="tag">locked</span>
                      )}
                    </h3>
                    <p className="mu">{c[3]}</p>
                    <div className="bar">
                      <i style={{ width: `${c[2] * 100}%` }} />
                    </div>
                    <p className="mu">
                      Readiness {Math.round(c[2] * 100)}% · {c[4].length} stages
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Company Modal */}
      {selectedCompany && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setSelectedCompany(null);
          }}
        >
          <div className="sheet" role="dialog" aria-modal="true">
            <button
              className="x"
              aria-label="Close"
              onClick={() => setSelectedCompany(null)}
            >
              &times;
            </button>
            <h2>
              {selectedCompany[0]}{" "}
              {selectedCompany[2] >= 0.7 ? (
                <span className="tag ok">open</span>
              ) : (
                <span className="tag">locked</span>
              )}
            </h2>
            <p className="mu">
              {BANDS[selectedCompany[1]][0]} · {selectedCompany[3]}
            </p>

            <h3>The process, start to finish</h3>
            <div className="tl">
              {selectedCompany[4].map((stage, j) => {
                const actionLabel = getActionLabel(stage[2]);
                return (
                  <div key={j} className="tls">
                    <div className="tn">{j + 1}</div>
                    <div>
                      <b>{stage[0]}</b>
                      <p className="mu" style={{ margin: "2px 0 6px" }}>
                        {stage[1]}
                      </p>
                      {actionLabel && (
                        <button
                          className="btn ghost kb"
                          onClick={() => handleActionClick(stage[2])}
                        >
                          {actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bar" style={{ margin: "12px 0 6px" }}>
              <i style={{ width: `${selectedCompany[2] * 100}%` }} />
            </div>
            <p className="mu">
              Readiness {Math.round(selectedCompany[2] * 100)}%.{" "}
              {selectedCompany[2] >= 0.7
                ? "You can practise this track now."
                : `Reach 70% to unlock (${Math.round(
                    (0.7 - selectedCompany[2]) * 100
                  )} points to go).`}{" "}
              Readiness combines your coding rating, topics covered, aptitude and English.
            </p>

            <div className="row" style={{ marginTop: "14px" }}>
              <button
                className="btn"
                disabled={selectedCompany[2] < 0.7}
                onClick={() => {
                  setSelectedCompany(null);
                  setView("problems");
                }}
              >
                {selectedCompany[2] >= 0.7 ? "Start track practice" : "Locked"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Checklist Modal */}
      {showResumeChecklist && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setShowResumeChecklist(false);
          }}
        >
          <div className="sheet" role="dialog" aria-modal="true">
            <button
              className="x"
              aria-label="Close"
              onClick={() => setShowResumeChecklist(false)}
            >
              &times;
            </button>
            <h2>Resume checklist</h2>
            <ul className="shl">
              <li>Keep it to one page.</li>
              <li>Lead with education, projects and skills.</li>
              <li>Write each project bullet as what you built, how, and the result with a number.</li>
              <li>Link your GitHub or portfolio.</li>
              <li>Match keywords from the job description, but only for things you really know.</li>
              <li>Proofread: no spelling mistakes, consistent dates and formatting.</li>
              <li>Save as a PDF named with your name.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
