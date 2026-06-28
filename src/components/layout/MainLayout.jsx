import { parseLocalDate } from '../../utils/dateUtils';
import React from "react";
import styles from "./MainLayout.module.css";
import { useApp } from "../../context/AppContext.jsx";

/**
 * MainLayout component representing the "Filing Cabinet".
 * Mimics physical binder dividers with sideways (vertical text) navigation tabs
 * sticking out to the left of the main content area.
 * Adds a skeuomorphic 'Master Year Selector' shaped like a brass label holder on the binder spine.
 *
 * @param {string} activeTab - The currently active tab identifier
 * @param {function} setActiveTab - Handler to switch the active tab
 * @param {Array} transactions - Raw transaction objects for dynamic year extraction
 * @param {React.ReactNode} children - Main content sheet displayed inside the folder
 */
export default function MainLayout({ activeTab, setActiveTab, transactions = [], children }) {
  const { activeYear, setActiveYear } = useApp();

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "budget", label: "Budget" },
    { id: "reports", label: "Reports" },
    { id: "planner", label: "Planner" },
    { id: "setup", label: "Setup" }
  ];

  // Dynamically extract unique years from transactions list
  const uniqueYears = Array.from(new Set(
    transactions
      .map(tx => tx.date ? parseLocalDate(tx.date).getFullYear() : null)
      .filter(Boolean)
  ));
  
  // Only display years that are in the database. Ensure activeYear (or current year as fallback) is present for select integrity.
  if (uniqueYears.length === 0) {
    uniqueYears.push(activeYear || new Date().getFullYear());
  } else if (activeYear && !uniqueYears.includes(activeYear)) {
    uniqueYears.push(activeYear);
  }
  uniqueYears.sort((a, b) => b - a);

  return (
    <div className={styles.cabinetContainer}>
      {/* Master Year Selector - Styled as a tactile brass metal label holder */}
      <div className={styles.yearSelectorSpine} title="Select Active Financial Year">
        <div className={styles.metalHolder}>
          <div className={styles.paperLabel}>
            <select
              value={activeYear}
              onChange={(e) => setActiveYear(parseInt(e.target.value))}
              className={styles.selectElement}
              id="master-year-select"
            >
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sidebar with sideways paper tabs sticking out to the left */}
      <div className={styles.cabinetSidebar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`${styles.cabinetTab} ${activeTab === t.id ? styles.active : ""}`}
            onClick={() => setActiveTab(t.id)}
            title={`View ${t.label}`}
          >
            <span className={styles.cabinetTabText}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main folder interior panel */}
      <div className={styles.cabinetContent}>
        {children}
      </div>
    </div>
  );
}

