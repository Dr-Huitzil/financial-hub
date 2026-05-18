import React, { useState } from "react";
import { categoryBreakdown } from "../data/financialData";

export default function ReportsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("actual");

  // Filtering category breakdown
  const filteredCategories = categoryBreakdown
    .filter(c => {
      const matchesSearch = c.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "All" || c.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "actual") return b.actual - a.actual;
      if (sortBy === "percentage") return b.percentage - a.percentage;
      return a.category.localeCompare(b.category);
    });

  const totalFilteredAmt = filteredCategories.reduce((sum, c) => sum + c.actual, 0);

  // SVG drawing configuration for a clean financial donut chart
  const donutSize = 220;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const center = donutSize / 2;

  // Curated ledger-ink tones for the chart segments
  const colors = [
    "#1e3a8a", "#0f766e", "#b45309", "#9f1239", "#4d7c0f", 
    "#581c87", "#0369a1", "#047857", "#c2410c", "#881337", 
    "#1e293b", "#6d28d9", "#3b82f6", "#10b981", "#f59e0b"
  ];

  let accumulatedPercentage = 0;

  return (
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

        {/* Custom Donut Chart Render */}
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
            {filteredCategories.slice(0, 10).map((c, idx) => {
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
            
            {/* Center label */}
            <g style={{ transform: `rotate(90deg) translate(0px, 0px)`, transformOrigin: '50% 50%' }}>
              <text 
                x={center} 
                y={center - 5} 
                textAnchor="middle" 
                fontFamily="var(--font-accent)" 
                fontSize="11px" 
                fontWeight="bold" 
                fill="rgba(32,30,28,0.6)"
              >
                CATEGORIES
              </text>
              <text 
                x={center} 
                y={center + 15} 
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

        {/* Legend listing top categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-paper-grid)', paddingTop: '15px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(32,30,28,0.5)' }}>Top Distributions</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {filteredCategories.slice(0, 6).map((c, idx) => (
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

        {/* Controls Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Search category (e.g. Chase)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12.5px',
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

        {/* Ledger Category Index Rows */}
        <div className="category-progress-list" style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '6px' }}>
          {filteredCategories.map((c, idx) => (
            <div key={c.category} className="category-bar-row">
              <div className="category-bar-info">
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>{c.category} <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'rgba(32,30,28,0.5)' }}>({c.type})</span></span>
                <span style={{ fontFamily: 'var(--font-ledger)' }}>${c.actual.toLocaleString()} ({c.percentage}%)</span>
              </div>
              <div className="category-bar-bg">
                <div 
                  className="category-bar-fill" 
                  style={{ 
                    width: `${c.percentage * 3.5}%`, // Scaled for visual length
                    maxWidth: '100%',
                    backgroundColor: colors[idx % colors.length]
                  }}
                ></div>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '13px', fontStyle: 'italic', margin: '40px 0' }}>
              No transactional indexes match the filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
