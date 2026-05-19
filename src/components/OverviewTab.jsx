import React from "react";

export default function OverviewTab({ upcomingPayments, onTogglePayment, cashFlowSummary, investmentGrowthData }) {
  // Calculate remaining dynamic budget
  const totalUpcomingToPay = upcomingPayments
    .filter(p => !p.paid && !p.isIncome)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUpcomingPaid = upcomingPayments
    .filter(p => p.paid && !p.isIncome)
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingDynamic = cashFlowSummary.totalRemaining - totalUpcomingPaid;

  // Chart data calculation for a gorgeous custom SVG path
  const months = investmentGrowthData.map(d => d.month);
  const balances = investmentGrowthData.map(d => d.balance);
  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  
  // Plotting values to 0-100 coordinates for SVG drawing
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;
  
  const points = investmentGrowthData.map((d, index) => {
    const x = paddingX + (index / (investmentGrowthData.length - 1)) * (svgWidth - paddingX * 2);
    // Inverse Y because SVG 0 is top
    const y = svgHeight - paddingY - ((d.balance - minBal) / (maxBal - minBal)) * (svgHeight - paddingY * 2);
    return { x, y, month: d.month, val: d.balance };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="overview-grid">
      <div className="overview-left-col">
        {/* Cash Flow Stamp Row */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Cash Flow Ledgers</span>
            <div className="stamp stamp-green" style={{ fontSize: '10px', transform: 'rotate(2deg)' }}>Audited</div>
          </div>
          
          <div className="metrics-row">
            <div className="metric-stamp-card positive">
              <span className="metric-stamp-label">Total Income</span>
              <span className="metric-stamp-value">${cashFlowSummary.totalIncome.toLocaleString()}</span>
            </div>
            
            <div className="metric-stamp-card negative">
              <span className="metric-stamp-label">Total Expenses</span>
              <span className="metric-stamp-value">${cashFlowSummary.totalExpenses.toLocaleString()}</span>
            </div>

            <div className="metric-stamp-card negative">
              <span className="metric-stamp-label">Debt Paid</span>
              <span className="metric-stamp-value">${cashFlowSummary.totalDebtPaid.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--color-paper-grid)' }}>
            <div className="ledger-text-row">
              <span className="ledger-label">Total Bills Summary:</span>
              <span className="ledger-value">${cashFlowSummary.totalBills.toLocaleString()}</span>
            </div>
            <div className="ledger-text-row">
              <span className="ledger-label">Savings Allotted:</span>
              <span className="ledger-value">${cashFlowSummary.totalSavings.toLocaleString()}</span>
            </div>
            <div className="ledger-text-row" style={{ borderBottom: 'none', fontWeight: 'bold' }}>
              <span className="ledger-label" style={{ color: 'var(--color-ink-blue)' }}>Actual Net Surplus:</span>
              <span className="ledger-value" style={{ color: 'var(--color-ink-blue)', fontSize: '18px' }}>
                ${remainingDynamic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Blueprint Line Chart */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Balance Overview</span>
            <span className="barcode-text" style={{ fontSize: '9px' }}>CHART-NO: 2026-F</span>
          </div>

          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                const val = maxBal - ratio * (maxBal - minBal);
                return (
                  <g key={idx}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="var(--color-paper-grid)" 
                      strokeDasharray="3,3"
                    />
                    <text 
                      x={paddingX - 8} 
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

              {/* Axis Line */}
              <line 
                x1={paddingX} 
                y1={svgHeight - paddingY} 
                x2={svgWidth - paddingX} 
                y2={svgHeight - paddingY} 
                stroke="var(--color-ink-dark)" 
                strokeWidth="1"
              />

              {/* Plot Path */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="var(--color-ink-blue)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Nodes */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="var(--color-paper-light)" 
                    stroke="var(--color-ink-blue)" 
                    strokeWidth="2"
                  />
                  {/* Tooltip text for hover nodes */}
                  <text 
                    x={p.x} 
                    y={svgHeight - paddingY + 12} 
                    textAnchor="middle" 
                    fontFamily="var(--font-ledger)" 
                    fontSize="9px" 
                    fill="var(--color-ink-dark)"
                  >
                    {p.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Right Column: Upcoming Payments Ledger Checklist */}
      <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-title">
          <span>Upcoming Payments</span>
          <div className="stamp stamp-red" style={{ fontSize: '10px', transform: 'rotate(-2deg)' }}>Pending</div>
        </div>
        
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: 'rgba(32,30,28,0.7)', marginBottom: '16px' }}>
          Tick off payments to reconcile your cash balance. Income receipts (e.g. Paychecks) are auto-calculated in green.
        </p>

        <div className="payment-checklist">
          {upcomingPayments.map((p) => (
            <div 
              key={p.id} 
              className={`payment-checklist-item ${p.paid ? "checked" : ""}`}
              onClick={() => onTogglePayment(p.id)}
            >
              <div className="payment-item-left">
                <div className="custom-checkbox"></div>
                <div className="payment-item-details">
                  <span className="payment-item-name">{p.name}</span>
                  <span className="payment-item-date">Due: {p.dueDate}</span>
                </div>
              </div>
              
              <div className="payment-item-value" style={{ color: p.isIncome ? 'var(--color-stamp-green)' : 'var(--color-ink-dark)' }}>
                {p.isIncome ? `+ $${p.amount.toLocaleString()}` : `$${p.amount.toLocaleString()}`}
                {p.paid && (
                  <span 
                    className={`stamp ${p.isIncome ? "stamp-green" : "stamp-red"}`} 
                    style={{ fontSize: '8px', padding: '2px 4px', transform: 'rotate(-8deg)', marginLeft: '4px' }}
                  >
                    {p.isIncome ? "Deposited" : "Paid"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px dashed var(--color-paper-grid)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-ledger)' }}>
          <div>Outstanding Obligations: <strong>${totalUpcomingToPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
          <div>Checked Reconciled: <strong>${totalUpcomingPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
        </div>
      </div>
    </div>
  );
}
