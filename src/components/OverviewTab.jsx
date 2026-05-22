const formatDateCompact = (isoString) => {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;
  const [year, month, day] = parts;
  return `${month}/${day}/${year.slice(2)}`;
};

export default function OverviewTab({ upcomingPayments, onTogglePayment, cashFlowSummary, investmentGrowthData, thirtyDayBalance, creditCards = [] }) {
  // Calculate remaining dynamic budget
  const totalUpcomingToPay = upcomingPayments
    .filter(p => !p.paid && !p.isIncome)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUpcomingPaid = upcomingPayments
    .filter(p => p.paid && !p.isIncome)
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingDynamic = cashFlowSummary.totalRemaining - totalUpcomingPaid;

  // Chart data calculation for 30-day checking balance
  const chartData = thirtyDayBalance && thirtyDayBalance.length > 0 ? thirtyDayBalance : investmentGrowthData;
  const balances = chartData.map(d => d.balance);
  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  
  // Plotting values to 0-100 coordinates for SVG drawing
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;
  
  const points = chartData.map((d, index) => {
    const x = paddingX + (index / Math.max(1, chartData.length - 1)) * (svgWidth - paddingX * 2);
    // Inverse Y because SVG 0 is top
    const yRange = Math.max(1, maxBal - minBal);
    const y = svgHeight - paddingY - ((d.balance - minBal) / yRange) * (svgHeight - paddingY * 2);
    return { x, y, label: d.label || d.month, val: d.balance };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="overview-grid">
      <div className="overview-left-col">
        {/* Cash Flow Stamp Row */}
        <div className="tactile-card dogEared">
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
        <div className="tactile-card dogEared">
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
                  {/* Tooltip text could go here if needed */}
                </g>
              ))}
              
              {/* X-Axis Labels (start and end) */}
              {points.length > 0 && (
                <>
                  <text x={points[0].x} y={svgHeight - 5} textAnchor="middle" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                    {points[0].label}
                  </text>
                  <text x={points[points.length - 1].x} y={svgHeight - 5} textAnchor="middle" fontFamily="var(--font-ledger)" fontSize="9px" fill="rgba(32,30,28,0.5)">
                    {points[points.length - 1].label}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
 
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Right Column: Upcoming Payments Ledger Checklist */}
        <div className="tactile-card dogEared" style={{ display: 'flex', flexDirection: 'column' }}>
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
                    <span className="payment-item-date">Due: {formatDateCompact(p.dueDate)}</span>
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
            <div>Outstanding: <strong>${totalUpcomingToPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
            <div>Reconciled: <strong>${totalUpcomingPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
          </div>
        </div>

        {/* Available Credit Portfolio Card */}
        <div className="tactile-card dogEared" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="card-title">
            <span>Available Credit Portfolio</span>
            <div className="stamp stamp-blue" style={{ fontSize: '10px', transform: 'rotate(2deg)' }}>PORTFOLIO</div>
          </div>
  
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(32,30,28,0.7)', marginBottom: '4px' }}>
            Credit card available limits and total utilization analysis. Available credit = Limit - Balance.
          </p>
  
          {/* Aggregate Credit Metrics Row */}
          {(() => {
            const creditCardsList = creditCards || [];
            const totalCreditLimit = creditCardsList.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0);
            const totalCreditBalance = creditCardsList.reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0);
            const totalAvailableCredit = totalCreditLimit - totalCreditBalance;
            const overallUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '4px' }}>
                  <div className="metric-stamp-card positive" style={{ padding: '8px', textAlign: 'center' }}>
                    <span className="metric-stamp-label" style={{ fontSize: '8px' }}>Total Available</span>
                    <span className="metric-stamp-value" style={{ fontSize: '13px', fontFamily: 'var(--font-ledger)' }}>
                      ${totalAvailableCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="metric-stamp-card" style={{ padding: '8px', textAlign: 'center', border: '1.5px solid var(--color-paper-grid)', backgroundColor: 'var(--color-paper-light)' }}>
                    <span className="metric-stamp-label" style={{ fontSize: '8px' }}>Total Limit</span>
                    <span className="metric-stamp-value" style={{ fontSize: '13px', fontFamily: 'var(--font-ledger)', color: 'var(--color-ink-dark)' }}>
                      ${totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className={`metric-stamp-card ${overallUtilization > 50 ? 'negative' : (overallUtilization > 30 ? 'warning' : 'positive')}`} style={{ padding: '8px', textAlign: 'center' }}>
                    <span className="metric-stamp-label" style={{ fontSize: '8px' }}>Utilization Rate</span>
                    <span className="metric-stamp-value" style={{ fontSize: '13px', fontFamily: 'var(--font-ledger)' }}>
                      {overallUtilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
  
                {/* Individual Cards Progress Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                  {creditCardsList.map((card) => {
                    const limit = parseFloat(card.limit) || 0;
                    const balance = parseFloat(card.balance) || 0;
                    const available = limit - balance;
                    const util = limit > 0 ? (balance / limit) * 100 : 0;
                    
                    // Color code progress bar based on utilization
                    let barColor = 'var(--color-stamp-green)'; // Emerald < 30%
                    if (util > 50) {
                      barColor = 'var(--color-stamp-red)'; // Crimson > 50%
                    } else if (util > 30) {
                      barColor = '#b45309'; // Amber/Orange 30%-50%
                    }
  
                    return (
                      <div key={card.id || card.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-sans)' }}>{card.name}</span>
                          <span style={{ fontFamily: 'var(--font-ledger)', color: 'rgba(32,30,28,0.6)' }}>
                            Avail: <strong style={{ color: 'var(--color-ink-blue)' }}>${available.toLocaleString()}</strong> of ${limit.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Horizontal Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(32,30,28,0.08)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(32,30,28,0.1)' }}>
                            <div style={{ width: `${Math.min(100, util)}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-ledger)', minWidth: '32px', textAlign: 'right', fontWeight: 'bold', color: util > 30 ? barColor : 'rgba(32,30,28,0.6)' }}>
                            {util.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {creditCardsList.length === 0 && (
                    <p style={{ fontSize: '12px', fontStyle: 'italic', textAlign: 'center', color: 'rgba(32,30,28,0.5)', margin: '20px 0' }}>
                      No credit cards registered in setup.
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
