import React, { useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";

/**
 * Dashboard Component — Actionable Command Center
 *
 * Three skeuomorphic paper cards:
 *   1. "Safe to Spend"  — prominent monospaced number: balance minus upcoming bills
 *   2. "Upcoming Docket" — next 5 upcoming recurring bills
 *   3. "Recent Activity" — 5 most recent transactions (mini ledger)
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
}) {
  const { activeYear } = useApp();

  // Filter transactions by the globally selected activeYear
  const yearFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      return new Date(tx.date).getFullYear() === activeYear;
    });
  }, [transactions, activeYear]);

  // Filter upcoming payments by the activeYear to align upcoming docket with select view
  const yearFilteredUpcoming = useMemo(() => {
    return upcomingPayments.filter((p) => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate).getFullYear() === activeYear;
    });
  }, [upcomingPayments, activeYear]);

  // =========================================================================
  // FIREBASE FIRESTORE DATA HOOKUP EXAMPLE (WITH ACTIVE YEAR FILTERING)
  // =========================================================================
  /*
  useEffect(() => {
    if (!user) return;

    // Define ISO-8601 date boundaries for the selected active year
    const startOfYear = `${activeYear}-01-01T00:00:00.000Z`;
    const endOfYear = `${activeYear}-12-31T23:59:59.999Z`;

    const txCollectionRef = collection(db, "users", user.uid, "transactions");
    const q = query(
      txCollectionRef,
      where("date", ">=", startOfYear),
      where("date", "<=", endOfYear),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yearTxList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // setTransactions(yearTxList);
    }, (err) => {
      console.error("Firestore loading failed for active year: " + activeYear, err);
    });

    return () => unsubscribe();
  }, [activeYear, user]);
  */

  // ─── LEDGER ACCOUNT BALANCES ────────────────────────────────────────────────
  const checkingBalance = useMemo(() => {
    let balance = 0;
    yearFilteredTransactions.forEach((tx) => {
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
  }, [yearFilteredTransactions]);

  const cashBalance = useMemo(() => {
    let balance = 0;
    yearFilteredTransactions.forEach((tx) => {
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
  }, [yearFilteredTransactions]);

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

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const fmt = (n, opts = {}) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts });

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

      {/* ── 4-column grid on wide screens, stacked on mobile ── */}
      <div
        className="overview-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.1fr 1fr 1.2fr",
          gap: "24px",
          alignItems: "start",
        }}
      >

        {/* ══════════════════════════════════════════════
            CARD 1 — SAFE TO SPEND
        ══════════════════════════════════════════════ */}
        <div
          className="tactile-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            gridColumn: "1",
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
            <span
              className={`stamp ${safePositive ? "stamp-green" : "stamp-red"}`}
              style={{ fontSize: "7px", transform: "rotate(1.5deg)" }}
            >
              {safePositive ? "SOLVENT" : "DEFICIT"}
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

        {/* ══════════════════════════════════════════════
            CARD 1B — PHYSICAL CASH STASH (Kraft Envelope)
        ══════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════
            CARD 2 — UPCOMING DOCKET
        ══════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════
            CARD 3 — RECENT ACTIVITY
        ══════════════════════════════════════════════ */}
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
  );
}
