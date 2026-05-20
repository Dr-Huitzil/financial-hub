import React from "react";

/**
 * Dashboard Component
 * Contains three high-level skeuomorphic card containers:
 * 1. Cash Flow Summary: Income, Expenses, Bills, Debts, Savings, and Remaining Cash.
 * 2. 50/30/20 Budget Breakdown: Analysis of Essentials (Needs), Personal (Wants), and Reserve (Savings).
 * 3. Net Worth Tracker: Live asset and liability balancing sheet.
 * 
 * @param {Array} transactions - List of raw transaction vouchers
 * @param {Array} creditCards - Active credit card portfolio assets
 * @param {Array} goals - Registered savings milestones
 */
export default function Dashboard({ 
  transactions = [], 
  creditCards = [], 
  goals = [] 
}) {
  
  // ==========================================
  // DYNAMIC CALCULATIONS FROM REAL-TIME DATA
  // ==========================================
  
  // 1. Cash Flow totals
  const totalIncome = transactions
    .filter(tx => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const totalExpenses = transactions
    .filter(tx => tx.type === "Expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const totalBills = transactions
    .filter(tx => tx.type === "Bill")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const totalDebts = transactions
    .filter(tx => tx.type === "Debt")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const totalSavings = goals.reduce((sum, g) => sum + parseFloat(g.current || 0), 0);

  const totalOutflows = totalExpenses + totalBills + totalDebts;
  const remainingCash = totalIncome - totalOutflows;

  // 2. 50/30/20 Budgeting Rules
  // Needs: Bills + Debts
  // Wants: Expenses
  // Savings: Milestone Goals / Reserves
  const needsSpent = totalBills + totalDebts;
  const wantsSpent = totalExpenses;
  const savingsSpent = totalSavings;
  const grandTotalAllocation = needsSpent + wantsSpent + savingsSpent;

  const needsPercentage = grandTotalAllocation > 0 ? Math.round((needsSpent / grandTotalAllocation) * 100) : 0;
  const wantsPercentage = grandTotalAllocation > 0 ? Math.round((wantsSpent / grandTotalAllocation) * 100) : 0;
  const savingsPercentage = grandTotalAllocation > 0 ? Math.round((savingsSpent / grandTotalAllocation) * 100) : 0;

  // 3. Net Worth Tracking
  // Assets: Net remaining safe cash + cumulative registered goals balances
  const totalAssets = Math.max(0, remainingCash) + totalSavings;
  // Liabilities: Sum of all credit card debts
  const totalLiabilities = creditCards.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* Overview Card Header */}
      <div className="tactile-card" style={{ border: "2px solid var(--color-ink-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-accent)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Annual Treasury Dashboard & Macro Ledger
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "rgba(32,30,28,0.7)", fontFamily: "var(--font-sans)" }}>
            Authorized comptroller audit overview. High-level liquidity summaries, target metrics, and total portfolio valuation.
          </p>
        </div>
        <span className="stamp stamp-blue" style={{ transform: "rotate(-3deg)", fontSize: "9px" }}>
          MACRO RECONCILED
        </span>
      </div>

      {/* CARD 1: Cash Flow Summary */}
      <div className="tactile-card">
        <div className="card-title">
          <span>Cash Flow Summary Sheet</span>
          <span className="stamp stamp-green" style={{ fontSize: "8px", transform: "rotate(1deg)" }}>LIQUIDITY</span>
        </div>

        <p style={{ fontSize: "12.5px", color: "rgba(32,30,28,0.75)", marginBottom: "20px", fontFamily: "var(--font-sans)" }}>
          Summary ledger containing dynamic aggregated records of all incoming and outgoing capital flows.
        </p>

        <div className="metrics-row" style={{ marginBottom: "20px" }}>
          <div className="metric-stamp-card positive">
            <span className="metric-stamp-label">Total Revenue (Income)</span>
            <span className="metric-stamp-value typewriter-num">
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="metric-stamp-card negative">
            <span className="metric-stamp-label">Total Outflows (Debits)</span>
            <span className="metric-stamp-value typewriter-num">
              ${totalOutflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`metric-stamp-card ${remainingCash >= 0 ? "positive" : "negative"}`}>
            <span className="metric-stamp-label">Net Remaining Balance</span>
            <span className="metric-stamp-value typewriter-num">
              ${remainingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <div className="ledger-text-row">
            <span className="ledger-label">Primary Wages & Revenue</span>
            <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-green)" }}>
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="ledger-text-row">
            <span className="ledger-label">Discretionary Spending (Expenses)</span>
            <span className="ledger-value typewriter-num">
              -${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="ledger-text-row">
            <span className="ledger-label">Scheduled Fixed Costs (Bills)</span>
            <span className="ledger-value typewriter-num">
              -${totalBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="ledger-text-row">
            <span className="ledger-label">Debt Obligations Settled (Debts)</span>
            <span className="ledger-value typewriter-num">
              -${totalDebts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: 50/30/20 Budget Breakdown */}
      <div className="tactile-card">
        <div className="card-title">
          <span>50/30/20 Allocation Analysis</span>
          <span className="barcode-text" style={{ fontSize: "9px" }}>LEDGER-ID: 50-30-20</span>
        </div>

        <p style={{ fontSize: "12.5px", color: "rgba(32,30,28,0.75)", marginBottom: "20px", fontFamily: "var(--font-sans)" }}>
          Tracks your spending allocation ratios against the classic 50/30/20 rule (50% Essentials, 30% Wants, 20% Reserves).
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Needs: Bills & Debts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <strong>Essentials & Obligations (Needs — Target: 50%)</strong>
              <span className="typewriter-num">
                ${needsSpent.toLocaleString()} ({needsPercentage}%)
              </span>
            </div>
            <div className="category-bar-bg" style={{ height: "12px", borderRadius: "6px" }}>
              <div 
                className="category-bar-fill" 
                style={{ 
                  width: `${Math.min(100, needsPercentage)}%`, 
                  height: "100%", 
                  backgroundColor: "#1e3a8a", // Deep blue
                  borderRadius: "6px",
                  transition: "width 0.3s ease" 
                }} 
              />
            </div>
          </div>

          {/* Wants: Expenses */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <strong>Personal & Discretionary (Wants — Target: 30%)</strong>
              <span className="typewriter-num">
                ${wantsSpent.toLocaleString()} ({wantsPercentage}%)
              </span>
            </div>
            <div className="category-bar-bg" style={{ height: "12px", borderRadius: "6px" }}>
              <div 
                className="category-bar-fill" 
                style={{ 
                  width: `${Math.min(100, wantsPercentage)}%`, 
                  height: "100%", 
                  backgroundColor: "#b45309", // Amber
                  borderRadius: "6px",
                  transition: "width 0.3s ease" 
                }} 
              />
            </div>
          </div>

          {/* Savings: Goals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <strong>Milestone & Reserve Allocations (Savings — Target: 20%)</strong>
              <span className="typewriter-num">
                ${savingsSpent.toLocaleString()} ({savingsPercentage}%)
              </span>
            </div>
            <div className="category-bar-bg" style={{ height: "12px", borderRadius: "6px" }}>
              <div 
                className="category-bar-fill" 
                style={{ 
                  width: `${Math.min(100, savingsPercentage)}%`, 
                  height: "100%", 
                  backgroundColor: "var(--color-stamp-green)",
                  borderRadius: "6px",
                  transition: "width 0.3s ease" 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Net Worth Tracker */}
      <div className="tactile-card">
        <div className="card-title">
          <span>Total Asset & Liability Registry</span>
          <span className="stamp stamp-red" style={{ fontSize: "8px", transform: "rotate(-1.5deg)" }}>AUDIT BALANCE</span>
        </div>

        <p style={{ fontSize: "12.5px", color: "rgba(32,30,28,0.75)", marginBottom: "20px", fontFamily: "var(--font-sans)" }}>
          Aggregated valuation balancing assets (liquid cash + milestone savings) against liabilities (total credit card balances).
        </p>

        <div className="metrics-row" style={{ marginBottom: "20px" }}>
          <div className="metric-stamp-card positive">
            <span className="metric-stamp-label">Registered Assets</span>
            <span className="metric-stamp-value typewriter-num">
              ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="metric-stamp-card negative">
            <span className="metric-stamp-label">Active Liabilities</span>
            <span className="metric-stamp-value typewriter-num">
              -${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`metric-stamp-card ${netWorth >= 0 ? "positive" : "negative"}`}>
            <span className="metric-stamp-label">Audit Net Worth Valuation</span>
            <span className="metric-stamp-value typewriter-num">
              ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontFamily: "var(--font-accent)", fontSize: "10px", textTransform: "uppercase", margin: "10px 0 5px 0", color: "rgba(32,30,28,0.6)" }}>
            Assets breakdown
          </h4>
          <div className="ledger-text-row">
            <span className="ledger-label">Safe Liquid Cash Buffer</span>
            <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-green)" }}>
              ${Math.max(0, remainingCash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="ledger-text-row">
            <span className="ledger-label">Cumulative Savings Milestones</span>
            <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-green)" }}>
              ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <h4 style={{ fontFamily: "var(--font-accent)", fontSize: "10px", textTransform: "uppercase", margin: "15px 0 5px 0", color: "rgba(32,30,28,0.6)" }}>
            Liabilities breakdown
          </h4>
          {creditCards.map(card => (
            <div className="ledger-text-row" key={card.id}>
              <span className="ledger-label">{card.name} Outstanding Balance</span>
              <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-red)" }}>
                -${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          {creditCards.length === 0 && (
            <span style={{ fontSize: "11px", fontStyle: "italic", opacity: 0.5 }}>
              No liabilities registered.
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
