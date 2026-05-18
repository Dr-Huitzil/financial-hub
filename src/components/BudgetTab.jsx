import React, { useState } from "react";
import { monthlyBudgets } from "../data/financialData";

export default function BudgetTab() {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [projectedIncome, setProjectedIncome] = useState("3500");
  const [projectedOutflow, setProjectedOutflow] = useState("2800");

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

  // Projection math
  const calculatedRemainingProj = parseFloat(projectedIncome || 0) - parseFloat(projectedOutflow || 0);

  // SVG dimensions for the monthly comparison graph
  const svgWidth = 550;
  const svgHeight = 220;
  const graphPaddingX = 50;
  const graphPaddingY = 30;

  // Only render bars for months that have data
  const populatedMonths = monthlyBudgets.filter(b => b.income > 0 || b.expenses > 0);
  const maxValForGraph = Math.max(
    ...populatedMonths.map(b => Math.max(b.income, b.expenses + b.bills + b.debts + b.savings))
  ) * 1.1; // Add 10% ceiling buffer

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Selector and Dynamic Card Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }} className="overview-grid">
        {/* Month Selector & Quick Ledger Summary */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Ledger Archives</span>
            <div className="barcode-stamp">
              <div className="barcode-stripes" style={{ width: '80px', height: '16px' }}></div>
              <span className="barcode-text" style={{ fontSize: '8px' }}>ARCH-2026</span>
            </div>
          </div>
          
          <div className="sub-tabs-strip">
            <button 
              className={`sub-tab-btn ${selectedMonth === "All" ? "active" : ""}`} 
              onClick={() => setSelectedMonth("All")}
            >
              Annual Overview
            </button>
            {monthlyBudgets.map(b => (
              <button 
                key={b.month} 
                className={`sub-tab-btn ${selectedMonth === b.month ? "active" : ""}`}
                onClick={() => setSelectedMonth(b.month)}
              >
                {b.month.substring(0,3)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <div className="ledger-text-row">
              <span>Annual Ledger Revenue:</span>
              <span className="ledger-value" style={{ color: 'var(--color-stamp-green)' }}>+${totalIncome.toLocaleString()}</span>
            </div>
            <div className="ledger-text-row">
              <span>Annual Ledger Outflow:</span>
              <span className="ledger-value" style={{ color: 'var(--color-stamp-red)' }}>-${totalSpending.toLocaleString()}</span>
            </div>
            <div className="ledger-text-row" style={{ fontWeight: 'bold' }}>
              <span>Cumulative Financial Surplus:</span>
              <span className="ledger-value" style={{ fontSize: '16px', color: totalRemaining >= 0 ? 'var(--color-stamp-green)' : 'var(--color-stamp-red)' }}>
                ${totalRemaining.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Projection Calculator Card */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Dynamic Projection Calculator</span>
            <span className="stamp stamp-green" style={{ fontSize: '9px', transform: 'rotate(1deg)' }}>Simulate</span>
          </div>
          
          <p style={{ fontSize: '12px', color: 'rgba(32,30,28,0.7)', marginBottom: '14px' }}>
            Calculate simulated monthly buffers before adding new upcoming bills.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Simulated Income</label>
                <input 
                  type="number" 
                  value={projectedIncome} 
                  onChange={(e) => setProjectedIncome(e.target.value)}
                  style={{ padding: '8px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-ledger)', fontWeight: 'bold' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Simulated Spending</label>
                <input 
                  type="number" 
                  value={projectedOutflow} 
                  onChange={(e) => setProjectedOutflow(e.target.value)}
                  style={{ padding: '8px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-ledger)', fontWeight: 'bold' }}
                />
              </div>
            </div>
            
            <div className="ledger-text-row" style={{ borderTop: '1px dashed var(--color-paper-grid)', paddingTop: '10px', fontWeight: 'bold' }}>
              <span>Projected Safety Surplus:</span>
              <span className={`stamp ${calculatedRemainingProj >= 0 ? "stamp-green" : "stamp-red"}`} style={{ fontSize: '12px', transform: 'rotate(-1deg)' }}>
                ${calculatedRemainingProj.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Budget Spreadsheet Grid */}
      <div className="tactile-card">
        <div className="card-title">
          <span>Excel Replica Ledger Card</span>
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

      {/* SVG Income vs Spending Chart */}
      {selectedMonth === "All" && (
        <div className="tactile-card">
          <div className="card-title">
            <span>Income vs Outflow Chart</span>
            <span className="stamp stamp-green" style={{ fontSize: '9px' }}>Graph view</span>
          </div>

          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
              {/* Horizontal grid guide lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = graphPaddingY + ratio * (svgHeight - graphPaddingY * 2);
                const val = maxValForGraph - ratio * maxValForGraph;
                return (
                  <g key={idx}>
                    <line 
                      x1={graphPaddingX} 
                      y1={y} 
                      x2={svgWidth - graphPaddingX} 
                      y2={y} 
                      stroke="var(--color-paper-grid)" 
                      strokeDasharray="2,2"
                    />
                    <text 
                      x={graphPaddingX - 8} 
                      y={y + 3} 
                      textAnchor="end" 
                      fontFamily="var(--font-ledger)" 
                      fontSize="9px" 
                      fill="rgba(32,30,28,0.5)"
                    >
                      ${Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Draw columns for populated months */}
              {populatedMonths.map((b, idx) => {
                const monthTotalSpending = b.expenses + b.bills + b.debts + b.savings;
                
                const colWidth = 35;
                const colGap = 65;
                const startX = graphPaddingX + 35 + idx * colGap;

                // Calculate exact column heights
                const incHeight = (b.income / maxValForGraph) * (svgHeight - graphPaddingY * 2);
                const spendHeight = (monthTotalSpending / maxValForGraph) * (svgHeight - graphPaddingY * 2);
                
                const zeroY = svgHeight - graphPaddingY;

                return (
                  <g key={b.month}>
                    {/* Income Bar (Green) */}
                    <rect 
                      x={startX} 
                      y={zeroY - incHeight} 
                      width={colWidth / 2} 
                      height={incHeight} 
                      fill="rgba(37, 96, 70, 0.65)" 
                      stroke="var(--color-stamp-green)" 
                      strokeWidth="1.5" 
                      rx="2"
                    />
                    
                    {/* Spending Bar (Slate Gray) */}
                    <rect 
                      x={startX + colWidth / 2 + 3} 
                      y={zeroY - spendHeight} 
                      width={colWidth / 2} 
                      height={spendHeight} 
                      fill="rgba(32, 42, 69, 0.4)" 
                      stroke="var(--color-ink-blue)" 
                      strokeWidth="1.5" 
                      rx="2"
                    />

                    {/* Month Label */}
                    <text 
                      x={startX + colWidth / 2} 
                      y={zeroY + 14} 
                      textAnchor="middle" 
                      fontFamily="var(--font-accent)" 
                      fontSize="10px" 
                      fontWeight="bold"
                    >
                      {b.month}
                    </text>
                  </g>
                );
              })}

              {/* Baseline axis */}
              <line 
                x1={graphPaddingX} 
                y1={svgHeight - graphPaddingY} 
                x2={svgWidth - graphPaddingX} 
                y2={svgHeight - graphPaddingY} 
                stroke="var(--color-ink-dark)" 
                strokeWidth="1.5"
              />
            </svg>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', fontSize: '11px', fontFamily: 'var(--font-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(37, 96, 70, 0.65)', border: '1px solid var(--color-stamp-green)' }}></span>
                <span>Income Revenue Stream</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(32, 42, 69, 0.4)', border: '1px solid var(--color-ink-blue)' }}></span>
                <span>Combined Expenses & Debt Outflow</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
