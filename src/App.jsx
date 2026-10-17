import React from "react";
import { Calibr8Provider, useCalibr8 } from "./context/Calibr8Context";
import { Header } from "./components/common/Header";
import { DockNav } from "./components/common/DockNav";
import { LevelModal } from "./components/common/LevelModal";

import { LandingView } from "./features/landing/LandingView";
import { TodayView } from "./features/today/TodayView";
import { SolveView } from "./features/solve/SolveView";
import { LibraryView } from "./features/library/LibraryView";
import { TracksView } from "./features/tracks/TracksView";
import { RankingsView } from "./features/rankings/RankingsView";
import { ProfileView } from "./features/profile/ProfileView";
import { StoreView } from "./features/store/StoreView";

function MainContent() {
  const { state, isLevelModalOpen, setLevelModalOpen } = useCalibr8();

  const renderCurrentView = () => {
    switch (state.view) {
      case "landing":
        return <LandingView />;
      case "home":
        return <TodayView />;
      case "solve":
        return <SolveView />;
      case "library":
        return <LibraryView />;
      case "tracks":
        return <TracksView />;
      case "board":
        return <RankingsView />;
      case "me":
        return <ProfileView />;
      case "store":
        return <StoreView />;
      default:
        return <TodayView />;
    }
  };

  const themeClasses =
    {
      default: "",
      pixel: "hue-rotate-90 saturate-150",
      neon: "hue-rotate-[280deg] contrast-125",
      race: "hue-rotate-180 brightness-110",
    }[state.theme] || "";

  return (
    <div className={`min-h-screen bg-[#000511] text-slate-100 ${themeClasses}`}>
      <Header />
      <DockNav />

      {state.view === "landing" ? (
        <main>{renderCurrentView()}</main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-8 md:pl-28 md:pr-8">
          {renderCurrentView()}
        </main>
      )}

      <LevelModal
        isOpen={isLevelModalOpen}
        onClose={() => setLevelModalOpen(false)}
        isFirstTime={!state.started}
      />
    </div>
  );
}

export default function App() {
  return (
    <Calibr8Provider>
      <MainContent />
    </Calibr8Provider>
  );
}
