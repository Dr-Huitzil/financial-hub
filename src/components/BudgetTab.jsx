import React, { useState } from "react";

export default function BudgetTab({ monthlyBudgets, annualRunningBalance, categoryBreakdown }) {
  const [selectedMonth, setSelectedMonth] = useState("All");

  const filteredBudgets = selectedMonth === "All" 
    ? monthlyBudgets 
    : monthlyBudgets.filter(b => b.month === selectedMonth);

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
