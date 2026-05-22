import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import styles from "./PayrollSettings.module.css";

/**
 * PayrollSettings component styled strictly like a physical HR payroll stub card,
 * featuring vintage monospaced grids, ink lines, and paycheck tear ticket displays.
 */
export default function PayrollSettings({ transactions = [] }) {
  const { incomeStreams, setIncomeStreams, isReadOnly, formatValue, employmentData } = useApp();

  // Calculate predicted paycheck amount from W-4 timesheet profile
  const getPredictedPaycheckAmountForType = (type) => {
    if (!employmentData || !employmentData.amount || parseFloat(employmentData.amount) <= 0) {
      return null;
    }

    const rate = parseFloat(employmentData.amount);
    const weeklyHours = employmentData.scheduleType === "Custom"
      ? (parseFloat(employmentData.shiftsPerWeek) || 0) * (parseFloat(employmentData.hoursPerShift) || 0)
      : (parseFloat(employmentData.hoursPerWeek) || 0);

    if (employmentData.incomeType === "Salary") {
      if (type === "semi-monthly") {
        return rate / 24;
      } else {
        return rate / 26;
      }
    } else {
      if (type === "semi-monthly") {
        return (rate * weeklyHours * 52) / 24;
      } else {
        return rate * weeklyHours * 2;
      }
    }
  };

  // Calculate historical average amount based on matching stream name or fallback to all income
  const getHistoricalAverage = (streamName) => {
    const incomeTxs = transactions.filter((tx) => tx.type === "Income");
    if (incomeTxs.length === 0) return null;

    const trimmedName = (streamName || "").trim().toLowerCase();
    if (trimmedName) {
      // Look for specific matches: category or description matches streamName
      const specificTxs = incomeTxs.filter(
        (tx) =>
          (tx.category && tx.category.toLowerCase().includes(trimmedName)) ||
          (tx.description && tx.description.toLowerCase().includes(trimmedName))
      );

      if (specificTxs.length > 0) {
        const sum = specificTxs.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
        return {
          average: sum / specificTxs.length,
          type: "specific",
          count: specificTxs.length
        };
      }
    }

    // Fallback: general income average
    const sum = incomeTxs.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
    return {
      average: sum / incomeTxs.length,
      type: "general",
      count: incomeTxs.length
    };
  };

  // Local state for the payroll stream addition form
  const [name, setName] = useState("");
  const [scheduleType, setScheduleType] = useState("semi-monthly");
  
  // Auto-predict initial amount based on the W-4 profile
  const initialPrediction = getPredictedPaycheckAmountForType("semi-monthly");
  const [amount, setAmount] = useState(initialPrediction !== null ? initialPrediction.toFixed(2) : "");
  
  const [payday1, setPayday1] = useState("7");
  const [payday2, setPayday2] = useState("22");
  const [anchorDate, setAnchorDate] = useState("");
  
  const [isSaved, setIsSaved] = useState(false);

  const handleScheduleTypeChange = (newType) => {
    setScheduleType(newType);
    
    // Auto-predict amount if amount is empty, 0, or matches the predicted amount of the other frequency
    const prevPredicted = getPredictedPaycheckAmountForType(scheduleType);
    const nextPredicted = getPredictedPaycheckAmountForType(newType);
    
    if (nextPredicted !== null) {
      if (!amount || parseFloat(amount) === 0 || (prevPredicted !== null && Math.abs(parseFloat(amount) - prevPredicted) < 0.01)) {
        setAmount(nextPredicted.toFixed(2));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const newStream = {
      id: `stream-${Date.now()}`,
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      type: scheduleType,
      dates: scheduleType === "semi-monthly" ? [parseInt(payday1) || 1, parseInt(payday2) || 15] : [],
      anchorDate: scheduleType === "bi-weekly" ? anchorDate : ""
    };

    setIncomeStreams([...incomeStreams, newStream]);
    
    // Reset form inputs
    setName("");
    
    const nextPrediction = getPredictedPaycheckAmountForType(scheduleType);
    setAmount(nextPrediction !== null ? nextPrediction.toFixed(2) : "");
    
    setAnchorDate("");
    
    // Visual rubber stamp notification
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleDelete = (id) => {
    if (isReadOnly) return;
    setIncomeStreams(incomeStreams.filter((stream) => stream.id !== id));
  };

  return (
    <div className={styles.payrollStubCard}>
      {/* Dashed edge indicating paycheck ticket tear strip */}
      <div className={styles.tearEdge} aria-hidden="true" />

      {/* Official Payroll Stub Header */}
      <div className={styles.headerBlock}>
        <div className={styles.headerLeft}>
          <div className={styles.stubCode}>FORM HR-99 (PAYROLL)</div>
          <div className={styles.noticeText}>Internal Accounting Registry</div>
          <div className={styles.noticeText}>General Ledger Division</div>
        </div>
        <div className={styles.headerCenter}>
          <h2 className={styles.stubTitle}>PAYROLL & INCOME STREAMS REGISTRY</h2>
          <div className={styles.stubSubtitle}>
            Configure standard salary dispatches, shift payouts, and bi-weekly wage envelopes.
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusBox}>ACTIVE</div>
          <span className={styles.stampNotice}>COMPTROLLER APPROVED</span>
        </div>
      </div>

      <div className={styles.splitLayout}>
        {/* LEFT COLUMN: Add New Income Stream Form */}
        <div className={styles.formContainer}>
          <h3 className={styles.paneTitle}>[ RECORD WAGE TRANSACTION ]</h3>
          
          <form onSubmit={handleSubmit} className={styles.payrollForm}>
            {/* Input Name */}
            <div className={styles.formFieldRow}>
              <label htmlFor="stream-name" className={styles.fieldLabel}>Stream / Paycheck Identifier:</label>
              <input
                id="stream-name"
                type="text"
                required
                placeholder="e.g. Primary Salary, Side Hustle..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.textInput}
                disabled={isReadOnly}
              />
            </div>

            {/* Input Amount */}
            <div className={styles.formFieldRow}>
              <label htmlFor="stream-amount" className={styles.fieldLabel}>Paycheck Dispatch Amount ($):</label>
              <div className={styles.recessedLedgerBox}>
                <span className={styles.dollarSym}>$</span>
                <input
                  id="stream-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={styles.ledgerInput}
                  disabled={isReadOnly}
                />
              </div>
              {getPredictedPaycheckAmountForType(scheduleType) !== null && (
                <div style={{ marginTop: "6px", fontSize: "10px", fontFamily: "var(--font-typewriter)", color: "rgba(32, 30, 28, 0.6)" }}>
                  <span>Timesheet Prediction: </span>
                  <button
                    type="button"
                    onClick={() => {
                      const pred = getPredictedPaycheckAmountForType(scheduleType);
                      if (pred !== null) setAmount(pred.toFixed(2));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0",
                      color: "var(--color-stamp-blue)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "var(--font-typewriter)",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }}
                  >
                    ${getPredictedPaycheckAmountForType(scheduleType).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Auto-Fill)
                  </button>
                </div>
              )}

              {(() => {
                const histAvg = getHistoricalAverage(name);
                if (!histAvg) return null;

                const label = histAvg.type === "specific" 
                  ? `Specific Ledger Average (${histAvg.count} txs): `
                  : `General Income Average (${histAvg.count} txs): `;
                const color = histAvg.type === "specific" ? "var(--color-stamp-green)" : "rgba(32, 30, 28, 0.7)";

                return (
                  <div style={{ marginTop: "4px", fontSize: "10px", fontFamily: "var(--font-typewriter)", color: "rgba(32, 30, 28, 0.6)" }}>
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => setAmount(histAvg.average.toFixed(2))}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "0",
                        color: color,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontFamily: "var(--font-typewriter)",
                        fontSize: "10px",
                        fontWeight: "bold"
                      }}
                    >
                      ${histAvg.average.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Auto-Fill)
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Segmented Pay Schedule Selector */}
            <div className={styles.formFieldRow}>
              <span className={styles.fieldLabel}>Payroll Dispatch Frequency:</span>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "semi-monthly" ? styles.segmentActive : ""}`}
                  onClick={() => handleScheduleTypeChange("semi-monthly")}
                  disabled={isReadOnly}
                >
                  Semi-Monthly (Specific Dates)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "bi-weekly" ? styles.segmentActive : ""}`}
                  onClick={() => handleScheduleTypeChange("bi-weekly")}
                  disabled={isReadOnly}
                >
                  Bi-Weekly (Every 14 Days)
                </button>
              </div>
            </div>

            {/* CONDITIONAL CONTROLS */}
            {scheduleType === "semi-monthly" ? (
              <div className={styles.formFieldRow}>
                <span className={styles.fieldLabel}>Paycheck Calendared Dates (Day of Month):</span>
                <p className={styles.guideText}>
                  Specify the two target days of the month when payroll hits. Clamps to last day for shorter months.
                </p>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div className={styles.recessedLedgerBox} style={{ flex: "1" }}>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      placeholder="e.g. 7"
                      value={payday1}
                      onChange={(e) => setPayday1(e.target.value)}
                      className={styles.ledgerInput}
                      style={{ textAlign: "center", paddingLeft: "0" }}
                      disabled={isReadOnly}
                    />
                    <span className={styles.unitLabel}>Day 1</span>
                  </div>
                  <div className={styles.recessedLedgerBox} style={{ flex: "1" }}>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      placeholder="e.g. 22"
                      value={payday2}
                      onChange={(e) => setPayday2(e.target.value)}
                      className={styles.ledgerInput}
                      style={{ textAlign: "center", paddingLeft: "0" }}
                      disabled={isReadOnly}
                    />
                    <span className={styles.unitLabel}>Day 2</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.formFieldRow}>
                <span className={styles.fieldLabel}>Payroll Cycle Anchor Date (Last Payday):</span>
                <p className={styles.guideText}>
                  Select the date of your last paycheck. Bi-weekly math recurs every 14 days from this exact date.
                </p>
                <div className={styles.recessedLedgerBox}>
                  <input
                    type="date"
                    required
                    value={anchorDate}
                    onChange={(e) => setAnchorDate(e.target.value)}
                    className={styles.dateInput}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            )}

            {/* Stamping Buttons */}
            <div className={styles.actionRow}>
              {isReadOnly ? (
                <div className={styles.readOnlyWarning}>
                  🔐 AUDITOR LOCK ACTIVE (READ-ONLY HISTORICAL PERIOD)
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <button type="submit" className={styles.stampBtn}>
                    [ AUTHORIZE DISPATCH STREAM ]
                  </button>

                  {isSaved && (
                    <div className={styles.rubberStamp} role="alert">
                      RECORDED
                    </div>
                  )}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: Active Income Streams Listing */}
        <div className={styles.streamsContainer}>
          <h3 className={styles.paneTitle}>[ ACTIVE INCOME REGISTRY ]</h3>

          {incomeStreams.length === 0 ? (
            <div className={styles.emptyRegistry}>
              No income streams registered in system payroll.
            </div>
          ) : (
            <div className={styles.vouchersScroll}>
              {incomeStreams.map((stream) => (
                <div key={stream.id} className={styles.paycheckVoucher}>
                  {/* Dashed Tear Line */}
                  <div className={styles.voucherTear} aria-hidden="true" />
                  
                  <div className={styles.voucherBody}>
                    <div className={styles.voucherTop}>
                      <div>
                        <span className={styles.voucherName}>{stream.name}</span>
                        <div className={styles.voucherFrequency}>
                          {stream.type === "semi-monthly" ? (
                            <span>📅 Semi-Monthly (Days {stream.dates.join(", ")})</span>
                          ) : (
                            <span>🔁 Bi-Weekly (Anchored {stream.anchorDate})</span>
                          )}
                        </div>
                      </div>
                      <span className={`${styles.voucherAmount} typewriter-num`}>
                        {formatValue(stream.amount)}
                      </span>
                    </div>

                    <div className={styles.voucherBottom}>
                      <span className={styles.voucherSystemId}>VOUCHER NO. {stream.id.substring(0, 14).toUpperCase()}</span>
                      
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDelete(stream.id)}
                          className={styles.voidBtn}
                          title="Void Income Stream"
                        >
                          [ VOID VOUCHER ]
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
