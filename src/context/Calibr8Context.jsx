import React, { createContext, useContext } from "react";
import { useCalibr8State } from "./useCalibr8State";

const Calibr8Context = createContext(null);

export function Calibr8Provider({ children }) {
  const value = useCalibr8State();
  return (
    <Calibr8Context.Provider value={value}>{children}</Calibr8Context.Provider>
  );
}

export const useCalibr8 = () => {
  const ctx = useContext(Calibr8Context);
  if (!ctx) throw new Error("useCalibr8 must be used within Calibr8Provider");
  return ctx;
};
