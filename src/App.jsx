import { Calibr8Provider, useCalibr8 } from "./context/Calibr8Context";
import { Header } from "./components/layout/Header";
import { DockNav } from "./components/layout/DockNav";
import { Toast } from "./components/common/Toast";

import { OnboardingModal } from "./components/modals/OnboardingModal";
import { LevelModal } from "./components/modals/LevelModal";
import { TierInfoModal } from "./components/modals/TierInfoModal";
import { StatInfoModal } from "./components/modals/StatInfoModal";
import { TrackModal } from "./components/modals/TrackModal";
import { VideoModal } from "./components/modals/VideoModal";
import { AuthModal } from "./components/common/AuthModal";

import { LandingView } from "./features/landing/LandingView";
import { TodayView } from "./features/today/TodayView";
import { SolveView } from "./features/solve/SolveView";
import { ProblemsView } from "./features/problems/ProblemsView";
import { LibraryView } from "./features/library/LibraryView";
import { TracksView } from "./features/tracks/TracksView";
import { RankingsView } from "./features/rankings/RankingsView";
import { ProfileView } from "./features/profile/ProfileView";
import { StoreView } from "./features/store/StoreView";

function MainContent() {
  const { state } = useCalibr8();

  const renderView = () => {
    switch (state.view) {
      case "landing":
        return <LandingView />;
      case "home":
        return <TodayView />;
      case "solve":
        return <SolveView />;
      case "problems":
        return <ProblemsView />;
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

  return (
    <div className={state.view === "landing" ? "land" : ""}>
      <Header />
      <DockNav />

      <main>{renderView()}</main>

      {/* Global Modals */}
      <OnboardingModal />
      <LevelModal />
      <TierInfoModal />
      <StatInfoModal />
      <TrackModal />
      <VideoModal />
      <AuthModal />

      {/* Global Toast Notifications */}
      <Toast />
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