import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import styles from "./EmploymentProfile.module.css";

/**
 * EmploymentProfile component styled strictly like a physical paper W-4 tax form or
 * employee timesheet card, utilizing typewriter fonts, grid borders, and deep ink accents.
 */
export default function EmploymentProfile() {
  const { employmentData, setEmploymentData } = useApp();

  // Local form states initialized from context
  const [incomeType, setIncomeType] = useState(employmentData.incomeType || "Salary");
  const [amount, setAmount] = useState(employmentData.amount || "");
  const [scheduleType, setScheduleType] = useState(employmentData.scheduleType || "Standard");
  const [hoursPerWeek, setHoursPerWeek] = useState(employmentData.hoursPerWeek || "");
  const [shiftsPerWeek, setShiftsPerWeek] = useState(employmentData.shiftsPerWeek || "");
  const [hoursPerShift, setHoursPerShift] = useState(employmentData.hoursPerShift || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedData = {
      incomeType,
      amount: parseFloat(amount) || 0,
      scheduleType,
      hoursPerWeek: incomeType === "Hourly" ? 40 : (parseFloat(hoursPerWeek) || 0),
      shiftsPerWeek: incomeType === "Hourly" ? 3 : (parseFloat(shiftsPerWeek) || 0),
      hoursPerShift: incomeType === "Hourly" ? 12 : (parseFloat(hoursPerShift) || 0)
    };

    setEmploymentData(updatedData);
    setIsSaved(true);

    // Flash stamp for visual response
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <div className={styles.w4Sheet}>
      {/* Visual Perforated Tear Edge */}
      <div className={styles.tearEdge} aria-hidden="true" />

      {/* Sheet Title Stamp Header */}
      <div className={styles.headerBlock}>
        <div className={styles.headerLeft}>
          <div className={styles.formCode}>Form W-4 (Time)</div>
          <div className={styles.deptNotice}>Department of the Treasury</div>
          <div className={styles.deptNotice}>Internal Revenue Service</div>
        </div>
        <div className={styles.headerCenter}>
          <h1 className={styles.formTitle}>Employee's Time-Value Certificate</h1>
          <div className={styles.formSubtitle}>
            Determine life energy expenditure and convert currency into hours worked.
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.fiscalYear}>2026</div>
          <span className={styles.confidentialStamp}>CONFIDENTIAL</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.w4FormBody}>
        {/* Step 1: Income Type Selection */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>STEP 1</span>
            <span className={styles.stepTitle}>Classification of Gross Income Type</span>
          </div>
          <div className={styles.sectionFields}>
            <p className={styles.fieldGuide}>
              Identify your primary method of labor compensation. Select either Salary (Annualised Earnings) or Hourly (Rate per Hour worked).
            </p>
            <div style={{ display: "flex", gap: "25px", marginTop: "10px" }}>
              <label className={styles.tactileRadio}>
                <input
                  type="radio"
                  name="incomeType"
                  value="Salary"
                  checked={incomeType === "Salary"}
                  onChange={() => setIncomeType("Salary")}
                />
                <span className={styles.radioBox} />
                <span className={styles.radioLabel}>Salary (Annual Contract)</span>
              </label>

              <label className={styles.tactileRadio}>
                <input
                  type="radio"
                  name="incomeType"
                  value="Hourly"
                  checked={incomeType === "Hourly"}
                  onChange={() => setIncomeType("Hourly")}
                />
                <span className={styles.radioBox} />
                <span className={styles.radioLabel}>Hourly Wage Rate</span>
              </label>
            </div>
          </div>
        </div>

        {/* Step 2: Amount Entry */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>STEP 2</span>
            <span className={styles.stepTitle}>Filing of Compensation Amount</span>
          </div>
          <div className={styles.sectionFields}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "20px", alignItems: "center" }}>
              <div>
                <p className={styles.fieldGuide} style={{ margin: 0 }}>
                  Enter your total gross compensation in dollars ($).
                  <br />
                  - For Salary: Enter full annual earnings (e.g. 52000).
                  <br />
                  - For Hourly: Enter base hourly pay rate (e.g. 25).
                </p>
              </div>
              <div className={styles.ledgerFieldBox}>
                <span className={styles.dollarSymbol}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={styles.ledgerInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Weekly Labor Allocation */}
        <div className={styles.formSection} style={{ borderBottom: "3px solid var(--color-ink-dark)" }}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>STEP 3</span>
            <span className={styles.stepTitle}>Weekly Labor Allocation</span>
          </div>
          <div className={styles.sectionFields}>
            <div className={styles.segmentOptionRow} style={{ marginBottom: "18px" }}>
              <span className={styles.fieldGuide} style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Select labor tracking schedule format:
              </span>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "Standard" ? styles.segmentActive : ""}`}
                  disabled={incomeType === "Hourly"}
                  onClick={() => setScheduleType("Standard")}
                >
                  Standard (Weekly)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "Custom" ? styles.segmentActive : ""}`}
                  disabled={incomeType === "Hourly"}
                  onClick={() => setScheduleType("Custom")}
                >
                  Custom (Shifts)
                </button>
              </div>
              {incomeType === "Hourly" && (
                <span className={styles.hourlyNote} style={{ display: "block", marginTop: "6px", color: "rgba(32,30,28,0.5)" }}>
                  * Automatically locked to standard weekly totals for hourly rate filings.
                </span>
              )}
            </div>

            {/* Conditional Input Rendering based on scheduleType */}
            {scheduleType === "Standard" || incomeType === "Hourly" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "20px", alignItems: "center" }}>
                <div>
                  <p className={styles.fieldGuide} style={{ margin: 0 }}>
                    Enter the standard number of hours allocated to professional service each week.
                  </p>
                </div>
                <div className={styles.ledgerFieldBox}>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    required={incomeType === "Salary" && scheduleType === "Standard"}
                    disabled={incomeType === "Hourly"}
                    placeholder={incomeType === "Hourly" ? "40" : "Hours per Week"}
                    value={incomeType === "Hourly" ? "" : hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className={styles.ledgerInput}
                    style={{ textAlign: "center", paddingLeft: "10px" }}
                  />
                  <span className={styles.unitLabel}>HRS</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "center" }}>
                <div>
                  <p className={styles.fieldGuide} style={{ margin: 0 }}>
                    Enter custom shift schedule details to determine total weekly hours (Shifts × Hours/Shift).
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div className={styles.ledgerFieldBox} style={{ flex: "1 1 50%" }}>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      required={incomeType === "Salary" && scheduleType === "Custom"}
                      placeholder="Shifts"
                      value={shiftsPerWeek}
                      onChange={(e) => setShiftsPerWeek(e.target.value)}
                      className={styles.ledgerInput}
                      style={{ textAlign: "center", paddingLeft: "5px" }}
                    />
                    <span className={styles.unitLabel} style={{ fontSize: "9px" }}>SHIFTS</span>
                  </div>
                  <div className={styles.ledgerFieldBox} style={{ flex: "1 1 50%" }}>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      required={incomeType === "Salary" && scheduleType === "Custom"}
                      placeholder="Hrs/Shift"
                      value={hoursPerShift}
                      onChange={(e) => setHoursPerShift(e.target.value)}
                      className={styles.ledgerInput}
                      style={{ textAlign: "center", paddingLeft: "5px" }}
                    />
                    <span className={styles.unitLabel} style={{ fontSize: "9px" }}>HRS/SHIFT</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Stamping and Submission */}
        <div className={styles.signOffArea}>
          <div className={styles.signatureLine}>
            <div className={styles.signatureGraphic}>
              {employmentData.amount > 0 ? "General Ledger Officer" : "_______________________"}
            </div>
            <div className={styles.sigLabel}>Signature of Authorized Declarant</div>
          </div>

          <div style={{ position: "relative" }}>
            <button type="submit" className={styles.stampButton}>
              [ STAMP CERTIFICATE ]
            </button>

            {isSaved && (
              <div className={styles.appliedStamp} role="alert">
                FILED / SAVED
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
