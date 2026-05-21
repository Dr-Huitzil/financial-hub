import React from "react";
import styles from "./MainLayout.module.css";

/**
 * MainLayout component representing the "Filing Cabinet".
 * Mimics physical binder dividers with sideways (vertical text) navigation tabs
 * sticking out to the left of the main content area.
 *
 * @param {string} activeTab - The currently active tab identifier
 * @param {function} setActiveTab - Handler to switch the active tab
 * @param {React.ReactNode} children - Main content sheet displayed inside the folder
 */
export default function MainLayout({ activeTab, setActiveTab, children }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "budget", label: "Budget" },
    { id: "reports", label: "Reports" },
    { id: "planner", label: "Planner" },
    { id: "setup", label: "Setup" }
  ];

  return (
    <div className={styles.cabinetContainer}>
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
