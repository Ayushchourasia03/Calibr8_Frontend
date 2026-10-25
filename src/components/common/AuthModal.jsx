import { useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

/**
 * AuthModal bridges any legacy triggers to the unified OnboardingModal
 * matching the exact UI specification in Calibr8__4___2__79031a8d.html
 */
export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authMode, setActiveModal, setModalData } = useCalibr8();

  useEffect(() => {
    if (isAuthModalOpen) {
      setAuthModalOpen(false);
      setModalData({ step: 0, authMode: authMode || "login" });
      setActiveModal("onboarding");
    }
  }, [isAuthModalOpen, authMode, setAuthModalOpen, setActiveModal, setModalData]);

  return null;
}

export default AuthModal;