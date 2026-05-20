import React, { useState, useEffect } from "react";

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
export default function BudgetFolder({ 
  transactions = [], 
  budgetLimits = {}, 
  categories = {}, 
  onAddTransaction,
  onDeleteTransaction 
}) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const currentMonthIndex = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(MONTHS[currentMonthIndex]);

  // Form states for new transaction voucher
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txType, setTxType] = useState("Expense");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  // ==========================================
  // FIREBASE FIRESTORE DATA HOOKUP EXAMPLE
  // ==========================================
  /*
  useEffect(() => {
    // Make sure we have authenticated user permissions
    if (!user) return;
    
    // Translate the activeMonth name (e.g. "Jan") to numerical index
    const monthIndex = MONTHS.indexOf(activeMonth);
    const currentYear = new Date().getFullYear();
    
    // Set up range boundary boundaries for transactions
    const startOfMonth = new Date(currentYear, monthIndex, 1).toISOString();
    const endOfMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59).toISOString();

    // Query dynamically from Firestore
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
      console.error("Firestore dynamic load failed for month: " + activeMonth, err);
    });

    return () => unsubscribe();
  }, [activeMonth, user]);
  */

  // Filter transactions for active month
  const activeMonthIndex = MONTHS.indexOf(activeMonth);
  const activeMonthName = FULL_MONTH_NAMES[activeMonthIndex];
  
  const monthlyTx = transactions.filter(tx => {
    if (!tx.date) return false;
    const txDateObj = new Date(tx.date);
    return txDateObj.getMonth() === activeMonthIndex;
  }).sort((a, b) => new Date(a.date) - new Date(b.date)); // sort ascending by date

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
          <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic", padding: "30px", color: "rgba(32,30,28,0.5)" }}>
            No ledger records filed under {activeMonthName} 2026.
          </td>
        </tr>
      );
    }

    const rows = [];
    let prevWeek = null;

    monthlyTx.forEach((tx, idx) => {
      const thisWeek = getWeekBucket(tx.date);

      // Insert week-break separator when the week bucket changes (but not before the first row)
      if (prevWeek !== null && thisWeek !== prevWeek) {
        rows.push(
          <tr key={`week-break-${idx}`} aria-hidden="true">
            <td
              colSpan="6"
              style={{
                padding: 0,
                borderBottom: "2px dashed #b5a98a",
                backgroundColor: "rgba(181,169,138,0.07)",
                height: "4px",
              }}
            />
          </tr>
        );
      }

      prevWeek = thisWeek;

      rows.push(
        <tr key={tx.id}>
          <td className="typewriter-num">{tx.date}</td>
          <td style={{ fontWeight: "bold" }}>{tx.description}</td>
          <td>{tx.category}</td>
          <td style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.7 }}>{tx.type}</td>
          <td className="number-cell typewriter-num" style={{ color: tx.type === "Income" ? "var(--color-stamp-green)" : "inherit" }}>
            {tx.type === "Income" ? "+" : "-"}${parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
          <td style={{ textAlign: "center" }}>
            <button
              onClick={() => onDeleteTransaction && onDeleteTransaction(tx.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-stamp-red)",
                cursor: "pointer",
                fontFamily: "var(--font-typewriter)",
                fontSize: "11px",
                fontWeight: "bold"
              }}
            >
              [VOID]
            </button>
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
      <div className="budget-ledger-sheet">
        {/* Header summary stamp card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-accent)", textTransform: "uppercase", fontSize: "16px", letterSpacing: "1.5px", margin: 0 }}>
              Monthly Ledger Ledger Sheet
            </h2>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-typewriter)", color: "rgba(32,30,28,0.6)" }}>
              FILING LEDGER PERIOD: {activeMonthName.toUpperCase()} 2026
            </span>
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
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="metric-stamp-card negative">
            <span className="metric-stamp-label">Total Expenses & Bills</span>
            <span className="metric-stamp-value typewriter-num">
              ${totalOutflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`metric-stamp-card ${remainingBalance >= 0 ? "positive" : "negative"}`}>
            <span className="metric-stamp-label">Remaining Safe Buffer</span>
            <span className="metric-stamp-value typewriter-num">
              ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Categories budget limits tracking bars */}
        <div style={{ marginBottom: "35px" }}>
          <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>
            Monthly Caps Allocation Progress
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="overview-grid">
            {Object.keys(budgetLimits).map(cat => {
              const capLimit = budgetLimits[cat] || 0;
              if (capLimit === 0) return null;

              const actualSpent = monthlyTx
                .filter(tx => tx.category === cat)
                .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

              const percent = Math.min(100, capLimit > 0 ? Math.round((actualSpent / capLimit) * 100) : 0);
              const isOver = actualSpent > capLimit;

              return (
                <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                    <span style={{ fontWeight: "bold" }}>{cat}</span>
                    <span className="typewriter-num" style={{ color: isOver ? "var(--color-stamp-red)" : "inherit" }}>
                      ${actualSpent.toLocaleString()} / ${capLimit.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="category-bar-bg" style={{ height: "8px" }}>
                    <div 
                      className="category-bar-fill" 
                      style={{ 
                        width: `${percent}%`, 
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
          <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            Monthly Ledger Transactions Registry
          </h3>
          <div className="ledger-table-container">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th style={{ width: "110px" }}>Date</th>
                  <th>Description</th>
                  <th style={{ width: "130px" }}>Category</th>
                  <th style={{ width: "100px" }}>Type</th>
                  <th className="number-cell" style={{ width: "120px" }}>Amount ($)</th>
                  <th style={{ textAlign: "center", width: "80px" }}>Voucher</th>
                </tr>
              </thead>
              <tbody>
                {renderLedgerRows()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher dynamic entry form */}
        <form onSubmit={handleSubmitVoucher} style={{ borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "25px" }}>
          <h4 style={{ fontFamily: "var(--font-accent)", fontSize: "11px", textTransform: "uppercase", color: "rgba(32,30,28,0.6)", marginBottom: "15px", marginTop: 0 }}>
            Authorize New Transaction Voucher
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", marginBottom: "15px" }} className="overview-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "9px", fontWeight: "bold" }}>Voucher Description</label>
              <input
                type="text"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="e.g. Costco Wholesale..."
                required
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12.5px"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "9px", fontWeight: "bold" }}>Amount ($)</label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12.5px",
                  fontFamily: "var(--font-ledger)"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "9px", fontWeight: "bold" }}>Category</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                required
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12.5px"
                }}
              >
                <option value="">-- Select --</option>
                {Object.keys(categories).map(type => (
                  <optgroup label={`${type}s`} key={type}>
                    {categories[type].map(cat => (
                      <option value={cat} key={cat}>{cat}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "9px", fontWeight: "bold" }}>Voucher Type</label>
              <select
                value={txType}
                onChange={(e) => {
                  setTxType(e.target.value);
                  // Auto pick first category of that type if available
                  const options = categories[e.target.value] || [];
                  if (options.length > 0) setTxCategory(options[0]);
                }}
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12.5px"
                }}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Bill">Bill</option>
                <option value="Debt">Debt</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "9px", fontWeight: "bold" }}>Date of Record</label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
                style={{
                  padding: "6px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12.5px",
                  fontFamily: "var(--font-ledger)"
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginLeft: "auto",
                alignSelf: "flex-end",
                padding: "9px 24px",
                fontFamily: "var(--font-accent)",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: "var(--color-paper-light)",
                backgroundColor: "var(--color-stamp-green)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
              }}
            >
              Post Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
