import React, { createContext, useState, useContext, useEffect } from "react";

// Create the global application context
const AppContext = createContext();

/**
 * AppProvider component to wrap the React application and expose global state.
 * Holds activeYear, safety locks, and the "Time is Money" conversion state.
 */
export function AppProvider({ children }) {
  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
  const [lockPastYears, setLockPastYears] = useState(true);

  // --- Income Predictor / Payroll State ---
  const [incomeStreams, setIncomeStreams] = useState(() => {
    try {
      const saved = localStorage.getItem("financial_hub_income_streams");
      if (saved) {
        return JSON.parse(saved);
      }
      return [
        {
          id: "stream-1",
          name: "Primary Paycheck",
          amount: 2500,
          type: "semi-monthly",
          dates: [7, 22],
          anchorDate: ""
        }
      ];
    } catch {
      return [
        {
          id: "stream-1",
          name: "Primary Paycheck",
          amount: 2500,
          type: "semi-monthly",
          dates: [7, 22],
          anchorDate: ""
        }
      ];
    }
  });

  // --- Employment & Life Energy State ---
  const [employmentData, setEmploymentData] = useState(() => {
    try {
      const saved = localStorage.getItem("financial_hub_employment");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          incomeType: parsed.incomeType || "Salary",
          amount: parsed.amount || 0,
          scheduleType: parsed.scheduleType || "Standard",
          hoursPerWeek: parsed.hoursPerWeek !== undefined ? parsed.hoursPerWeek : 40,
          shiftsPerWeek: parsed.shiftsPerWeek !== undefined ? parsed.shiftsPerWeek : 3,
          hoursPerShift: parsed.hoursPerShift !== undefined ? parsed.hoursPerShift : 12
        };
      }
      return { incomeType: "Salary", amount: 0, scheduleType: "Standard", hoursPerWeek: 40, shiftsPerWeek: 3, hoursPerShift: 12 };
    } catch {
      return { incomeType: "Salary", amount: 0, scheduleType: "Standard", hoursPerWeek: 40, shiftsPerWeek: 3, hoursPerShift: 12 };
    }
  });

  const [timeCostMode, setTimeCostMode] = useState(() => {
    try {
      const saved = localStorage.getItem("financial_hub_time_mode");
      return saved === "true";
    } catch {
      return false;
    }
  });

  // Custom persistent wrapper functions
  const updateIncomeStreams = (streams) => {
    setIncomeStreams(streams);
    try {
      localStorage.setItem("financial_hub_income_streams", JSON.stringify(streams));
    } catch (e) {
      console.error("Failed to save income streams", e);
    }
  };

  const updateEmploymentData = (data) => {
    setEmploymentData(data);
    try {
      localStorage.setItem("financial_hub_employment", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save employment data", e);
    }
  };

  const updateTimeCostMode = (val) => {
    setTimeCostMode(val);
    try {
      localStorage.setItem("financial_hub_time_mode", String(val));
    } catch (e) {
      console.error("Failed to save time cost mode", e);
    }
  };

  // derived total weekly hours based on schedule type
  const totalWeeklyHours = employmentData && employmentData.scheduleType === "Custom"
    ? (parseFloat(employmentData.shiftsPerWeek) || 0) * (parseFloat(employmentData.hoursPerShift) || 0)
    : (parseFloat(employmentData?.hoursPerWeek) || 0);

  // derived incomplete flag
  const isEmploymentIncomplete = 
    !employmentData || 
    !employmentData.amount || 
    parseFloat(employmentData.amount) <= 0 || 
    (employmentData.incomeType === "Salary" && totalWeeklyHours <= 0);

  // Auto-revert toggle if data becomes incomplete
  useEffect(() => {
    if (isEmploymentIncomplete && timeCostMode) {
      updateTimeCostMode(false);
    }
  }, [isEmploymentIncomplete, timeCostMode]);

  // isReadOnly evaluates to true if lockPastYears is active and activeYear is in the past
  const isReadOnly = lockPastYears && activeYear < new Date().getFullYear();

  // formatValue converts amounts dynamically between currency ($) and hours worked (hrs)
  const formatValue = (amount) => {
    const num = parseFloat(amount) || 0;
    
    if (!timeCostMode) {
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    let hourlyWage = 0;
    if (employmentData && parseFloat(employmentData.amount) > 0) {
      if (employmentData.incomeType === "Hourly") {
        hourlyWage = parseFloat(employmentData.amount);
      } else {
        if (totalWeeklyHours > 0) {
          hourlyWage = parseFloat(employmentData.amount) / (totalWeeklyHours * 52);
        }
      }
    }

    if (hourlyWage <= 0) {
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const hours = num / hourlyWage;
    return `${hours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs`;
  };

  return (
    <AppContext.Provider 
      value={{ 
        activeYear, 
        setActiveYear, 
        lockPastYears, 
        setLockPastYears, 
        isReadOnly,
        employmentData,
        setEmploymentData: updateEmploymentData,
        timeCostMode,
        setTimeCostMode: updateTimeCostMode,
        isEmploymentIncomplete,
        formatValue,
        incomeStreams,
        setIncomeStreams: updateIncomeStreams
      }}
    >
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
