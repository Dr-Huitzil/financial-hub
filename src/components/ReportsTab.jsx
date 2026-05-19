import React, { useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsTab({ transactions = [] }) {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("actual");

  // --- Dynamic Category Aggregations for Donut Chart and Search Grid ---
  const filteredTransactions = transactions.filter((tx) => {
    if (tx.type === "Income") return false; // Outflow only
    if (selectedMonth === "All") return true;
    if (!tx.date) return false;
    const txDate = new Date(tx.date);
    const monthName = MONTH_NAMES[txDate.getMonth()];
    return monthName === selectedMonth;
  });

  const catSums = {};
  const catTypes = {};
  let totalOutflow = 0;

  filteredTransactions.forEach((tx) => {
    const amt = parseFloat(tx.amount || 0);
    const cat = tx.category || "Uncategorized";
    catSums[cat] = (catSums[cat] || 0) + amt;
    catTypes[cat] = tx.type; // Bill, Debt, or Expense
    totalOutflow += amt;
  });

  const dynamicCategoryBreakdown = Object.keys(catSums).map((catName) => {
    const sum = catSums[catName];
    const pct = totalOutflow > 0 ? (sum / totalOutflow) * 100 : 0;
    return {
      category: catName,
      actual: Math.round(sum * 100) / 100,
      percentage: Math.round(pct * 100) / 100,
      type: catTypes[catName] || "Expense"
    };
  }).sort((a, b) => b.actual - a.actual);

  if (dynamicCategoryBreakdown.length === 0) {
    dynamicCategoryBreakdown.push({ category: "No Ledger Data", actual: 0, percentage: 0, type: "Expense" });
  }

  const filteredCategories = dynamicCategoryBreakdown
    .filter(c => {
      if (c.category === "No Ledger Data" && c.actual === 0) return true;
      const matchesSearch = c.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "All" || c.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "actual") return b.actual - a.actual;
      if (sortBy === "percentage") return b.percentage - a.percentage;
      return a.category.localeCompare(b.category);
    });

  const totalFilteredAmt = filteredCategories
    .filter(c => c.category !== "No Ledger Data")
    .reduce((sum, c) => sum + c.actual, 0);

  // --- Dynamic 12-Month Grid Calculations ---
  // Get all unique active outflow categories from transaction pool
  const uniqueOutflowCategories = Array.from(
    new Set(
      transactions
        .filter((tx) => tx.type !== "Income" && tx.category)
        .map((tx) => tx.category)
    )
  ).sort();

  // Mapped matrix: Category -> Month index (0 to 11) -> Aggregated Outbound Value
  const spendingMatrix = {};
  uniqueOutflowCategories.forEach((cat) => {
    spendingMatrix[cat] = Array(12).fill(0);
  });

  transactions.forEach((tx) => {
    if (tx.type === "Income" || !tx.category || !tx.date) return;
    const txDate = new Date(tx.date);
    const monthIdx = txDate.getMonth();
    if (monthIdx >= 0 && monthIdx < 12) {
      if (spendingMatrix[tx.category]) {
        spendingMatrix[tx.category][monthIdx] += parseFloat(tx.amount || 0);
      }
    }
  });

  // Calculate totals per month column across all categories
  const columnTotals = Array(12).fill(0);
  uniqueOutflowCategories.forEach((cat) => {
    for (let m = 0; m < 12; m++) {
      columnTotals[m] += spendingMatrix[cat][m];
    }
  });

  const grandTotal = columnTotals.reduce((sum, val) => sum + val, 0);
  const grandAverage = grandTotal / 12;

  // SVG drawing configuration
  const donutSize = 220;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const center = donutSize / 2;

  const colors = [
    "#1e3a8a", "#0f766e", "#b45309", "#9f1239", "#4d7c0f", 
    "#581c87", "#0369a1", "#047857", "#c2410c", "#881337", 
    "#1e293b", "#6d28d9", "#3b82f6", "#10b981", "#f59e0b"
  ];

  let accumulatedPercentage = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Row: Side-by-side Dial and Search/Index details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }} className="overview-grid">
        
        {/* SVG Donut Chart Column */}
        <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-title">
            <span>Outflow Breakdown Dial</span>
            <span className="stamp stamp-red" style={{ fontSize: '9px', transform: 'rotate(-2deg)' }}>Breakdown</span>
          </div>
          
          <p style={{ fontSize: '12.5px', color: 'rgba(32,30,28,0.7)', marginBottom: '10px' }}>
            Visual analysis of categorical disbursements from Excel.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <svg width={donutSize} height={donutSize} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              <circle 
                cx={center} 
                cy={center} 
                r={radius} 
                fill="none" 
                stroke="var(--color-manila-dark)" 
                strokeWidth="20"
              />
              {filteredCategories.filter(c => c.category !== "No Ledger Data").slice(0, 10).map((c, idx) => {
                const strokeDashoffset = circumference - (c.percentage / 100) * circumference;
                const strokeRotation = (accumulatedPercentage / 100) * 360;
                accumulatedPercentage += c.percentage;

                return (
                  <circle 
                    key={c.category}
                    cx={center} 
                    cy={center} 
                    r={radius} 
                    fill="none" 
                    stroke={colors[idx % colors.length]} 
                    strokeWidth="20"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transformOrigin: '50% 50%',
                      transform: `rotate(${strokeRotation}deg)`,
                      transition: 'all 0.3s ease'
                    }}
                  />
                );
              })}
              
              <g style={{ transform: `rotate(90deg) translate(0px, 0px)`, transformOrigin: '50% 50%' }}>
                <text 
                  x={center} 
                  y={center - 7} 
                  textAnchor="middle" 
                  fontFamily="var(--font-accent)" 
                  fontSize="9px" 
                  fontWeight="bold" 
                  fill="rgba(32,30,28,0.6)"
                >
                  {selectedMonth === "All" ? "ANNUAL TOTAL" : selectedMonth.toUpperCase()}
                </text>
                <text 
                  x={center} 
                  y={center + 13} 
                  textAnchor="middle" 
                  fontFamily="var(--font-ledger)" 
                  fontSize="14px" 
                  fontWeight="bold" 
                  fill="var(--color-ink-blue)"
                >
                  ${totalFilteredAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
              </g>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-paper-grid)', paddingTop: '15px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(32,30,28,0.5)' }}>Top Distributions</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {filteredCategories.filter(c => c.category !== "No Ledger Data").slice(0, 6).map((c, idx) => (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: colors[idx % colors.length], borderRadius: '2px' }}></span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.category}: <strong>{c.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Index Filter and Search Column */}
        <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-title">
            <span>Spreadsheet Ledger Indexes</span>
            <span className="barcode-text" style={{ fontSize: '8px' }}>INDEX-99-R</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  border: '1px solid var(--color-paper-grid)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-paper-light)'
                }}
              />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px',
                  fontFamily: 'var(--font-accent)',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  border: '1px solid var(--color-paper-grid)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-manila-light)',
                  cursor: 'pointer'
                }}
              >
                <option value="actual">Sort: Highest Cost</option>
                <option value="percentage">Sort: Percentage</option>
                <option value="name">Sort: A-Z Alphabetical</option>
              </select>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '8px',
                  fontFamily: 'var(--font-accent)',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  border: '1px solid var(--color-paper-grid)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-manila-light)',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Months</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="sub-tabs-strip" style={{ marginBottom: '0px' }}>
              {["All", "Bill", "Debt", "Expense"].map((t) => (
                <button 
                  key={t}
                  className={`sub-tab-btn ${filterType === t ? "active" : ""}`}
                  onClick={() => setFilterType(t)}
                >
                  {t === "All" ? "All Outflows" : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="category-progress-list" style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '6px' }}>
            {filteredCategories.filter(c => c.category !== "No Ledger Data").map((c, idx) => (
              <div key={c.category} className="category-bar-row">
                <div className="category-bar-info">
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>{c.category} <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'rgba(32,30,28,0.5)' }}>({c.type})</span></span>
                  <span style={{ fontFamily: 'var(--font-ledger)' }}>${c.actual.toLocaleString()} ({c.percentage}%)</span>
                </div>
                <div className="category-bar-bg">
                  <div 
                    className="category-bar-fill" 
                    style={{ 
                      width: `${c.percentage * 3.5}%`, 
                      maxWidth: '100%',
                      backgroundColor: colors[idx % colors.length]
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {filteredCategories.filter(c => c.category !== "No Ledger Data").length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '13px', fontStyle: 'italic', margin: '40px 0' }}>
                No transactional indexes match the filters.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Dynamic 12-Month Category Spending Matrix Grid (Full Width) */}
      <div className="tactile-card" style={{ width: '100%' }}>
        <div className="card-title">
          <span>Excel-Replica Category Spending Matrix Table</span>
          <span className="stamp stamp-blue" style={{ fontSize: '9px', transform: 'rotate(1deg)' }}>12-MONTH SPLIT</span>
        </div>
        
        <p style={{ fontSize: '12px', color: 'rgba(32,30,28,0.7)', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>
          Detailed horizontal category disbursements pivoted month-by-month. Persisted live from ledger logs.
        </p>

        <div className="ledger-table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="ledger-table" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Spending Breakdown</th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="number-cell" style={{ minWidth: '75px' }}>{m}</th>
                ))}
                <th className="number-cell" style={{ minWidth: '90px', borderLeft: '1.5px solid var(--color-ink-dark)', fontWeight: 'bold' }}>Total</th>
                <th className="number-cell" style={{ minWidth: '95px', fontWeight: 'bold' }}>Monthly Avg</th>
              </tr>
            </thead>
            <tbody>
              {uniqueOutflowCategories.map((cat) => {
                const rowMonths = spendingMatrix[cat];
                const rowTotal = rowMonths.reduce((sum, val) => sum + val, 0);
                const rowAverage = rowTotal / 12;

                return (
                  <tr key={cat}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-sans)' }}>{cat}</td>
                    {rowMonths.map((amt, idx) => (
                      <td key={idx} className="number-cell" style={{ 
                        color: amt > 0 ? 'var(--color-ink-dark)' : 'rgba(32,30,28,0.25)',
                        fontFamily: 'var(--font-ledger)'
                      }}>
                        {amt > 0 ? `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                    ))}
                    <td className="number-cell" style={{ 
                      fontWeight: 'bold', 
                      fontFamily: 'var(--font-ledger)',
                      borderLeft: '1.5px solid var(--color-ink-dark)',
                      color: 'var(--color-ink-blue)'
                    }}>
                      ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="number-cell" style={{ 
                      fontFamily: 'var(--font-ledger)',
                      fontWeight: 'bold',
                      color: 'rgba(32,30,28,0.7)'
                    }}>
                      ${rowAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {uniqueOutflowCategories.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', fontStyle: 'italic', padding: '30px' }}>
                    No ledger transactions logged for category breakdown mapping.
                  </td>
                </tr>
              )}

              {/* Total Spending Row */}
              <tr className="total-row" style={{ borderTop: '2px solid var(--color-ink-dark)' }}>
                <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Total Spending</td>
                {columnTotals.map((amt, idx) => (
                  <td key={idx} className="number-cell" style={{ 
                    fontFamily: 'var(--font-ledger)', 
                    fontWeight: 'bold',
                    color: 'var(--color-stamp-red)'
                  }}>
                    ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
                <td className="number-cell" style={{ 
                  fontWeight: 'bold', 
                  fontFamily: 'var(--font-ledger)',
                  borderLeft: '1.5px solid var(--color-ink-dark)',
                  color: 'var(--color-stamp-red)'
                }}>
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="number-cell" style={{ 
                  fontWeight: 'bold', 
                  fontFamily: 'var(--font-ledger)',
                  color: 'var(--color-stamp-red)'
                }}>
                  ${grandAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
