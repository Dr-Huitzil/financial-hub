import { parseLocalDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from "react";
import styles from "./BudgetFolder.module.css";
import { useApp } from "../../context/AppContext.jsx";

/**
 * BudgetFolder component representing the "Inner Manila Folder" of the budget sheet.
 * Features 12 horizontal tabs for month switching, full seamless tab merging styling,
 * a commented Firebase Firestore dynamic listener hookup, and monospace mechanical numbering.
 * 
 * @param {Array} transactions - Array of raw transaction objects
 * @param {Object} budgetLimits - Budget limit target caps from state
 * @param {Object} categories - Available categories list
 * @param {function} onAddTransaction - Voucher submission handler
 * @param {function} onDeleteTransaction - Voucher voiding handler
 */
const formatDateCompact = (isoString) => {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;
  const [year, month, day] = parts;
  return `${month}/${day}/${year.slice(2)}`;
};

export default function BudgetFolder({ 
  transactions = [], 
  budgetLimits = {}, 
  categories = {}, 
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction
}) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const currentMonthIndex = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(MONTHS[currentMonthIndex]);
  const [viewLimit, setViewLimit] = useState("10");

  const { activeYear, setActiveYear, isReadOnly, formatValue } = useApp();

  // Form states for new transaction voucher
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txType, setTxType] = useState("Expense");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  // States for viewing/editing transaction details
  const [selectedTx, setSelectedTx] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState("Expense");
  const [editDate, setEditDate] = useState("");

  const handleRowClick = (tx) => {
    setSelectedTx(tx);
    setIsEditing(false);
    setEditDesc(tx.description || "");
    setEditAmount(tx.amount || "");
    setEditCategory(tx.category || "");
    setEditType(tx.type || "Expense");
    setEditDate(tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0]);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!editDesc.trim() || !editAmount || !editCategory) return;

    const updatedTx = {
      description: editDesc.trim(),
      amount: parseFloat(editAmount) || 0,
      category: editCategory,
      type: editType,
      date: editDate
    };

    if (onUpdateTransaction) {
      onUpdateTransaction(selectedTx.id, updatedTx);
    }

    setSelectedTx(null);
    setIsEditing(false);
  };

  const handleTypeChange = (newType) => {
    setEditType(newType);
    const availableCats = categories[newType] || [];
    if (availableCats.length > 0) {
      setEditCategory(availableCats[0]);
    } else {
      setEditCategory("");
    }
  };

  // ==========================================
  // FIREBASE FIRESTORE DATA HOOKUP EXAMPLE
  // ==========================================
  /*
  useEffect(() => {
    // Make sure we have authenticated user permissions
    if (!user) return;
    
    // Translate the activeMonth name (e.g. "Jan") to numerical index
    const monthIndex = MONTHS.indexOf(activeMonth);
    
    // Set up range boundary boundaries for transactions under activeYear
    const startOfMonth = new Date(activeYear, monthIndex, 1).toISOString();
    const endOfMonth = new Date(activeYear, monthIndex + 1, 0, 23, 59, 59).toISOString();

    // Query dynamically from Firestore filtering by date boundaries in activeYear
    const txCollectionRef = collection(db, "users", user.uid, "transactions");
    const q = query(
      txCollectionRef,
      where("date", ">=", startOfMonth),
      where("date", "<=", endOfMonth),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const monthTxList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Hook this list back up to your parent state setter:
      // setTransactions(monthTxList);
    }, (err) => {
      console.error("Firestore dynamic load failed for month: " + activeMonth + " in " + activeYear, err);
    });

    return () => unsubscribe();
  }, [activeMonth, activeYear, user]);
  */

  // Filter transactions for active month and selected active year
  const activeMonthIndex = MONTHS.indexOf(activeMonth);
  const activeMonthName = FULL_MONTH_NAMES[activeMonthIndex];
  
  const monthlyTx = transactions.filter(tx => {
    if (!tx.date) return false;
    const txDateObj = parseLocalDate(tx.date);
    return txDateObj.getMonth() === activeMonthIndex && txDateObj.getFullYear() === activeYear;
  }).sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date)); // sort descending by date (most recent first)

  /**
   * Returns the "week bucket" number for a given day-of-month:
   *   1-7  → week 1,  8-14 → week 2,  15-21 → week 3,  22-28 → week 4,  29+ → week 5
   */
  const getWeekBucket = (isoDate) => {
    if (!isoDate) return 0;
    const day = new Date(isoDate).getDate();
    return Math.ceil(day / 7);
  };

  /**
   * Render the monthly ledger rows, inserting a subtle week-break separator
   * row whenever consecutive transactions cross into a new week bucket.
   */
  const renderLedgerRows = () => {
    if (monthlyTx.length === 0) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: "center", fontStyle: "italic", padding: "30px", color: "rgba(32,30,28,0.5)" }}>
            No ledger records filed under {activeMonthName} {activeYear}.
          </td>
        </tr>
      );
    }

    const displayedTx = viewLimit === "All" ? monthlyTx : monthlyTx.slice(0, parseInt(viewLimit));

    const rows = [];
    let prevWeek = null;

    displayedTx.forEach((tx, idx) => {
      const thisWeek = getWeekBucket(tx.date);

      // Insert week-break separator when the week bucket changes (but not before the first row)
      if (prevWeek !== null && thisWeek !== prevWeek) {
        rows.push(
          <tr key={`week-break-${idx}`} aria-hidden="true">
            <td colSpan="4" style={{ padding: "8px 0" }}>
              <div className="perforation"></div>
            </td>
          </tr>
        );
      }

      prevWeek = thisWeek;

      rows.push(
        <tr 
          key={tx.id} 
          onClick={() => handleRowClick(tx)} 
          style={{ cursor: "pointer" }}
          title="Click to view details or edit/void transaction"
        >
          <td>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontWeight: "bold" }}>{tx.description}</span>
              <span style={{ fontSize: "9.5px", opacity: 0.5, fontFamily: "var(--font-ledger)" }}>
                {formatDateCompact(tx.date)}
              </span>
            </div>
          </td>
          <td>{tx.category}</td>
          <td style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.7 }}>{tx.type}</td>
          <td className="number-cell typewriter-num" style={{ color: tx.type === "Income" ? "var(--color-stamp-green)" : "inherit" }}>
            {tx.type === "Income" ? "+" : "-"}{formatValue(tx.amount)}
          </td>
        </tr>
      );
    });

    return rows;
  };

  // Calculate totals
  const totalIncome = monthlyTx
    .filter(tx => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const totalOutflows = monthlyTx
    .filter(tx => tx.type !== "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const remainingBalance = totalIncome - totalOutflows;

  const handleSubmitVoucher = (e) => {
    e.preventDefault();
    if (!txDesc.trim() || !txAmount || !txCategory) return;

    const newTx = {
      description: txDesc.trim(),
      amount: parseFloat(txAmount) || 0,
      category: txCategory,
      type: txType,
      date: txDate
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }

    setTxDesc("");
    setTxAmount("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 12 Horizontal Manila divider tabs */}
      <div className="budget-tabs-container">
        {MONTHS.map((m) => (
          <button
            key={m}
            className={`budget-month-tab ${activeMonth === m ? "active" : ""}`}
            onClick={() => setActiveMonth(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Main folder content ledger card */}
      <div className={`${styles.binderSheet} budget-ledger-sheet`}>
        {/* Skeuomorphic Ring-Binder Punch Holes */}
        <div className={styles.binderHoles} aria-hidden="true">
          <div className={styles.binderHole}></div>
          <div className={styles.binderHole}></div>
          <div className={styles.binderHole}></div>
        </div>
        {/* Header summary stamp card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-accent)", textTransform: "uppercase", fontSize: "16px", letterSpacing: "1.5px", margin: 0 }}>
              Monthly Budget
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-typewriter)", color: "rgba(32,30,28,0.6)" }}>
                BUDGET PERIOD:
              </span>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-typewriter)", color: "rgba(32,30,28,0.6)", fontWeight: "bold" }}>
                {activeMonthName.toUpperCase()} {activeYear}
              </span>
            </div>
          </div>
          
          <div className="stamp stamp-blue" style={{ transform: "rotate(-2deg)", fontSize: "10px" }}>
            LEDGER COMPLETED
          </div>
        </div>

        {/* Dynamic Financial Numbers Summary Grid */}
        <div className="metrics-row" style={{ marginBottom: "30px" }}>
          <div className="metric-stamp-card positive">
            <span className="metric-stamp-label">Total Monthly Income</span>
            <span className="metric-stamp-value typewriter-num">
              {formatValue(totalIncome)}
            </span>
          </div>

          <div className="metric-stamp-card negative">
            <span className="metric-stamp-label">Total Expenses & Bills</span>
            <span className="metric-stamp-value typewriter-num">
              {formatValue(totalOutflows)}
            </span>
          </div>

          <div className={`metric-stamp-card ${remainingBalance >= 0 ? "positive" : "negative"}`}>
            <span className="metric-stamp-label">Remaining Safe Buffer</span>
            <span className="metric-stamp-value typewriter-num">
              {formatValue(remainingBalance)}
            </span>
          </div>
        </div>

        {/* Categories budget limits tracking bars */}
        <div style={{ marginBottom: "35px" }}>
          <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>
            Spending Limits
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="overview-grid">
            {Object.keys(budgetLimits).map(cat => {
              const capLimit = budgetLimits[cat] || 0;
              if (capLimit === 0) return null;

              const actualSpent = monthlyTx
                .filter(tx => tx.category === cat)
                .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

              const percent = capLimit > 0 ? Math.round((actualSpent / capLimit) * 100) : 0;
              const isOver = actualSpent > capLimit;

              return (
                <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                    <span style={{ fontWeight: "bold" }}>{cat}</span>
                    <span className="typewriter-num" style={{ color: isOver ? "var(--color-stamp-red)" : "inherit" }}>
                      {formatValue(actualSpent)} / {formatValue(capLimit)} ({percent}%)
                    </span>
                  </div>
                  <div className="category-bar-bg" style={{ height: "8px" }}>
                    <div 
                      className="category-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, percent)}%`, 
                        height: "100%", 
                        backgroundColor: isOver ? "var(--color-stamp-red)" : "var(--color-stamp-green)",
                        transition: "width 0.3s ease" 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History ledger grid */}
        <div style={{ marginBottom: "35px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              Purchases & Bills
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-accent)", textTransform: "uppercase", opacity: 0.7 }}>Show Limit:</span>
              <select
                value={viewLimit}
                onChange={(e) => setViewLimit(e.target.value)}
                className="paper-select-recessed"
                style={{
                  padding: "4px 28px 4px 10px",
                  fontSize: "11px",
                  height: "26px",
                  fontFamily: "var(--font-sans)",
                  lineHeight: "1"
                }}
              >
                <option value="5">5 entries</option>
                <option value="10">10 entries</option>
                <option value="20">20 entries</option>
                <option value="50">50 entries</option>
                <option value="All">All entries</option>
              </select>
            </div>
          </div>
          <div className="ledger-table-container">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Description & Date</th>
                  <th style={{ width: "140px" }}>Category</th>
                  <th style={{ width: "100px" }}>Type</th>
                  <th className="number-cell" style={{ width: "130px" }}>Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {renderLedgerRows()}
              </tbody>
            </table>
          </div>
        </div>


      </div>

      {/* Retro Manila Custom Dialog Voucher Overlay */}
      {selectedTx && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(32, 30, 28, 0.45)",
          backdropFilter: "blur(3px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }} onClick={() => setSelectedTx(null)}>
          <div className="tactile-card" style={{
            width: "380px",
            backgroundColor: "var(--color-paper-light)",
            border: "3.5px solid var(--color-ink-dark)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
            padding: "26px",
            position: "relative",
            transform: "rotate(-1deg)",
            backgroundImage: "radial-gradient(var(--color-paper-grid) 1px, transparent 1px)",
            backgroundSize: "18px 18px"
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Skeuomorphic Stamp Box */}
            <span className={`stamp stamp-${isEditing ? (editType === "Income" ? "green" : (editType === "Bill" ? "blue" : "red")) : (selectedTx.type === "Income" ? "green" : (selectedTx.type === "Bill" ? "blue" : "red"))}`} style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "1px",
              transform: "rotate(8deg)",
              borderWidth: "2px",
              padding: "4px 8px"
            }}>
              {isEditing ? editType.toUpperCase() : selectedTx.type.toUpperCase()}
            </span>

            <div style={{
              fontFamily: "var(--font-accent)",
              fontSize: "13px",
              fontWeight: "bold",
              color: "var(--color-ink-dark)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              borderBottom: "2.5px solid var(--color-ink-dark)",
              paddingBottom: "8px",
              marginBottom: "18px"
            }}>
              {(isEditing && !isReadOnly) ? "Modify Voucher Details" : "Voucher Detail Audit"}
            </div>

            {(!isEditing || isReadOnly) ? (
              // READ-ONLY DETAIL VIEW
              <>
                <div style={{
                  fontFamily: "var(--font-typewriter)",
                  fontSize: "12px",
                  lineHeight: "1.7",
                  color: "var(--color-ink-dark)",
                  marginBottom: "24px"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "6px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>Date:</span>
                    <strong style={{ fontFamily: "var(--font-ledger)" }}>{formatDateCompact(selectedTx.date)}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "6px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>Description:</span>
                    <strong>{selectedTx.description}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "6px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>Category:</span>
                    <strong>{selectedTx.category}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "6px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>Voucher Class:</span>
                    <strong>{selectedTx.type}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "6px 0" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>Amount:</span>
                    <strong style={{ fontFamily: "var(--font-ledger)", color: selectedTx.type === "Income" ? "var(--color-stamp-green)" : "var(--color-stamp-red)", fontSize: "14px" }}>
                      {selectedTx.type === "Income" ? "+" : "-"}{formatValue(selectedTx.amount)}
                    </strong>
                  </div>
                </div>

                {!isReadOnly ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                    <button
                      onClick={() => {
                        if (onDeleteTransaction) {
                          onDeleteTransaction(selectedTx.id);
                        }
                        setSelectedTx(null);
                      }}
                      style={{
                        padding: "10px",
                        fontFamily: "var(--font-accent)",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "var(--color-stamp-red)",
                        backgroundColor: "transparent",
                        border: "2px dashed var(--color-stamp-red)",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      VOID VOUCHER
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: "10px",
                        fontFamily: "var(--font-accent)",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "var(--color-ink-blue)",
                        backgroundColor: "transparent",
                        border: "2px dashed var(--color-ink-blue)",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      EDIT DETAILS
                    </button>
                  </div>
                ) : (
                  <div 
                    className="stamp stamp-red" 
                    style={{ 
                      position: "relative", 
                      display: "block", 
                      textAlign: "center", 
                      margin: "5px auto 15px auto", 
                      fontSize: "10px", 
                      fontWeight: "900", 
                      letterSpacing: "1.5px", 
                      transform: "rotate(-2.5deg)", 
                      width: "fit-content",
                      padding: "5px 10px",
                      borderWidth: "2px",
                      backgroundColor: "rgba(158, 42, 43, 0.05)"
                    }}
                  >
                    [ ARCHIVED / SAFETY LOCK ]
                  </div>
                )}
                <button
                  onClick={() => setSelectedTx(null)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontFamily: "var(--font-accent)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--color-paper-light)",
                    backgroundColor: "var(--color-ink-dark)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                  }}
                >
                  RETAIN VOUCHER
                </button>
              </>
            ) : (
              // INLINE EDIT FORM VIEW
              <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>Description / Recipient</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required
                    className="form-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                      className="form-input typewriter-num"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>Voucher Class</label>
                    <select
                      value={editType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="paper-select-recessed form-input"
                      style={{ width: "100%", height: "38px" }}
                    >
                      <option value="Expense">Expense</option>
                      <option value="Bill">Bill</option>
                      <option value="Income">Income</option>
                      <option value="Debt">Debt</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      required
                      className="paper-select-recessed form-input"
                      style={{ width: "100%", height: "38px" }}
                    >
                      {(categories[editType] || []).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                      className="form-input"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: "10px",
                      fontFamily: "var(--font-accent)",
                      fontSize: "10px",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--color-stamp-red)",
                      backgroundColor: "transparent",
                      border: "2px dashed var(--color-stamp-red)",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px",
                      fontFamily: "var(--font-accent)",
                      fontSize: "10px",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--color-paper-light)",
                      backgroundColor: "var(--color-stamp-green)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    }}
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
