import { useState } from "react";

export default function InvestmentsTab({ investmentGrowthData }) {
  const [timeframe, setTimeframe] = useState("1-year");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [interestRate, setInterestRate] = useState("8");

  // Dynamic projection calculations based on user inputs
  const projectGrowth = () => {
    let balance = parseFloat(initialCapital || 0);
    const monthlyRate = parseFloat(interestRate || 0) / 100 / 12;
    const addition = parseFloat(monthlyContribution || 0);
    
    return Array.from({ length: 12 }, (_, i) => {
      balance = balance * (1 + monthlyRate) + addition;
      return {
        month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
        projectedBalance: balance
      };
    });
  };

  const simulatedGrowthData = projectGrowth();

  // Graph rendering variables
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 50;
  const paddingY = 30;

  // Use the spreadsheet's growth trend or the custom simulated one
  const useSimulated = timeframe === "18-day" || timeframe === "30-day";
  const displayData = useSimulated ? simulatedGrowthData : investmentGrowthData.map(d => ({
    month: d.month,
    projectedBalance: d.balance
  }));

  const balances = displayData.map(d => d.projectedBalance);
  const maxBal = Math.max(...balances) * 1.05;
  const minBal = Math.min(...balances) * 0.95;

  const points = displayData.map((d, index) => {
    const x = paddingX + (index / (displayData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((d.projectedBalance - minBal) / (maxBal - minBal)) * (svgHeight - paddingY * 2);
    return { x, y, month: d.month, val: d.projectedBalance };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }} className="overview-grid">
        {/* Compounding Projection Inputs */}
        <div className="tactile-card">
          <div className="card-title">
            <span>Interest Compounding Ledger</span>
            <div className="stamp stamp-green" style={{ fontSize: '9px', transform: 'rotate(-2deg)' }}>Compounding</div>
          </div>
          
          <p style={{ fontSize: '12.5px', color: 'rgba(32,30,28,0.7)', marginBottom: '16px' }}>
            Modify physical ledger values to project long term annual compounding yield.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Initial Principal</label>
                <input 
                  type="number" 
                  value={initialCapital} 
                  onChange={(e) => setInitialCapital(e.target.value)}
                  style={{ padding: '8px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-ledger)', fontWeight: 'bold' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Monthly Contribution</label>
                <input 
                  type="number" 
                  value={monthlyContribution} 
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  style={{ padding: '8px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-ledger)', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Estimated Return Percentage ({interestRate}%)</label>
                <span className="barcode-text" style={{ fontSize: '8px' }}>YIELD-IND</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="25" 
                value={interestRate} 
                onChange={(e) => setInterestRate(e.target.value)}
                className="analog-range"
              />
            </div>

            <div className="ledger-text-row" style={{ borderTop: '1px dashed var(--color-paper-grid)', paddingTop: '10px' }}>
              <span>Projected Year-End Asset Balance:</span>
              <span className="ledger-value" style={{ fontSize: '18px', color: 'var(--color-ink-blue)' }}>
                ${simulatedGrowthData[11].projectedBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Investment Details Ledger Card */}
        <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">
              <span>Historical Stock Metrics</span>
              <span className="stamp stamp-red" style={{ fontSize: '9px' }}>12M Trend</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="ledger-text-row">
                <span>Total Accumulated Principal:</span>
                <span className="ledger-value">${(parseFloat(initialCapital || 0) + parseFloat(monthlyContribution || 0) * 12).toLocaleString()}</span>
              </div>
              <div className="ledger-text-row">
                <span>Projected Yield Surplus:</span>
                <span className="ledger-value" style={{ color: 'var(--color-stamp-green)' }}>
                  +${(simulatedGrowthData[11].projectedBalance - (parseFloat(initialCapital || 0) + parseFloat(monthlyContribution || 0) * 12)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="ledger-text-row">
                <span>Asset Volatility Factor:</span>
                <span className="ledger-value">Stable (Low risk)</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px dashed var(--color-paper-grid)', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <div className="barcode-stamp">
              <div className="barcode-stripes"></div>
              <span className="barcode-text">METRICS-9092-B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sweeping Trend Graph */}
      <div className="tactile-card">
        <div className="card-title">
          <span>Asset Growth Timeline Chart</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-accent)', fontWeight: 'bold' }}>Timeframe:</span>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                fontFamily: 'var(--font-accent)',
                fontSize: '11.5px',
                fontWeight: 'bold',
                padding: '4px 8px',
                backgroundColor: 'var(--color-manila-light)',
                border: '1px solid var(--color-paper-grid)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="1-year">Excel Trend (1 Year)</option>
              <option value="18-day">Simulated 18-Day Stream</option>
              <option value="30-day">Simulated 30-Day Stream</option>
            </select>
          </div>
        </div>

        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
            {/* Grid background markers */}
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
                    strokeDasharray="2,2"
                  />
                  <text 
                    x={paddingX - 8} 
                    y={y + 3} 
                    textAnchor="end" 
                    fontFamily="var(--font-ledger)" 
                    fontSize="9px" 
                    fill="rgba(32,30,28,0.5)"
                  >
                    ${Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Sweep Trend Line */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="var(--color-ink-blue)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Node Dots */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill="var(--color-paper-light)" 
                  stroke="var(--color-ink-blue)" 
                  strokeWidth="2"
                />
                <text 
                  x={p.x} 
                  y={svgHeight - paddingY + 12} 
                  textAnchor="middle" 
                  fontFamily="var(--font-accent)" 
                  fontSize="9px" 
                  fill="var(--color-ink-dark)"
                  fontWeight="bold"
                >
                  {p.month}
                </text>
              </g>
            ))}

            {/* Baseline axis */}
            <line 
              x1={paddingX} 
              y1={svgHeight - paddingY} 
              x2={svgWidth - paddingX} 
              y2={svgHeight - paddingY} 
              stroke="var(--color-ink-dark)" 
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
