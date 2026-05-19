import React, { useState } from "react";

export default function BudgetTab({ 
  monthlyBudgets, 
  annualRunningBalance, 
  categoryBreakdown,
  transactions = [],
  budgetLimits = {}
}) {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [progressSearchTerm, setProgressSearchTerm] = useState("");
  const [progressSelectedType, setProgressSelectedType] = useState("All");

  const filteredBudgets = selectedMonth === "All" 
    ? monthlyBudgets 
    : monthlyBudgets.filter(b => b.month === selectedMonth);

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // 1. Get all unique active outflow categories (excluding Income)
  const categoryTypes = {};
  transactions.forEach(tx => {
    if (tx.category && tx.type !== "Income") {
      categoryTypes[tx.category] = tx.type; // Bill, Debt, or Expense
    }
  });

  const allOutflowCategories = Array.from(
    new Set([
      ...transactions.filter(tx => tx.type !== "Income" && tx.category).map(tx => tx.category),
      ...Object.keys(budgetLimits).filter(cat => budgetLimits[cat] > 0)
    ])
  ).sort();

  // Calculate actual and limit for each category in selected period
  const categoryProgressData = allOutflowCategories.map(cat => {
    const type = categoryTypes[cat] || "Expense";

    // Period actual
    const activeTx = transactions.filter(tx => {
      if (tx.type === "Income") return false;
      if (tx.category !== cat) return false;
      if (selectedMonth === "All") return true;
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      return MONTH_NAMES[txDate.getMonth()] === selectedMonth;
    });
    const actualSpent = activeTx.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    // Period limit
    let limit = budgetLimits[cat] || 0;
    if (selectedMonth === "All") {
      limit = limit * 12;
    }

    return {
      category: cat,
      type,
      actual: Math.round(actualSpent * 100) / 100,
      limit
    };
  })
  .filter(c => c.limit > 0 || c.actual > 0) // Only show budgeted categories or categories with actual spending
  .filter(c => {
    const matchesSearch = c.category.toLowerCase().includes(progressSearchTerm.toLowerCase());
    const matchesType = progressSelectedType === "All" || c.type === progressSelectedType;
    return matchesSearch && matchesType;
  })
  .sort((a, b) => {
    return b.actual - a.actual;
  });

  // Calculate summary actual & limit for health card
  const unfilteredPeriodProgress = allOutflowCategories.map(cat => {
    const type = categoryTypes[cat] || "Expense";
    const activeTx = transactions.filter(tx => {
      if (tx.type === "Income") return false;
      if (tx.category !== cat) return false;
      if (selectedMonth === "All") return true;
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      return MONTH_NAMES[txDate.getMonth()] === selectedMonth;
    });
    const actualSpent = activeTx.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    let limit = budgetLimits[cat] || 0;
    if (selectedMonth === "All") {
      limit = limit * 12;
    }
    return { type, actual: actualSpent, limit };
  });

  const totalBudgetedPeriod = unfilteredPeriodProgress
    .filter(c => progressSelectedType === "All" || c.type === progressSelectedType)
    .reduce((sum, c) => sum + c.limit, 0);

  const totalActualPeriod = unfilteredPeriodProgress
    .filter(c => progressSelectedType === "All" || c.type === progressSelectedType)
    .reduce((sum, c) => sum + c.actual, 0);

  const remainingBufferPeriod = totalBudgetedPeriod - totalActualPeriod;

  // Totals calculations
  const totalIncome = monthlyBudgets.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpenses = monthlyBudgets.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalBills = monthlyBudgets.reduce((acc, curr) => acc + curr.bills, 0);
  const totalDebts = monthlyBudgets.reduce((acc, curr) => acc + curr.debts, 0);
  const totalSavings = monthlyBudgets.reduce((acc, curr) => acc + curr.savings, 0);

  const totalSpending = totalExpenses + totalBills + totalDebts + totalSavings;
  const totalRemaining = totalIncome - totalSpending;

  // --- Chart 1: Annual Balance Line Chart (using annualRunningBalance) ---
  const abSvgWidth = 900;
  const abSvgHeight = 160;
  const abPadX = 50;
  const abPadY = 20;

  const abBalances = (annualRunningBalance || []).map(d => d.balance);
  const abMinBal = Math.min(...(abBalances.length ? abBalances : [0]));
  const abMaxBal = Math.max(...(abBalances.length ? abBalances : [1000]));
  const abYRange = Math.max(1, abMaxBal - abMinBal);

  const abPoints = (annualRunningBalance || []).map((d, index) => {
    const x = abPadX + (index / Math.max(1, annualRunningBalance.length - 1)) * (abSvgWidth - abPadX * 2);
    const y = abSvgHeight - abPadY - ((d.balance - abMinBal) / abYRange) * (abSvgHeight - abPadY * 2);
    return { x, y, label: d.label, val: d.balance };
  });

  const abPathD = abPoints.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // --- Chart 2: Income vs Spending Multi-Line Chart (using monthlyBudgets) ---
  const msSvgWidth = 500;
  const msSvgHeight = 220;
  const msPadX = 40;
  const msPadY = 20;

  const populatedMonths = monthlyBudgets.filter(b => b.income > 0 || b.expenses > 0);
  const allMonthlyVals = populatedMonths.flatMap(b => [b.income, b.expenses, b.bills, b.debts, b.savings]);
  const msMaxVal = Math.max(...(allMonthlyVals.length ? allMonthlyVals : [1000])) * 1.1;

  const msLines = {
    income: { color: "var(--color-stamp-green)", data: [] },
    expenses: { color: "var(--color-ink-blue)", data: [] },
    bills: { color: "var(--color-stamp-red)", data: [] },
    debts: { color: "#b45309", data: [] }, // amber
  };

  populatedMonths.forEach((b, index) => {
    const x = msPadX + (index / Math.max(1, populatedMonths.length - 1)) * (msSvgWidth - msPadX * 2);
    const getY = (val) => msSvgHeight - msPadY - (val / Math.max(1, msMaxVal)) * (msSvgHeight - msPadY * 2);
    
    msLines.income.data.push({ x, y: getY(b.income), month: b.month.substring(0,3) });
    msLines.expenses.data.push({ x, y: getY(b.expenses) });
    msLines.bills.data.push({ x, y: getY(b.bills) });
    msLines.debts.data.push({ x, y: getY(b.debts) });
  });

  // --- Chart 3: High-Level Budget Allocation Donut (using master categories) ---
  const donutSize = 200;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const center = donutSize / 2;
  
  // Calculate dynamic selected month or annual macro ratios
  let activeIncome = totalIncome;
  let activeExpenses = totalExpenses;
  let activeBills = totalBills;
  let activeDebts = totalDebts;
  let activeSavings = totalSavings;

  if (selectedMonth !== "All") {
    const activeMonthData = monthlyBudgets.find(b => b.month === selectedMonth);
    if (activeMonthData) {
      activeIncome = activeMonthData.income;
      activeExpenses = activeMonthData.expenses;
      activeBills = activeMonthData.bills;
      activeDebts = activeMonthData.debts;
      activeSavings = activeMonthData.savings;
    }
  }

  const activeSpending = activeExpenses + activeBills + activeDebts + activeSavings;
  const activeRemaining = activeIncome > activeSpending ? activeIncome - activeSpending : 0;
  const activeTotal = activeSpending + activeRemaining;

  const macroBreakdown = [
    { name: "Expenses", value: activeExpenses, color: "#1e3a8a" }, // Ink Blue
    { name: "Bills", value: activeBills, color: "#0f766e" },       // Teal
    { name: "Debts Paid", value: activeDebts, color: "#b45309" },  // Amber/Gold
    { name: "Savings", value: activeSavings, color: "#047857" },   // Emerald
    { name: "Remaining Cash", value: activeRemaining, color: "#9f1239" } // Deep Crimson
  ].map(item => {
    const pct = activeTotal > 0 ? (item.value / activeTotal) * 100 : 0;
    return {
      ...item,
      percentage: Math.round(pct * 10) / 10
    };
  }).filter(item => item.value > 0);

  let accumulatedPercentage = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* 1. Annual Balance Trend (Full Width) */}
      <div className="tactile-card" style={{ width: "100%", overflowX: "auto" }}>
        <div className="card-title">
          <span>Annual Balance Trend</span>
          <span className="barcode-text" style={{ fontSize: '9px' }}>CHART-NO: 2026-F-BAL</span>
        </div>
        
        <div className="chart-wrapper" style={{ minWidth: "700px" }}>
          <svg viewBox={`0 0 ${abSvgWidth} ${abSvgHeight}`} className="chart-svg">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = abPadY + ratio * (abSvgHeight - abPadY * 2);
              const val = abMaxBal - ratio * abYRange;
              return (
                <g key={`ab-grid-${idx}`}>
                  <line x1={abPadX} y1={y} x2={abSvgWidth - abPadX} y2={y} stroke="var(--color-paper-grid)" strokeDasharray="3,3" />
                  <text x={abPadX - 8} y={y + 3} textAnchor="end" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                    ${Math.round(val / 1000)}k
                  </text>
                </g>
              );
            })}
            
            <line x1={abPadX} y1={abSvgHeight - abPadY} x2={abSvgWidth - abPadX} y2={abSvgHeight - abPadY} stroke="var(--color-ink-dark)" strokeWidth="1" />
            
            {abPoints.length > 0 && (
              <path d={abPathD} fill="none" stroke="var(--color-ink-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* X-Axis Labels (Sampled) */}
            {abPoints.filter((_, i) => i % Math.max(1, Math.floor(abPoints.length / 12)) === 0).map((p, idx) => (
              <text key={idx} x={p.x} y={abSvgHeight - 5} textAnchor="middle" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                {p.label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* 2. Side-by-Side Charts (Multi-Line & Donut) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px" }} className="overview-grid">
        
        {/* Income vs Spending Multi-Line Chart */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Income vs Spending</span>
            <span className="stamp stamp-red" style={{ fontSize: '9px', transform: 'rotate(2deg)' }}>Multi-Axis</span>
          </div>

          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${msSvgWidth} ${msSvgHeight}`} className="chart-svg">
              {/* Grid Lines */}
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = msPadY + ratio * (msSvgHeight - msPadY * 2);
                const val = msMaxVal - ratio * msMaxVal;
                return (
                  <g key={`ms-grid-${idx}`}>
                    <line x1={msPadX} y1={y} x2={msSvgWidth - msPadX} y2={y} stroke="var(--color-paper-grid)" strokeDasharray="3,3" />
                    <text x={msPadX - 8} y={y + 3} textAnchor="end" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                      ${Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              <line x1={msPadX} y1={msSvgHeight - msPadY} x2={msSvgWidth - msPadX} y2={msSvgHeight - msPadY} stroke="var(--color-ink-dark)" strokeWidth="1" />

              {/* Draw Paths */}
              {Object.keys(msLines).map(key => {
                const line = msLines[key];
                if (line.data.length === 0) return null;
                const pathStr = line.data.reduce((acc, p, index) => index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
                return <path key={key} d={pathStr} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
              })}

              {/* X-Axis Labels */}
              {msLines.income.data.map((p, idx) => (
                <text key={`ms-x-${idx}`} x={p.x} y={msSvgHeight - 5} textAnchor="middle" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                  {p.month}
                </text>
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px', fontSize: '10px', fontFamily: 'var(--font-accent)', textTransform: 'uppercase', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: msLines.income.color }}></span> Income
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: msLines.expenses.color }}></span> Expenses
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: msLines.bills.color }}></span> Bills
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: msLines.debts.color }}></span> Debts
            </div>
          </div>
        </div>

        {/* Budget Allocation Donut */}
        <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="card-title" style={{ width: '100%' }}>
            <span>Budget Allocation Ratio</span>
            <span className="stamp stamp-blue" style={{ fontSize: '9px', transform: 'rotate(2deg)' }}>Macro Split</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <svg width={donutSize} height={donutSize} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-manila-dark)" strokeWidth="15" />
              {macroBreakdown.map((c) => {
                const strokeDashoffset = circumference - (c.percentage / 100) * circumference;
                const strokeRotation = (accumulatedPercentage / 100) * 360;
                accumulatedPercentage += c.percentage;

                return (
                  <circle 
                    key={c.name}
                    cx={center} cy={center} r={radius} fill="none" 
                    stroke={c.color} 
                    strokeWidth="15"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transformOrigin: '50% 50%', transform: `rotate(${strokeRotation}deg)`, transition: 'all 0.3s ease' }}
                  />
                );
              })}
              
              <g style={{ transform: `rotate(90deg) translate(0px, 0px)`, transformOrigin: '50% 50%' }}>
                <text x={center} y={center - 5} textAnchor="middle" fontFamily="var(--font-accent)" fontSize="10px" fontWeight="bold" fill="rgba(32,30,28,0.6)">
                  {selectedMonth === "All" ? "ANNUAL" : selectedMonth.substring(0,3).toUpperCase()}
                </text>
                <text x={center} y={center + 10} textAnchor="middle" fontFamily="var(--font-ledger)" fontSize="11px" fontWeight="bold" fill="var(--color-ink-dark)">
                  ${activeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
              </g>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', fontSize: '10px', fontFamily: 'var(--font-accent)', textTransform: 'uppercase' }}>
            {macroBreakdown.map((c) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(32,30,28,0.08)', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ minWidth: '8px', height: '8px', backgroundColor: c.color }}></span> 
                  {c.name}
                </div>
                <strong>{c.percentage}% (${c.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Planned vs. Actual Target Limits Progress Dashboard */}
      <div className="tactile-card" style={{ width: "100%" }}>
        <div className="card-title">
          <span>Planned vs. Actual Category Progress Ledger</span>
          <span className="stamp stamp-red" style={{ fontSize: "8px", transform: "rotate(-1.5deg)" }}>
            {selectedMonth === "All" ? "ANNUAL TARGETS" : `${selectedMonth.toUpperCase()} TARGETS`}
          </span>
        </div>

        <p style={{ fontSize: "12.5px", color: "rgba(32,30,28,0.75)", marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
          Tracks your actual monthly (or annual cumulative) transaction spending against the custom target limits established in the <strong>Setup Panel</strong>.
        </p>

        {/* 1. Overall Target Budget Health Bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
          padding: "15px",
          backgroundColor: "rgba(32,30,28,0.02)",
          border: "1px dashed var(--color-paper-grid)",
          borderRadius: "6px",
          marginBottom: "20px",
          fontFamily: "var(--font-accent)",
          textTransform: "uppercase"
        }}>
          <div>
            <span style={{ fontSize: "9px", opacity: 0.6, display: "block", marginBottom: "4px" }}>Total Budgeted Limit</span>
            <strong style={{ fontSize: "16px", color: "var(--color-ink-dark)", fontFamily: "var(--font-ledger)" }}>
              ${totalBudgetedPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "9px", opacity: 0.6, display: "block", marginBottom: "4px" }}>Total Actual Spending</span>
            <strong style={{ fontSize: "16px", color: totalActualPeriod > totalBudgetedPeriod ? "var(--color-stamp-red)" : "var(--color-ink-blue)", fontFamily: "var(--font-ledger)" }}>
              ${totalActualPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "9px", opacity: 0.6, display: "block", marginBottom: "4px" }}>Remaining Buffer</span>
            <strong style={{ 
              fontSize: "16px", 
              color: remainingBufferPeriod < 0 ? "var(--color-stamp-red)" : "var(--color-stamp-green)", 
              fontFamily: "var(--font-ledger)" 
            }}>
              {remainingBufferPeriod < 0 ? "-" : ""}${Math.abs(remainingBufferPeriod).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {remainingBufferPeriod < 0 && <span style={{ fontSize: "9px", display: "block", color: "var(--color-stamp-red)" }}>OVER BUDGET!</span>}
            </strong>
          </div>
        </div>

        {/* 2. List filters and search bar */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px" }} className="sub-tabs-strip">
            {["All", "Expense", "Bill", "Debt"].map((type) => (
              <button
                key={type}
                className={`sub-tab-btn ${progressSelectedType === type ? "active" : ""}`}
                onClick={() => setProgressSelectedType(type)}
                style={{ marginBottom: 0 }}
              >
                {type === "All" ? "All Targets" : `${type}s`}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search progress categories..."
            value={progressSearchTerm}
            onChange={(e) => setProgressSearchTerm(e.target.value)}
            style={{
              padding: "6px 12px",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              border: "1px solid var(--color-paper-grid)",
              borderRadius: "4px",
              backgroundColor: "var(--color-paper-light)",
              minWidth: "250px",
              marginLeft: "auto"
            }}
          />
        </div>

        {/* 3. Category Progress Bars List */}
        <div className="category-progress-list" style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "350px", overflowY: "auto", paddingRight: "6px" }}>
          {categoryProgressData.map((c) => {
            const utilization = c.limit > 0 ? Math.round((c.actual / c.limit) * 100) : 0;
            const isOver = c.actual > c.limit;
            
            // Color scheme based on status
            let barColor = "var(--color-stamp-green)"; // Safe
            if (isOver) {
              barColor = "var(--color-stamp-red)"; // Exceeded
            } else if (utilization >= 75) {
              barColor = "#b45309"; // Approaching limit (amber)
            }

            return (
              <div key={c.category} style={{ borderBottom: "1px dashed rgba(32,30,28,0.06)", paddingBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                  <div>
                    <span style={{ fontSize: "12.5px", fontWeight: "bold", fontFamily: "var(--font-sans)" }}>{c.category}</span>
                    <span style={{ fontSize: "9.5px", opacity: 0.5, marginLeft: "6px", textTransform: "uppercase" }}>({c.type})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontFamily: "var(--font-ledger)" }}>
                    <span>
                      <strong>${c.actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> spent 
                      / <strong>${c.limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> limit
                    </span>
                    {c.limit > 0 ? (
                      <span style={{
                        fontWeight: "bold",
                        color: barColor,
                        backgroundColor: "rgba(32,30,28,0.02)",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        border: `1px solid ${barColor}33`
                      }}>
                        {utilization}%
                      </span>
                    ) : (
                      <span style={{ fontWeight: "bold", color: "var(--color-stamp-red)", backgroundColor: "rgba(158, 42, 43, 0.08)", padding: "1px 5px", borderRadius: "3px", border: "1px solid var(--color-stamp-red)33" }}>
                        UNBUDGETED
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar tracks */}
                <div style={{ height: "10px", backgroundColor: "var(--color-manila-dark)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                  <div 
                    style={{ 
                      width: `${c.limit > 0 ? Math.min(100, (c.actual / c.limit) * 100) : 100}%`, 
                      backgroundColor: barColor,
                      transition: "width 0.3s ease",
                      height: "100%"
                    }} 
                  />
                </div>

                {isOver && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "3px" }}>
                    <span style={{
                      fontSize: "9px",
                      fontFamily: "var(--font-typewriter)",
                      color: "var(--color-stamp-red)",
                      fontWeight: "bold"
                    }}>
                      ⚠️ [ WARNING: OVER BUDGET BY ${(c.actual - c.limit).toLocaleString(undefined, { minimumFractionDigits: 2 })}! ]
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {categoryProgressData.length === 0 && (
            <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "12.5px", margin: "40px 0", color: "rgba(32,30,28,0.5)" }}>
              No categories match the criteria for the chosen filters.
            </p>
          )}
        </div>
      </div>

      {/* 3. Ledger Archives Month Selector */}
      <div className="tactile-card" style={{ marginBottom: "-15px" }}>
        <div className="card-title">
          <span>Ledger Archives</span>
          <div className="barcode-stamp">
            <div className="barcode-stripes" style={{ width: '80px', height: '16px' }}></div>
            <span className="barcode-text" style={{ fontSize: '8px' }}>ARCH-2026</span>
          </div>
        </div>
        
        <div className="sub-tabs-strip">
          <button className={`sub-tab-btn ${selectedMonth === "All" ? "active" : ""}`} onClick={() => setSelectedMonth("All")}>
            Annual Overview
          </button>
          {monthlyBudgets.map(b => (
            <button key={b.month} className={`sub-tab-btn ${selectedMonth === b.month ? "active" : ""}`} onClick={() => setSelectedMonth(b.month)}>
              {b.month.substring(0,3)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Budget Spreadsheet Grid */}
      <div className="tactile-card">
        <div className="card-title">
          <span>Excel Replica Ledger Grid</span>
          <span className="barcode-text" style={{ fontSize: '8px' }}>GRID-ID: XLSX-2026</span>
        </div>

        <div className="ledger-table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="number-cell">Income</th>
                <th className="number-cell">Expenses</th>
                <th className="number-cell">Bills</th>
                <th className="number-cell">Debts Paid</th>
                <th className="number-cell">Savings</th>
                <th className="number-cell">Remaining Cash</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map((b) => {
                const monthSpending = b.expenses + b.bills + b.debts + b.savings;
                const monthRemaining = b.income - monthSpending;
                return (
                  <tr key={b.month}>
                    <td style={{ fontWeight: 'bold' }}>{b.month}</td>
                    <td className="number-cell" style={{ color: b.income > 0 ? 'var(--color-stamp-green)' : 'inherit' }}>
                      {b.income > 0 ? `$${b.income.toLocaleString()}` : "$0.00"}
                    </td>
                    <td className="number-cell">${b.expenses.toLocaleString()}</td>
                    <td className="number-cell">${b.bills.toLocaleString()}</td>
                    <td className="number-cell">${b.debts.toLocaleString()}</td>
                    <td className="number-cell">${b.savings.toLocaleString()}</td>
                    <td className="number-cell" style={{ 
                      fontWeight: 'bold', 
                      color: monthRemaining < 0 ? 'var(--color-stamp-red)' : (monthRemaining > 0 ? 'var(--color-ink-blue)' : 'inherit')
                    }}>
                      ${monthRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {selectedMonth === "All" && (
                <tr className="total-row">
                  <td>Total Annuals</td>
                  <td className="number-cell" style={{ color: 'var(--color-stamp-green)' }}>${totalIncome.toLocaleString()}</td>
                  <td className="number-cell">${totalExpenses.toLocaleString()}</td>
                  <td className="number-cell">${totalBills.toLocaleString()}</td>
                  <td className="number-cell">${totalDebts.toLocaleString()}</td>
                  <td className="number-cell">${totalSavings.toLocaleString()}</td>
                  <td className="number-cell" style={{ color: totalRemaining < 0 ? 'var(--color-stamp-red)' : 'var(--color-ink-blue)' }}>
                    ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
