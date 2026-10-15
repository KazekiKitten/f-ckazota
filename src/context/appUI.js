import { createContext, useContext } from "react";

const AppUIContext = createContext(null);

export const useAppUI = () => {
  const context = useContext(AppUIContext);
  if (!context) {
    throw new Error("useAppUI must be used inside the AppUIProvider");
  }
  return context;
};

export default AppUIContext;
