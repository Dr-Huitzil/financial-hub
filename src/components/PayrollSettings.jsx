import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import styles from "./PayrollSettings.module.css";

/**
 * PayrollSettings component styled strictly like a physical HR payroll stub card,
 * featuring vintage monospaced grids, ink lines, and paycheck tear ticket displays.
 */
export default function PayrollSettings() {
  const { incomeStreams, setIncomeStreams, isReadOnly, formatValue } = useApp();

  // Local state for the payroll stream addition form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [scheduleType, setScheduleType] = useState("semi-monthly");
  const [payday1, setPayday1] = useState("7");
  const [payday2, setPayday2] = useState("22");
  const [anchorDate, setAnchorDate] = useState("");
  
  const [isSaved, setIsSaved] = useState(false);

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
    setAmount("");
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
            </div>

            {/* Segmented Pay Schedule Selector */}
            <div className={styles.formFieldRow}>
              <span className={styles.fieldLabel}>Payroll Dispatch Frequency:</span>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "semi-monthly" ? styles.segmentActive : ""}`}
                  onClick={() => setScheduleType("semi-monthly")}
                  disabled={isReadOnly}
                >
                  Semi-Monthly (Specific Dates)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${scheduleType === "bi-weekly" ? styles.segmentActive : ""}`}
                  onClick={() => setScheduleType("bi-weekly")}
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
