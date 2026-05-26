import React from "react";
import styles from "./SettingsModal.module.css";
import { useApp } from "../context/AppContext.jsx";

/**
 * SettingsModal component rendering a skeuomorphic modal popover sheet.
 * Includes interactive cardboard details, visual ring binder punches, and
 * a hand-drawn ink marker checkbox toggle to command system security locking features.
 * 
 * @param {boolean} isOpen - Determines if the setting card overlay is mounted
 * @param {function} onClose - Handler triggered when retaining voucher / securing controls
 */
export default function SettingsModal({ isOpen, onClose }) {
  const { 
    lockPastYears, 
    setLockPastYears, 
    timeCostMode, 
    setTimeCostMode, 
    isEmploymentIncomplete 
  } = useApp();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.settingsCard} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* 1. Cardboard Ring Binder Hole Punches */}
        <div className={styles.punchHoles} aria-hidden="true">
          <div className={styles.punchHole} />
          <div className={styles.punchHole} />
          <div className={styles.punchHole} />
        </div>

        {/* 2. System Title Stamp */}
        <div className={styles.cardHeader} id="settings-modal-title">
          Yearly Overview Settings Panel
        </div>

        {/* 3. Lined safety check fields */}
        <div className={styles.settingRow}>
          <label className={styles.checkboxContainer}>
            <input 
              type="checkbox"
              checked={lockPastYears}
              onChange={(e) => setLockPastYears(e.target.checked)}
              id="lock-past-years-checkbox"
            />
            <span className={styles.checkmarkBox} />
            <div>
              <span>Lock Past Years (Read-Only)</span>
              <span className={styles.settingDesc}>
                Prevents entry additions or voiding/editing transactions in calendar periods prior to the current year.
              </span>
            </div>
          </label>
        </div>

        {/* 4. Life Energy 'Evil Toggle' */}
        <div className={isEmploymentIncomplete ? `${styles.settingRow} ${styles.disabledRow}` : styles.settingRow}>
          <label className={styles.checkboxContainer}>
            <input 
              type="checkbox"
              checked={timeCostMode}
              disabled={isEmploymentIncomplete}
              onChange={(e) => setTimeCostMode(e.target.checked)}
              id="life-energy-checkbox"
            />
            <span className={styles.hazardSwitch} />
            <div>
              <span>Display Cost in Life Energy</span>
              <span className={styles.settingDesc}>
                Converts all financial currency metrics globally into equivalent hours of physical labor.
              </span>
            </div>
          </label>
        </div>

        <div className={styles.divider} />

        {/* 4. Comptroller retain settings controls */}
        <button 
          className={styles.applyBtn} 
          onClick={onClose}
          title="Apply System Parameters"
        >
          Retain Configuration
        </button>
      </div>
    </div>
  );
}
