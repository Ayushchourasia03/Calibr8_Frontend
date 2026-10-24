import { useContext } from "react";
import { Calibr8Context } from "./Calibr8Context";

export function useCalibr8() {
  const context = useContext(Calibr8Context);
  if (!context) {
    throw new Error("useCalibr8 must be used within a Calibr8Provider");
  }
  return context;
}
