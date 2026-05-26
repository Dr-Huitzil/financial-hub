import React, { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import useIncomePredictor from "../../hooks/useIncomePredictor.js";
import UncategorizedReviewDesk from "./UncategorizedReviewDesk";
import styles from "./Dashboard.module.css";

/**
 * Dashboard Component — Actionable Command Center
 *
 * Re-architected to use a responsive 3-column grid to fit high-digit cash positions
 * and include a dedicated Credit Obligations ledger statistics card.
 *
 * @param {Array}  transactions     - Raw transaction vouchers
 * @param {Array}  creditCards      - Active credit card assets
 * @param {Array}  goals            - Registered savings milestones
 * @param {Array}  upcomingPayments - Scheduled recurring obligations
 */
export default function Dashboard({
  transactions = [],
  creditCards = [],
  goals = [],
  upcomingPayments = [],
  startingBalances = {},
  categories = {},
  onUpdateTransaction,
}) {
  const { activeYear, formatValue } = useApp();
  const { getIncomeForMonth, getPaydayDetailsForMonth, checkIsBonusMonth } = useIncomePredictor();

  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);
  const monthNames = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);
  const currentMonthName = monthNames[currentMonthIndex];

  const expectedIncome = getIncomeForMonth(currentMonthIndex, activeYear);
  const isBonusMonth = checkIsBonusMonth(currentMonthIndex, activeYear);
  const paydayDetails = getPaydayDetailsForMonth(currentMonthIndex, activeYear);

  const [isReviewDeskOpen, setIsReviewDeskOpen] = useState(false);

  // Filter transactions by the globally selected activeYear
  const yearFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      return new Date(tx.date).getFullYear() === activeYear;
    });
  }, [transactions, activeYear]);

  const uncategorizedTransactions = useMemo(() => {
    return yearFilteredTransactions.filter((tx) => tx.category === "Uncategorized");
  }, [yearFilteredTransactions]);
  const uncategorizedCount = uncategorizedTransactions.length;
  const uncategorizedTotal = uncategorizedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  // Filter upcoming payments by the activeYear to align upcoming docket with select view
  const yearFilteredUpcoming = useMemo(() => {
    return upcomingPayments.filter((p) => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate).getFullYear() === activeYear;
    });
  }, [upcomingPayments, activeYear]);

  // ─── LEDGER ACCOUNT BALANCES ────────────────────────────────────────────────
  const checkingBalance = useMemo(() => {
    let balance = startingBalances?.Checking || 0; 
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txYear = new Date(tx.date).getFullYear();
      if (txYear > activeYear) return;

      const amt = parseFloat(tx.amount || 0);
      if (tx.type === "Transfer") {
        if (tx.toAccount === "Checking") balance += amt;
        if (tx.fromAccount === "Checking") balance -= amt;
      } else {
        const acct = tx.account || "Checking";
        if (acct === "Checking") {
          if (tx.type === "Income") balance += amt;
          else balance -= amt;
        }
      }
    });
    return balance;
  }, [transactions, startingBalances, activeYear]);

  const cashBalance = useMemo(() => {
    let balance = startingBalances?.["Physical Cash"] || 0;
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txYear = new Date(tx.date).getFullYear();
      if (txYear > activeYear) return;

      const amt = parseFloat(tx.amount || 0);
      if (tx.type === "Transfer") {
        if (tx.toAccount === "Physical Cash") balance += amt;
        if (tx.fromAccount === "Physical Cash") balance -= amt;
      } else {
        const acct = tx.account || "Checking";
        if (acct === "Physical Cash") {
          if (tx.type === "Income") balance += amt;
          else balance -= amt;
        }
      }
    });
    return balance;
  }, [transactions, startingBalances, activeYear]);

  const currentBalance = checkingBalance;

  // Upcoming bills = unpaid payments sorted by due-date (next 5 shown)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingUnpaid = useMemo(() =>
    yearFilteredUpcoming
      .filter(p => !p.paid && !p.isIncome && new Date(p.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [yearFilteredUpcoming]
  );

  const next5Bills = upcomingUnpaid.slice(0, 5);
  const upcomingBillTotal = upcomingUnpaid.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const safeToSpend = currentBalance - upcomingBillTotal;
  const safePositive = safeToSpend >= 0;

  // ─── RECENT ACTIVITY ──────────────────────────────────────────────────────
  const recent5 = useMemo(() =>
    [...yearFilteredTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    [yearFilteredTransactions]
  );

  const fmt = (n, opts = {}) => {
    const defaultOpts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const mergedOpts = { ...defaultOpts, ...opts };
    if (mergedOpts.maximumFractionDigits < mergedOpts.minimumFractionDigits) {
      mergedOpts.minimumFractionDigits = mergedOpts.maximumFractionDigits;
    }
    return n.toLocaleString(undefined, mergedOpts);
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T12:00:00"); // avoid UTC offset shift
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const daysUntil = (iso) => {
    const due = new Date(iso + "T12:00:00");
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff}d`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── Folder title stamp bar ── */}
      <div
        className="tactile-card"
        style={{
          border: "2px solid var(--color-ink-dark)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: 0,
            }}
          >
            Command Center — Daily Docket
          </h2>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "12px",
              color: "rgba(32,30,28,0.65)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Actionable financial snapshot: safe cash position, upcoming obligations, and latest vouchers.
          </p>
        </div>
        <span
          className="stamp stamp-blue"
          style={{ transform: "rotate(-3deg)", fontSize: "9px" }}
        >
          DAILY RECONCILED
        </span>
      </div>

      {/* ── Reconciliation Exception Alert Widget ── */}
      {uncategorizedCount > 0 && (
        <div
          className="tactile-card dogEared"
          style={{
            border: "2px dashed var(--color-stamp-red)",
            backgroundColor: "rgba(224, 212, 185, 0.45)",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                border: "2px solid var(--color-stamp-red)",
                backgroundColor: "var(--color-paper-light)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "var(--font-typewriter)",
                fontSize: "20px",
                fontWeight: "bold",
                color: "var(--color-stamp-red)",
                transform: "rotate(-4deg)",
                boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              ⚠
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-typewriter)",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "var(--color-stamp-red)",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                * COMPTROL EXCEPTION: MATCHING IT UP AUDIT REQUIRED *
              </h3>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "12px",
                  color: "var(--color-ink-dark)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: "1.4",
                }}
              >
                There are <strong>{uncategorizedCount}</strong> imported transaction voucher(s) in suspense (Uncategorized) totaling <strong style={{ color: "var(--color-stamp-red)", fontFamily: "var(--font-ledger)" }}>${fmt(Math.abs(uncategorizedTotal))}</strong>. 
                Reconcile these inputs to ensure budget sheets and balance sheets remain true.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span
              className="stamp stamp-red"
              style={{
                transform: "rotate(-6deg) scale(0.95)",
                fontSize: "10px",
                padding: "4px 8px",
                fontWeight: "900",
                letterSpacing: "1px",
              }}
            >
              AUDIT REQUIRED
            </span>
            <button
              onClick={() => setIsReviewDeskOpen(true)}
              style={{
                padding: "10px 20px",
                fontFamily: "var(--font-accent)",
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--color-paper-light)",
                backgroundColor: "var(--color-stamp-red)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(127,29,29,0.3)",
                transition: "all 0.1s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#991b1b";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-stamp-red)";
                e.currentTarget.style.transform = "translateY(0px)";
              }}
            >
              Open Matching It Up Desk
            </button>
          </div>
        </div>
      )}

      {/* ── Responsive 3-column grid layout — stacks on mobile ── */}
      <div className={styles.overviewGrid3Col}>

        {/* ══════════════════════════════════════════════
            COLUMN 1: Safe to Spend + Upcoming Docket
        ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* CARD 1 — SAFE TO SPEND */}
          <div
            className="tactile-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--color-paper-grid)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                  }}
                >
                  Safe to Spend
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.55)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Balance minus upcoming bills
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <span
                  className={`stamp ${safePositive ? "stamp-green" : "stamp-red"}`}
                  style={{ fontSize: "7px", transform: "rotate(1.5deg)" }}
                >
                  {safePositive ? "SOLVENT" : "DEFICIT"}
                </span>
                {uncategorizedCount === 0 && (
                  <span
                    className="stamp stamp-green"
                    style={{
                      fontSize: "6px",
                      transform: "rotate(-2.5deg)",
                      padding: "2px 4px",
                      borderColor: "var(--color-stamp-green)",
                      color: "var(--color-stamp-green)",
                      letterSpacing: "0.2px",
                    }}
                    title="All transaction records are verified and categorized"
                  >
                    AUDIT: RECONCILED ✓
                  </span>
                )}
              </div>
            </div>

            {/* Big hero number */}
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ledger)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(32,30,28,0.5)",
                  marginBottom: "6px",
                }}
              >
                Available Cash
              </span>
              <span
                className="typewriter-num"
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  color: safePositive ? "var(--color-stamp-green)" : "var(--color-stamp-red)",
                  lineHeight: 1.1,
                }}
              >
                {safePositive ? "" : "−"}${fmt(Math.abs(safeToSpend))}
              </span>
            </div>

            {/* Sub-breakdown ledger rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                borderTop: "1px dashed var(--color-paper-grid)",
                paddingTop: "12px",
              }}
            >
              <div className="ledger-text-row">
                <span className="ledger-label">Current Balance</span>
                <span
                  className="ledger-value typewriter-num"
                  style={{ color: currentBalance >= 0 ? "var(--color-stamp-green)" : "var(--color-stamp-red)" }}
                >
                  ${fmt(currentBalance)}
                </span>
              </div>
              <div className="ledger-text-row">
                <span className="ledger-label">Upcoming Bills</span>
                <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-red)" }}>
                  −${fmt(upcomingBillTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2 — UPCOMING DOCKET */}
          <div
            className="tactile-card"
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--color-paper-grid)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                  }}
                >
                  Upcoming Docket
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.55)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Next 5 scheduled obligations
                </p>
              </div>
              <span
                className="stamp stamp-red"
                style={{ fontSize: "7px", transform: "rotate(-1.5deg)" }}
              >
                DUE SOON
              </span>
            </div>

            {/* Docket list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {next5Bills.length === 0 ? (
                <span
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "11.5px",
                    opacity: 0.45,
                    padding: "20px 0",
                  }}
                >
                  No upcoming obligations on record.
                </span>
              ) : (
                next5Bills.map((p, idx) => {
                  const due = new Date(p.dueDate + "T12:00:00");
                  const isOverdue = due < today;
                  const isImminent = !isOverdue && Math.ceil((due - today) / 86400000) <= 3;

                  return (
                    <div
                      key={p.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        backgroundColor: isOverdue
                          ? "rgba(127,29,29,0.05)"
                          : isImminent
                          ? "rgba(180,83,9,0.05)"
                          : "transparent",
                        borderLeft: `3px solid ${
                          isOverdue
                            ? "var(--color-stamp-red)"
                            : isImminent
                            ? "#b45309"
                            : "var(--color-paper-grid)"
                        }`,
                      }}
                    >
                      {/* Due date badge */}
                      <div
                        style={{
                          minWidth: "36px",
                          textAlign: "center",
                          fontFamily: "var(--font-ledger)",
                          fontSize: "9px",
                          fontWeight: "bold",
                          color: isOverdue
                            ? "var(--color-stamp-red)"
                            : isImminent
                            ? "#b45309"
                            : "rgba(32,30,28,0.5)",
                        }}
                      >
                        {fmtDate(p.dueDate)}
                        <div
                          style={{
                            fontSize: "8px",
                            fontWeight: "normal",
                            marginTop: "1px",
                          }}
                        >
                          {isOverdue ? "LATE" : daysUntil(p.dueDate)}
                        </div>
                      </div>

                      {/* Name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          fontFamily: "var(--font-sans)",
                          fontWeight: "600",
                          color: "var(--color-ink-dark)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>

                      {/* Amount */}
                      <span
                        className="typewriter-num"
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "var(--color-stamp-red)",
                        }}
                      >
                        ${fmt(parseFloat(p.amount || 0))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer tally */}
            {next5Bills.length > 0 && (
              <div
                className="ledger-text-row"
                style={{
                  borderTop: "1px dashed var(--color-paper-grid)",
                  paddingTop: "10px",
                  marginTop: "4px",
                }}
              >
                <span className="ledger-label" style={{ fontWeight: "bold" }}>
                  Total Due ({upcomingUnpaid.length} bills)
                </span>
                <span
                  className="ledger-value typewriter-num"
                  style={{ color: "var(--color-stamp-red)", fontWeight: "bold" }}
                >
                  ${fmt(upcomingBillTotal)}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* ══════════════════════════════════════════════
            COLUMN 2: Physical Cash Stash + Credit Card Stats
        ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* CARD 1B — PHYSICAL CASH STASH (Kraft Envelope) */}
          <div
            className="tactile-card kraft-envelope dogEared"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed rgba(32,30,28,0.15)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                    color: "var(--color-ink-dark)",
                  }}
                >
                  Physical Cash Stash
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.6)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Liquid envelope reserve
                </p>
              </div>
              <span
                className="stamp stamp-blue"
                style={{ fontSize: "7px", transform: "rotate(-2deg)", color: "var(--color-ink-blue)", borderColor: "var(--color-ink-blue)" }}
              >
                SECURED CASH
              </span>
            </div>

            {/* Big hero number */}
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ledger)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(32,30,28,0.6)",
                  marginBottom: "6px",
                }}
              >
                Envelope Total
              </span>
              <span
                className="typewriter-num"
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  color: "var(--color-ink-dark)",
                  lineHeight: 1.1,
                  textShadow: "0 0 1px rgba(32, 30, 28, 0.25)"
                }}
              >
                ${fmt(cashBalance)}
              </span>
            </div>

            {/* Sub-breakdown rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                borderTop: "1px dashed rgba(32,30,28,0.15)",
                paddingTop: "12px",
              }}
            >
              <div className="ledger-text-row" style={{ borderBottomColor: "rgba(32,30,28,0.15)" }}>
                <span className="ledger-label" style={{ color: "rgba(32,30,28,0.8)" }}>Ledger Account</span>
                <span className="ledger-value" style={{ fontFamily: "var(--font-typewriter)", fontSize: "11px" }}>
                  Vault Envelope
                </span>
              </div>
              <div className="ledger-text-row" style={{ borderBottom: "none" }}>
                <span className="ledger-label" style={{ color: "rgba(32,30,28,0.8)" }}>Status</span>
                <span className="ledger-value" style={{ color: "var(--color-stamp-green)", fontWeight: "bold" }}>
                  RECONCILED
                </span>
              </div>
            </div>
          </div>

          {/* NEW CARD — CREDIT OBLIGATIONS */}
          <div
            className="tactile-card dogEared"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--color-paper-grid)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                  }}
                >
                  Credit Obligations
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.55)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Utilization & limits analysis
                </p>
              </div>
              {(() => {
                const totalCreditLimit = creditCards.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0);
                const totalCreditBalance = creditCards.reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0);
                const overallUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
                let stampClass = "stamp-green";
                let stampText = "OPTIMAL";
                if (overallUtilization > 50) {
                  stampClass = "stamp-red";
                  stampText = "OVERLIMIT";
                } else if (overallUtilization > 30) {
                  stampClass = "stamp-blue";
                  stampText = "WARNING";
                }
                return (
                  <span
                    className={`stamp ${stampClass}`}
                    style={{ fontSize: "7px", transform: "rotate(2deg)" }}
                  >
                    {stampText}
                  </span>
                );
              })()}
            </div>

            {/* Big hero number */}
            {(() => {
              const totalCreditLimit = creditCards.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0);
              const totalCreditBalance = creditCards.reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0);
              const totalAvailableCredit = totalCreditLimit - totalCreditBalance;
              const overallUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
              return (
                <>
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <span
                      style={{
                        display: "block",
                        fontFamily: "var(--font-ledger)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "rgba(32,30,28,0.5)",
                        marginBottom: "6px",
                      }}
                    >
                      Available Credit
                    </span>
                    <span
                      className="typewriter-num"
                      style={{
                        fontSize: "clamp(28px, 4vw, 40px)",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        color: "var(--color-ink-blue)",
                        lineHeight: 1.1,
                      }}
                    >
                      ${fmt(totalAvailableCredit)}
                    </span>
                  </div>

                  {/* Sub-breakdown ledger rows */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                      borderTop: "1px dashed var(--color-paper-grid)",
                      paddingTop: "12px",
                    }}
                  >
                    <div className="ledger-text-row">
                      <span className="ledger-label">Total Debt</span>
                      <span className="ledger-value typewriter-num" style={{ color: "var(--color-stamp-red)" }}>
                        −${fmt(totalCreditBalance)}
                      </span>
                    </div>
                    <div className="ledger-text-row">
                      <span className="ledger-label">Total Limit</span>
                      <span className="ledger-value typewriter-num" style={{ color: "var(--color-ink-dark)" }}>
                        ${fmt(totalCreditLimit)}
                      </span>
                    </div>
                    <div className="ledger-text-row">
                      <span className="ledger-label">Portfolio Utilization</span>
                      <span
                        className="ledger-value typewriter-num"
                        style={{
                          color: overallUtilization > 50
                            ? "var(--color-stamp-red)"
                            : overallUtilization > 30
                            ? "#b45309"
                            : "var(--color-stamp-green)",
                          fontWeight: "bold"
                        }}
                      >
                        {overallUtilization.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Scrollable Individual Cards List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                      borderTop: "1px dashed var(--color-paper-grid)",
                      paddingTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-accent)",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "rgba(32,30,28,0.6)",
                        marginBottom: "4px"
                      }}
                    >
                      Card Utilization:
                    </span>
                    {creditCards.length === 0 ? (
                      <span
                        style={{
                          textAlign: "center",
                          fontStyle: "italic",
                          fontSize: "11px",
                          opacity: 0.45,
                          padding: "15px 0",
                        }}
                      >
                        No credit cards configured.
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                        {creditCards.map((card) => {
                          const limit = parseFloat(card.limit) || 0;
                          const balance = parseFloat(card.balance) || 0;
                          const available = limit - balance;
                          const util = limit > 0 ? (balance / limit) * 100 : 0;
                          
                          let barColor = 'var(--color-stamp-green)';
                          if (util > 50) {
                            barColor = 'var(--color-stamp-red)';
                          } else if (util > 30) {
                            barColor = '#b45309';
                          }

                          return (
                            <div key={card.id || card.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                <span style={{ fontWeight: "600", fontFamily: "var(--font-sans)", color: "var(--color-ink-dark)" }}>{card.name}</span>
                                <span style={{ fontFamily: "var(--font-ledger)", fontSize: "10px", color: "rgba(32,30,28,0.6)" }}>
                                  Avail: <strong style={{ color: "var(--color-ink-blue)" }}>${fmt(available, { maximumFractionDigits: 0 })}</strong>
                                </span>
                              </div>
                              
                              {/* Horizontal Progress Bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(32,30,28,0.06)", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(32,30,28,0.08)" }}>
                                  <div style={{ width: `${Math.min(100, util)}%`, height: "100%", backgroundColor: barColor, transition: "width 0.3s ease" }} />
                                </div>
                                <span style={{ fontSize: "9px", fontFamily: "var(--font-ledger)", minWidth: "24px", textAlign: "right", fontWeight: "bold", color: util > 30 ? barColor : "rgba(32,30,28,0.6)" }}>
                                  {util.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

        </div>

        {/* ══════════════════════════════════════════════
            COLUMN 3: Expected Payroll + Recent Activity
        ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* CARD 1C — EXPECTED PAYROLL INCOME */}
          <div
            className="tactile-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative"
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--color-paper-grid)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                  }}
                >
                  Expected Payroll
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.55)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Projected {currentMonthName} {activeYear}
                </p>
              </div>
              <span
                className="stamp stamp-green"
                style={{ fontSize: "7px", transform: "rotate(-1.5deg)" }}
              >
                ESTIMATED
              </span>
            </div>

            {/* Big hero number & Bonus Stamp */}
            <div style={{ textAlign: "center", padding: "12px 0", position: "relative" }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ledger)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(32,30,28,0.5)",
                  marginBottom: "6px",
                }}
              >
                Total Expected Income
              </span>
              <span
                className="typewriter-num"
                style={{
                  fontSize: "clamp(24px, 3.5vw, 36px)",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  color: "var(--color-stamp-green)",
                  lineHeight: 1.1,
                }}
              >
                {formatValue(expectedIncome)}
              </span>
              {isBonusMonth && (
                <span
                  className="stamp stamp-red"
                  style={{
                    position: "absolute",
                    bottom: "-10px",
                    right: "5%",
                    transform: "rotate(-12deg) scale(0.85)",
                    fontSize: "9px",
                    padding: "3px 6px",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap"
                  }}
                >
                  BONUS MONTH
                </span>
              )}
            </div>

            {/* Paycheck envelopes list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                borderTop: "1px dashed var(--color-paper-grid)",
                paddingTop: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-accent)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "rgba(32,30,28,0.6)",
                  marginBottom: "4px"
                }}
              >
                Wage Envelopes:
              </span>
              {paydayDetails.length === 0 ? (
                <span
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "11px",
                    opacity: 0.45,
                    padding: "15px 0",
                  }}
                >
                  No payroll streams configured.
                </span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {paydayDetails.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(224, 212, 185, 0.25)",
                        border: "1px dashed var(--color-paper-grid)",
                        borderLeft: "3px solid var(--color-stamp-green)",
                      }}
                    >
                      {/* Payday date/label */}
                      <div
                        style={{
                          minWidth: "32px",
                          textAlign: "center",
                          fontFamily: "var(--font-ledger)",
                          fontSize: "8.5px",
                          fontWeight: "bold",
                          color: "var(--color-stamp-green)"
                        }}
                      >
                        {item.dayLabel}
                      </div>

                      {/* Paycheck name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "11px",
                          fontFamily: "var(--font-sans)",
                          fontWeight: "600",
                          color: "var(--color-ink-dark)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.name}
                      </span>

                      {/* Amount */}
                      <span
                        className="typewriter-num"
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: "var(--color-stamp-green)"
                        }}
                      >
                        {formatValue(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3 — RECENT ACTIVITY */}
          <div
            className="tactile-card"
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--color-paper-grid)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: "bold",
                  }}
                >
                  Recent Activity
                </span>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "10.5px",
                    color: "rgba(32,30,28,0.55)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  5 most recent vouchers filed
                </p>
              </div>
              <span
                className="stamp stamp-green"
                style={{ fontSize: "7px", transform: "rotate(1deg)" }}
              >
                LEDGER
              </span>
            </div>

            {/* Mini ledger rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {recent5.length === 0 ? (
                <span
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "11.5px",
                    opacity: 0.45,
                    padding: "20px 0",
                  }}
                >
                  No transaction vouchers on file.
                </span>
              ) : (
                recent5.map((tx, idx) => {
                  const isIncome = tx.type === "Income";
                  return (
                    <div
                      key={tx.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "7px 8px",
                        borderRadius: "4px",
                        borderBottom: idx < recent5.length - 1
                          ? "1px dashed rgba(181,169,138,0.4)"
                          : "none",
                      }}
                    >
                      {/* Type indicator dot */}
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          backgroundColor: isIncome
                            ? "var(--color-stamp-green)"
                            : tx.type === "Bill"
                            ? "#1e3a8a"
                            : tx.type === "Debt"
                            ? "#7f1d1d"
                            : "#b45309",
                        }}
                      />

                      {/* Description + category */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "var(--color-ink-dark)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.description || tx.name || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: "9.5px",
                            fontFamily: "var(--font-ledger)",
                            color: "rgba(32,30,28,0.5)",
                            marginTop: "1px",
                          }}
                        >
                          {tx.category} · {fmtDate(tx.date)}
                        </div>
                      </div>

                      {/* Amount */}
                      <span
                        className="typewriter-num"
                        style={{
                          fontSize: "12.5px",
                          fontWeight: "bold",
                          color: isIncome ? "var(--color-stamp-green)" : "var(--color-stamp-red)",
                          flexShrink: 0,
                        }}
                      >
                        {isIncome ? "+" : "−"}${fmt(parseFloat(tx.amount || 0))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: net of shown transactions */}
            {recent5.length > 0 && (
              <div
                style={{
                  borderTop: "1px dashed var(--color-paper-grid)",
                  paddingTop: "10px",
                  marginTop: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "9.5px",
                    fontFamily: "var(--font-ledger)",
                    color: "rgba(32,30,28,0.5)",
                    textTransform: "uppercase",
                  }}
                >
                  {transactions.length} total vouchers on file
                </span>
                <span
                  className={`stamp ${currentBalance >= 0 ? "stamp-green" : "stamp-red"}`}
                  style={{ fontSize: "7px" }}
                >
                  {currentBalance >= 0 ? "NET POSITIVE" : "NET NEGATIVE"}
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Reconciliation Audit Desk Workbook Modal ── */}
      <UncategorizedReviewDesk
        isOpen={isReviewDeskOpen}
        onClose={() => setIsReviewDeskOpen(false)}
        transactions={transactions}
        categories={categories}
        onUpdateTransaction={onUpdateTransaction}
      />
    </div>
  );
}
