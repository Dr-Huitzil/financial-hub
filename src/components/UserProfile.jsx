import React, { useState, useEffect, useRef } from "react";
import styles from "./UserProfile.module.css";

/**
 * UserProfile component representing a skeuomorphic "Stamped ID Badge" pinned to the top right.
 * Displays the current user's email/name and drops down a paper index-card style menu.
 * 
 * @param {Object} user - The active Firebase auth user object or demo user properties
 * @param {boolean} isDemoMode - Toggle representing if user is in guest visitor sandbox
 * @param {function} onSettingsClick - Callback opened when Settings item is clicked
 * @param {function} onLogout - Callback clicked to secure logoff or exit sandboxes
 */
export default function UserProfile({ user, isDemoMode, onSettingsClick, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userName = isDemoMode
    ? "Guest Visitor"
    : user?.email
    ? user.email.split("@")[0].toUpperCase()
    : "YEARLY OVERVIEW";

  return (
    <div className={styles.profileContainer} ref={containerRef}>
      {/* 1. Metal Pin Visual Cues */}
      <div className={styles.pinHole} />
      <div className={styles.metalPin} />

      {/* 2. Tactile Card Badge */}
      <div 
        className={styles.badgeCard} 
        onClick={() => setIsOpen(!isOpen)}
        title="View Yearly Overview Credentials & Options"
      >
        <div className={styles.badgeBarcode} />
        
        <span className={styles.badgeHeader}>YEARLY OVERVIEW ID</span>
        <span className={styles.badgeName} title={isDemoMode ? "Guest Visitor" : user?.email || ""}>
          {userName}
        </span>
        <span className={styles.badgeSub}>
          {isDemoMode ? "GUEST SANDBOX" : "AUDIT OFFICER"}
        </span>
      </div>

      {/* 3. Lined Paper Index Card Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button 
            className={styles.menuItem} 
            onClick={() => {
              setIsOpen(false);
              if (onSettingsClick) onSettingsClick();
            }}
          >
            <span className={styles.menuItemIcon}>⚙️</span> Settings
          </button>
          
          <div className={styles.menuPerforation} />
          
          <button 
            className={styles.menuItem} 
            onClick={() => {
              setIsOpen(false);
              if (onLogout) onLogout();
            }}
            style={{ color: "var(--color-stamp-red)" }}
          >
            <span className={styles.menuItemIcon}>🔑</span> Log Off
          </button>
        </div>
      )}
    </div>
  );
}
