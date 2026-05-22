import React, { createContext, useState, useContext } from "react";

// Create the global application context
const AppContext = createContext();

/**
 * AppProvider component to wrap the React application and expose global state.
 * Holds activeYear (defaulting to current calendar year) and setActiveYear.
 */
export function AppProvider({ children }) {
  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
  const [lockPastYears, setLockPastYears] = useState(true);

  // isReadOnly evaluates to true if lockPastYears is active and activeYear is in the past
  const isReadOnly = lockPastYears && activeYear < new Date().getFullYear();

  return (
    <AppContext.Provider value={{ activeYear, setActiveYear, lockPastYears, setLockPastYears, isReadOnly }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom React hook for consuming the AppContext.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
