import { useState } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { aggregateFinancialData } from "../data/financialDataSync";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Skeuomorphic Monospaced Typewriter Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const title = label || payload[0].payload.name || payload[0].name;
    return (
      <div className="tactile-card" style={{
        padding: "10px 14px",
        border: "1.5px solid var(--color-ink-dark)",
        backgroundColor: "var(--color-paper-light)",
        fontFamily: "var(--font-ledger)",
        boxShadow: "2px 4px 10px rgba(0,0,0,0.15)",
        zIndex: 1000
      }}>
        <div style={{ fontWeight: "bold", fontFamily: "var(--font-accent)", fontSize: "11px", marginBottom: "5px", color: "var(--color-ink-blue)", borderBottom: "1px dashed rgba(0,0,0,0.15)", paddingBottom: "3px" }}>
          📂 {title}
        </div>
        {payload.map((p, idx) => {
          const val = typeof p.value === "number" ? `$${p.value.toLocaleString()}` : p.value;
          return (
            <div key={idx} style={{ fontSize: "11.5px", color: p.color || "var(--color-ink-dark)", display: "flex", justifyContent: "space-between", gap: "10px" }} className="typewriter-num">
              <span>{p.name}:</span>
              <strong>{val}</strong>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ReportsFolder({ transactions = [], goals = [] }) {
  // Aggregate data using system layer
  const aggregates = aggregateFinancialData(transactions, goals);
  const { monthlyBudgets, categoryBreakdown } = aggregates;

  // 1. DATA FORMATTING FOR ANNUAL TRENDS (BAR CHART)
  const barData = monthlyBudgets.map(m => ({
    month: m.month.slice(0, 3),
    Income: m.income,
    Expenses: Math.round((m.expenses + m.bills + m.debts) * 100) / 100
  }));

  // 2. DATA FORMATTING FOR SPENDING BREAKDOWN (PIE CHART)
  const expenseCategoriesOnly = categoryBreakdown.filter(c => c.category !== "No Ledger Data" && c.actual > 0);
  const totalExpenseOutflow = expenseCategoriesOnly.reduce((sum, c) => sum + c.actual, 0);

  const topCategoryLimit = 5;
  const topCategories = expenseCategoriesOnly.slice(0, topCategoryLimit);
  const otherCategoriesAmt = expenseCategoriesOnly.slice(topCategoryLimit).reduce((sum, c) => sum + c.actual, 0);

  const pieData = topCategories.map(c => ({
    name: c.category,
    value: c.actual
  }));

  if (otherCategoriesAmt > 0) {
    pieData.push({
      name: "Other Categories",
      value: otherCategoriesAmt
    });
  }

  // Washed-out physical highlighter color palette
  const colorPalette = [
    "#9e2a2b", // Faded Brick Red
    "#0f766e", // Washed Out Teal
    "#b45309", // Warm Amber
    "#1e3a8a", // Soft Slate Navy
    "#4d7c0f", // Moss Green
    "#6b7280"  // Graphite Grey (for "Other")
  ];

  // 3. HEARTBEAT — Daily running balance from all transactions, sorted chronologically
  // Each point is one calendar day that has at least one transaction event
  const heartbeatData = (() => {
    if (transactions.length === 0) return [];

    // Start balance is the net before the first transaction
    let runningBalance = 0;

    // Sort all transactions by date ascending
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build a map: date-string → net delta that day
    const dayMap = {};
    sorted.forEach(tx => {
      const key = tx.date ? tx.date.slice(0, 10) : null;
      if (!key) return;
      const amt = parseFloat(tx.amount || 0);
      const delta = tx.type === "Income" ? amt : -amt;
      dayMap[key] = (dayMap[key] || 0) + delta;
    });

    // Convert to array of { day, balance } preserving order
    const days = Object.keys(dayMap).sort();
    const points = days.map(day => {
      runningBalance += dayMap[day];
      return {
        day: day.slice(5), // "MM-DD"
        balance: Math.round(runningBalance * 100) / 100,
      };
    });

    return points;
  })();

  // ─── Legacy line data kept for the spider legs line chart (still used below) ───
  let checkingAcc = 12547.32;
  let savingsAcc = 4500.00;
  const lineData = monthlyBudgets.map((m, idx) => {
    const netFlow = m.income - (m.expenses + m.bills + m.debts);
    checkingAcc += netFlow;
    if (m.savings > 0) {
      savingsAcc += m.savings;
    }
    return {
      month: MONTH_SHORT[idx],
      "Net Worth": Math.round(checkingAcc + savingsAcc),
      "Checking Account": Math.round(checkingAcc),
      "Savings Pool": Math.round(savingsAcc)
    };
  });

  // Calculate table cumulative totals
  const totalIncome = monthlyBudgets.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyBudgets.reduce((sum, m) => sum + m.expenses, 0);
  const totalBills = monthlyBudgets.reduce((sum, m) => sum + m.bills, 0);
  const totalDebts = monthlyBudgets.reduce((sum, m) => sum + m.debts, 0);
  const totalSavings = monthlyBudgets.reduce((sum, m) => sum + m.savings, 0);
  const totalRemaining = totalIncome - (totalExpenses + totalBills + totalDebts + totalSavings);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top stamped control bar */}
      <div className="tactile-card" style={{ border: "2px solid var(--color-ink-dark)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-accent)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Treasury Performance Analytics Ledger
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "rgba(32,30,28,0.7)", fontFamily: "var(--font-sans)" }}>
            Visual cash flow balancing, category distributions, and multi-month capital growth trends.
          </p>
        </div>
        <span className="stamp stamp-blue" style={{ transform: "rotate(-3deg)", fontSize: "9px" }}>
          AUDIT SECURED
        </span>
      </div>

      {/* Manila Reports Folder Sheet Container */}
      <div className="budget-ledger-sheet" style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        
        {/* CSS Grid for Visualizations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }} className="overview-grid">
          
          {/* CARD 1: ANNUAL TRENDS (BarChart Comparing Income vs. Expenses) */}
          <div className="tactile-card" style={{ backgroundColor: "#fefdfb", border: "1px dashed var(--color-paper-grid)", display: "flex", flexDirection: "column", minHeight: "330px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "10px", marginBottom: "15px" }}>
              <span style={{ fontFamily: "var(--font-accent)", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
                Annual Trends (Income vs. Expenses)
              </span>
              <span className="stamp stamp-green" style={{ fontSize: "7px", transform: "rotate(1deg)" }}>BUDGET STRENGTH</span>
            </div>

            <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.7)", marginBottom: "15px" }}>
              Monthly cash flow comparison of dynamic earnings vs combined outbound obligations.
            </p>

            <div style={{ width: "100%", height: "210px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--color-ink-dark)" 
                    tick={{ fontFamily: "var(--font-accent)", fontSize: 9, fill: "rgba(30,41,59,0.7)" }} 
                  />
                  <YAxis 
                    stroke="var(--color-ink-dark)" 
                    tick={{ fontFamily: "var(--font-ledger)", fontSize: 9, fill: "rgba(30,41,59,0.7)" }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={20}
                    wrapperStyle={{ fontFamily: "var(--font-accent)", fontSize: 10, paddingTop: 10 }}
                  />
                  <Bar dataKey="Income" fill="#a7f3d0" stroke="#059669" strokeWidth={1.5} radius={[2, 2, 0, 0]} name="Wages Inflow" />
                  <Bar dataKey="Expenses" fill="#fecaca" stroke="#dc2626" strokeWidth={1.5} radius={[2, 2, 0, 0]} name="Total Debits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CARD 2: SPENDING BREAKDOWN (Pie/DonutChart) */}
          <div className="tactile-card" style={{ backgroundColor: "#fefdfb", border: "1px dashed var(--color-paper-grid)", display: "flex", flexDirection: "column", minHeight: "330px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "10px", marginBottom: "15px" }}>
              <span style={{ fontFamily: "var(--font-accent)", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
                Spending Allocation Breakdown
              </span>
              <span className="stamp stamp-red" style={{ fontSize: "7px", transform: "rotate(-1deg)" }}>SECTOR DIVIDE</span>
            </div>

            <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.7)", marginBottom: "15px" }}>
              Categorized cumulative debit allocation breakdown. Mapped by ledger percentages.
            </p>

            <div style={{ position: "relative", width: "100%", height: "210px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} stroke="var(--color-paper-light)" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={20}
                    wrapperStyle={{ fontFamily: "var(--font-accent)", fontSize: 10, paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute center donut value */}
              <div style={{
                position: "absolute",
                top: "43%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none"
              }}>
                <span style={{ fontSize: "9px", fontFamily: "var(--font-accent)", fontWeight: "bold", opacity: 0.5 }}>OUTFLOW</span>
                <br />
                <strong className="typewriter-num" style={{ fontSize: "13px", color: "var(--color-stamp-red)", fontWeight: "bold" }}>
                  ${totalExpenseOutflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </strong>
              </div>
            </div>
          </div>

          {/* CARD 3: HEARTBEAT — Daily Running Balance (AreaChart) */}
          <div className="tactile-card" style={{ gridColumn: "span 2", backgroundColor: "#fefdfb", border: "1px dashed var(--color-paper-grid)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "10px", marginBottom: "15px" }}>
              <span style={{ fontFamily: "var(--font-accent)", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
                Heartbeat — Daily Running Balance
              </span>
              <span className="stamp stamp-blue" style={{ fontSize: "7px", transform: "rotate(-1deg)" }}>LIVE PULSE</span>
            </div>

            <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.7)", marginBottom: "15px" }}>
              Sharp linear area chart tracing the account balance day-by-day. Each payday spike and bill drop creates the characteristic heartbeat pulse.
            </p>

            <div style={{ width: "100%", height: "230px" }}>
              {heartbeatData.length < 2 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "var(--font-ledger)", fontSize: "12px", color: "rgba(32,30,28,0.4)", fontStyle: "italic" }}>
                  Post transactions to generate the heartbeat chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={heartbeatData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      {/* Highly transparent muted fill beneath the line */}
                      <linearGradient id="heartbeatFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e293b" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#1e293b" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.07)" />
                    <XAxis
                      dataKey="day"
                      stroke="var(--color-ink-dark)"
                      tick={{ fontFamily: "var(--font-ledger)", fontSize: 8, fill: "rgba(30,41,59,0.6)" }}
                      interval={Math.max(1, Math.floor(heartbeatData.length / 12))}
                    />
                    <YAxis
                      stroke="var(--color-ink-dark)"
                      tick={{ fontFamily: "var(--font-ledger)", fontSize: 9, fill: "rgba(30,41,59,0.6)" }}
                      domain={['auto', 'auto']}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Sharp linear line — the 'heartbeat' — dark slate ink */}
                    <Area
                      type="linear"
                      dataKey="balance"
                      stroke="#1e293b"
                      strokeWidth={1.5}
                      fill="url(#heartbeatFill)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 1.5, fill: "#faf8f5", stroke: "#1e293b" }}
                      name="Running Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* SECTION 3: THE MASTER LEDGER (Data Table) */}
        <div className="tactile-card" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "10px", marginBottom: "15px" }}>
            <span style={{ fontFamily: "var(--font-accent)", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
              Annual Comptroller General Ledger Matrix
            </span>
            <span className="barcode-text" style={{ fontSize: "8px" }}>ANNUAL-COM-992</span>
          </div>
          
          <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.7)", marginBottom: "15px" }}>
            Pivot table detailing horizontal ledger flows logged across all registry fields.
          </p>

          <div className="ledger-table-container" style={{ width: "100%", overflowX: "auto" }}>
            <table className="ledger-table" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: "120px" }}>Audit Month</th>
                  <th className="number-cell">Income ($)</th>
                  <th className="number-cell">Expenses ($)</th>
                  <th className="number-cell">Bills ($)</th>
                  <th className="number-cell">Debt ($)</th>
                  <th className="number-cell">Savings ($)</th>
                  <th className="number-cell" style={{ borderLeft: "1.5px solid var(--color-ink-dark)", fontWeight: "bold", minWidth: "120px" }}>Remaining Net ($)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBudgets.map((m, idx) => {
                  const outSum = m.expenses + m.bills + m.debts + m.savings;
                  const netDiff = m.income - outSum;

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: "bold", fontFamily: "var(--font-sans)", color: "var(--color-ink-dark)" }}>{m.month}</td>
                      <td className="number-cell typewriter-num" style={{ color: m.income > 0 ? "#059669" : "rgba(32,30,28,0.25)", fontFamily: "var(--font-ledger)" }}>
                        {m.income > 0 ? `$${m.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="number-cell typewriter-num" style={{ color: m.expenses > 0 ? "var(--color-ink-dark)" : "rgba(32,30,28,0.25)", fontFamily: "var(--font-ledger)" }}>
                        {m.expenses > 0 ? `$${m.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="number-cell typewriter-num" style={{ color: m.bills > 0 ? "var(--color-ink-dark)" : "rgba(32,30,28,0.25)", fontFamily: "var(--font-ledger)" }}>
                        {m.bills > 0 ? `$${m.bills.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="number-cell typewriter-num" style={{ color: m.debts > 0 ? "var(--color-ink-dark)" : "rgba(32,30,28,0.25)", fontFamily: "var(--font-ledger)" }}>
                        {m.debts > 0 ? `$${m.debts.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="number-cell typewriter-num" style={{ color: m.savings > 0 ? "#b45309" : "rgba(32,30,28,0.25)", fontFamily: "var(--font-ledger)" }}>
                        {m.savings > 0 ? `$${m.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="number-cell typewriter-num" style={{ 
                        fontWeight: "bold", 
                        fontFamily: "var(--font-ledger)",
                        borderLeft: "1.5px solid var(--color-ink-dark)",
                        color: netDiff >= 0 ? "var(--color-ink-blue)" : "var(--color-stamp-red)"
                      }}>
                        {netDiff >= 0 ? "+" : ""}${netDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Master Totals Row */}
                <tr className="total-row" style={{ borderTop: "2px solid var(--color-ink-dark)", backgroundColor: "rgba(32,30,28,0.02)" }}>
                  <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>General Totals</td>
                  <td className="number-cell typewriter-num" style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "#059669" }}>
                    ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="number-cell typewriter-num" style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "var(--color-ink-dark)" }}>
                    ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="number-cell typewriter-num" style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "var(--color-ink-dark)" }}>
                    ${totalBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="number-cell typewriter-num" style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "var(--color-ink-dark)" }}>
                    ${totalDebts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="number-cell typewriter-num" style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "#b45309" }}>
                    ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="number-cell typewriter-num" style={{ 
                    fontWeight: "bold", 
                    fontFamily: "var(--font-ledger)",
                    borderLeft: "1.5px solid var(--color-ink-dark)",
                    color: totalRemaining >= 0 ? "var(--color-ink-blue)" : "var(--color-stamp-red)"
                  }}>
                    {totalRemaining >= 0 ? "+" : ""}${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
