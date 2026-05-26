import React, { useState, useEffect, useMemo } from "react";

/**
 * UncategorizedReviewDesk Component — A beautiful skeuomorphic audit workbook
 * lying on a wooden desk. Left side shows the voucher stack queue,
 * right side shows details and rapid-classification controls.
 */
export default function UncategorizedReviewDesk({
  isOpen,
  onClose,
  transactions = [],
  categories = {},
  onUpdateTransaction,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Form states for the current active uncategorized transaction
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("Expense");
  const [editCategory, setEditCategory] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [stampStatus, setStampStatus] = useState(null); // 'approved', 'skipped' or null

  // Filter list of uncategorized transactions
  const uncategorizedList = useMemo(() => {
    return transactions
      .filter((tx) => tx.category === "Uncategorized")
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  const activeTx = uncategorizedList[activeIndex];

  // Initialize form state when the active transaction changes
  useEffect(() => {
    if (activeTx) {
      setEditDesc(activeTx.description || activeTx.name || "");
      setEditType(activeTx.type || "Expense");
      
      // Select the first category in this class if available
      const typeCats = categories[activeTx.type || "Expense"] || [];
      setEditCategory(typeCats.includes(activeTx.category) ? activeTx.category : (typeCats[0] || ""));
    }
  }, [activeTx, categories]);

  // Adjust activeIndex if the list shrinks
  useEffect(() => {
    if (activeIndex >= uncategorizedList.length && uncategorizedList.length > 0) {
      setActiveIndex(uncategorizedList.length - 1);
    }
  }, [uncategorizedList, activeIndex]);

  if (!isOpen) return null;

  // Formatting helpers
  const fmt = (n) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDateCompact = (isoString) => {
    if (!isoString) return "";
    const parts = isoString.split("-");
    if (parts.length !== 3) return isoString;
    const [year, month, day] = parts;
    return `${month}/${day}/${year.slice(2)}`;
  };

  // Common quick categories configuration for rapid single-click mapping
  const QUICK_CATEGORIES = {
    Expense: ["Groceries", "Restaurant", "Fast Food", "Fuel", "Hobbies", "Personal Care", "Home", "Entertainment"],
    Bill: ["Electricity", "Rent", "WiFi", "Google One", "YouTube Premium"],
    Debt: ["Discover It", "Freedom Chase", "Amazon Chase", "Sapphire Chase"],
    Income: ["Paycheck 1", "Paycheck 2", "Side hustle", "Interest", "Cash"]
  };

  // Perform transaction classification update with animation
  const handleCategorize = async (catName, customType = null) => {
    if (!activeTx || transitioning) return;

    const finalType = customType || editType;
    const finalCategory = catName || editCategory;

    if (!finalCategory) {
      alert("Yearly Overview Error: Please select or enter a valid category.");
      return;
    }

    setTransitioning(true);
    setStampStatus("approved");

    // Micro-delay for visual stamp animation
    setTimeout(async () => {
      if (onUpdateTransaction) {
        await onUpdateTransaction(activeTx.id, {
          description: editDesc.trim(),
          type: finalType,
          category: finalCategory,
        });
      }

      setTransitioning(false);
      setStampStatus(null);

      // If we aren't at the end of the queue, slide to the next, otherwise loop back or stay
      if (activeIndex < uncategorizedList.length - 1) {
        // Queue shrinks, so we don't necessarily have to advance index since current item is deleted from queue
      } else {
        setActiveIndex(0);
      }
    }, 450);
  };

  const handleSkip = () => {
    if (transitioning) return;
    setTransitioning(true);
    setStampStatus("skipped");

    setTimeout(() => {
      setTransitioning(false);
      setStampStatus(null);
      if (activeIndex < uncategorizedList.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else {
        setActiveIndex(0);
      }
    }, 250);
  };

  const handleTypeChange = (newType) => {
    setEditType(newType);
    const available = categories[newType] || [];
    if (available.length > 0) {
      setEditCategory(available[0]);
    } else {
      setEditCategory("");
    }
  };

  const totalAmountPending = uncategorizedList.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(22, 21, 20, 0.8)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9990,
        padding: "20px",
      }}
      onClick={onClose}
    >
      {/* Wooden Desk container simulation */}
      <div
        style={{
          width: "100%",
          maxWidth: "1150px",
          height: "90vh",
          maxHeight: "750px",
          backgroundColor: "#3a2d24",
          backgroundImage: `
            linear-gradient(45deg, rgba(0,0,0,0.15) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(0,0,0,0.15) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.15) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.15) 75%)
          `,
          backgroundSize: "40px 40px",
          borderRadius: "16px",
          boxShadow: "0 30px 70px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.1)",
          border: "8px solid #231913",
          padding: "30px 40px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desk Accents: Binder brass screws */}
        <div style={{ position: "absolute", top: "12px", left: "12px", width: "10px", height: "10px", borderRadius: "50%", background: "#b8943a", boxShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}></div>
        <div style={{ position: "absolute", top: "12px", right: "12px", width: "10px", height: "10px", borderRadius: "50%", background: "#b8943a", boxShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}></div>
        <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "10px", height: "10px", borderRadius: "50%", background: "#b8943a", boxShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}></div>
        <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "10px", height: "10px", borderRadius: "50%", background: "#b8943a", boxShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}></div>

        {/* Closing Esc button at top right of desk */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-15px",
            right: "-15px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--color-stamp-red)",
            border: "3px solid var(--color-ink-dark)",
            color: "var(--color-paper-light)",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "transform 0.1s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
          title="Exit Audit Desk"
        >
          &times;
        </button>

        {uncategorizedList.length === 0 ? (
          /* =========================================================================
             QUEUE EMPTY SUCCESS STATE
             ========================================================================= */
          <div
            className="tactile-card"
            style={{
              width: "600px",
              padding: "45px 30px",
              textAlign: "center",
              border: "3.5px solid var(--color-ink-dark)",
              backgroundImage: "radial-gradient(var(--color-paper-grid) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              transform: "rotate(-1deg)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.4)",
              animation: "stampShake 0.4s ease forwards",
            }}
          >
            <div className="barcode-stamp" style={{ marginBottom: "15px", opacity: 0.7 }}>
              <div className="barcode-stripes" style={{ width: "120px", height: "16px" }}></div>
              <span className="barcode-text">AUDIT-SUCCESS-000</span>
            </div>

            <h2 style={{ fontFamily: "var(--font-typewriter)", fontSize: "24px", color: "var(--color-ink-dark)", margin: "0 0 10px 0" }}>
              AUDIT VERIFICATION PASSED
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(32,30,28,0.75)", lineHeight: "1.6", margin: "0 0 35px 0" }}>
              The Yearly Overview has audited the books and reports that there are <strong>zero (0)</strong> unclassified transaction vouchers remaining. All inputs are perfectly matched up to their corresponding budget limits!
            </p>

            <span
              className="stamp stamp-green"
              style={{
                fontSize: "24px",
                padding: "12px 24px",
                borderWidth: "4px",
                fontWeight: "900",
                display: "inline-block",
                transform: "rotate(-6deg) scale(1.15)",
                boxShadow: "0 0 4px rgba(20,83,45,0.3)",
              }}
            >
              FULLY MATCHED UP ✓
            </span>

            <button
              onClick={onClose}
              style={{
                display: "block",
                margin: "45px auto 0 auto",
                padding: "12px 24px",
                fontFamily: "var(--font-accent)",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--color-paper-light)",
                backgroundColor: "var(--color-ink-dark)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
            >
              Return to Command Center
            </button>
          </div>
        ) : (
          /* =========================================================================
             ACTIVE AUDIT WORKBOOK
             ========================================================================= */
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "var(--color-paper-light)",
              borderRadius: "8px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.5), inset 20px 0 30px rgba(0,0,0,0.03)",
              border: "1.5px solid var(--color-paper-edge)",
              display: "flex",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Skeuomorphic Ring-Binder Central Spine */}
            <div
              style={{
                position: "absolute",
                left: "calc(35% - 15px)",
                top: 0,
                bottom: 0,
                width: "30px",
                background: "linear-gradient(to right, #cbd5e1 0%, #94a3b8 20%, #475569 45%, #1e293b 50%, #475569 55%, #94a3b8 80%, #cbd5e1 100%)",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.4), 3px 0 5px rgba(0,0,0,0.1), -3px 0 5px rgba(0,0,0,0.1)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "40px 0",
              }}
            >
              {/* Silver Metallic D-Rings */}
              <div style={{ width: "38px", height: "8px", borderRadius: "4px", background: "linear-gradient(#f1f5f9, #475569)", border: "1px solid #1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
              <div style={{ width: "38px", height: "8px", borderRadius: "4px", background: "linear-gradient(#f1f5f9, #475569)", border: "1px solid #1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
              <div style={{ width: "38px", height: "8px", borderRadius: "4px", background: "linear-gradient(#f1f5f9, #475569)", border: "1px solid #1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
            </div>

            {/* Spine Perforation lines */}
            <div style={{ position: "absolute", left: "calc(35% - 25px)", top: 0, bottom: 0, width: "1px", borderLeft: "2px dashed rgba(32,30,28,0.15)", zIndex: 9 }}></div>
            <div style={{ position: "absolute", left: "calc(35% + 23px)", top: 0, bottom: 0, width: "1px", borderLeft: "2px dashed rgba(32,30,28,0.15)", zIndex: 9 }}></div>

            {/* =========================================================================
               LEFT PAGE: VOUCHER QUEUE STACK (35% Width)
               ========================================================================= */}
            <div
              style={{
                width: "35%",
                backgroundColor: "var(--color-manila-light)",
                borderRight: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                padding: "24px 28px 24px 24px",
                overflow: "hidden",
              }}
            >
              {/* Manila tab top accent */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px double var(--color-ink-dark)", paddingBottom: "10px", marginBottom: "15px" }}>
                <span style={{ fontFamily: "var(--font-accent)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
                  INBOX LEDGER QUEUE
                </span>
                <span className="stamp stamp-red" style={{ fontSize: "7px", borderWidth: "1.5px", padding: "1px 4px", transform: "rotate(3deg)" }}>
                  AUDIT ACTIVE
                </span>
              </div>

              {/* Aggregation statistics */}
              <div
                style={{
                  backgroundColor: "rgba(235, 220, 185, 0.35)",
                  border: "1px dashed var(--color-paper-edge)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ fontFamily: "var(--font-sans)", color: "rgba(32,30,28,0.6)", fontWeight: "600" }}>Total Pending Vouchers:</span>
                  <span style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold" }}>{uncategorizedList.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ fontFamily: "var(--font-sans)", color: "rgba(32,30,28,0.6)", fontWeight: "600" }}>Cumulative Suspense Bal:</span>
                  <span style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold", color: "var(--color-stamp-red)" }}>
                    ${fmt(totalAmountPending)}
                  </span>
                </div>
              </div>

              {/* Scrollable vouchers stack list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingRight: "4px",
                }}
              >
                {uncategorizedList.map((tx, idx) => {
                  const isActive = idx === activeIndex;
                  const isIncome = tx.type === "Income";

                  return (
                    <div
                      key={tx.id || idx}
                      onClick={() => !transitioning && setActiveIndex(idx)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "6px",
                        border: isActive ? "2px solid var(--color-ink-dark)" : "1px solid rgba(0,0,0,0.06)",
                        backgroundColor: isActive ? "var(--color-paper-light)" : "rgba(253, 252, 247, 0.4)",
                        boxShadow: isActive ? "0 4px 8px rgba(0,0,0,0.08)" : "none",
                        cursor: transitioning ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        position: "relative",
                        minHeight: "58px",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !transitioning) {
                          e.currentTarget.style.backgroundColor = "rgba(253, 252, 247, 0.85)";
                          e.currentTarget.style.transform = "translateX(2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !transitioning) {
                          e.currentTarget.style.backgroundColor = "rgba(253, 252, 247, 0.4)";
                          e.currentTarget.style.transform = "translateX(0px)";
                        }
                      }}
                    >
                      {/* Active indicator index stamp */}
                      <span
                        style={{
                          fontFamily: "var(--font-typewriter)",
                          fontSize: "10px",
                          fontWeight: "bold",
                          opacity: isActive ? 1 : 0.45,
                          minWidth: "20px",
                          color: isActive ? "var(--color-stamp-red)" : "inherit",
                        }}
                      >
                        #{String(idx + 1).padStart(2, "0")}
                      </span>

                      {/* Info block */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: "700",
                            color: "var(--color-ink-dark)",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            lineHeight: "1.2",
                          }}
                        >
                          {tx.description || tx.name || "—"}
                        </div>
                        <div style={{ 
                          fontSize: "10.5px", 
                          fontFamily: "var(--font-ledger)", 
                          color: "rgba(32,30,28,0.5)", 
                          marginTop: "3px",
                          lineHeight: "1.3"
                        }}>
                          {formatDateCompact(tx.date)} · {tx.account || "Checking"}
                        </div>
                      </div>

                      {/* Monospace Amount */}
                      <span
                        className="typewriter-num"
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: isIncome ? "var(--color-stamp-green)" : "var(--color-stamp-red)",
                        }}
                      >
                        {isIncome ? "+" : "−"}${fmt(parseFloat(tx.amount || 0))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =========================================================================
               RIGHT PAGE: DETAILED AUDIT & CLASSIFICATION DESK (65% Width)
               ========================================================================= */}
            <div
              style={{
                width: "65%",
                backgroundColor: "var(--color-paper-light)",
                display: "flex",
                flexDirection: "column",
                padding: "30px 40px 30px 50px", // extra left padding to clear binder rings
                backgroundImage: "linear-gradient(var(--color-paper-grid) 1px, transparent 1px)",
                backgroundSize: "100% 28px", // horizontal ledger lines
                position: "relative",
              }}
            >
              {/* Per-row line alignment helper block */}
              <div style={{ display: "flex", flexDirection: "column", height: "100%", zIndex: 2 }}>
                
                {/* Audit Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--color-ink-dark)", paddingBottom: "8px", height: "56px" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "14px", textTransform: "uppercase", fontWeight: "bold", margin: 0 }}>
                      VOUCHER AUDIT SHEET
                    </h3>
                    <span style={{ fontFamily: "var(--font-ledger)", fontSize: "9px", color: "rgba(32,30,28,0.5)", textTransform: "uppercase" }}>
                      Ledger ID: {activeTx.id?.toUpperCase() || "NEW-IMPORT"}
                    </span>
                  </div>

                  <span
                    className={`stamp stamp-${editType === "Income" ? "green" : (editType === "Bill" ? "blue" : "red")}`}
                    style={{
                      fontSize: "9px",
                      fontWeight: "900",
                      transform: "rotate(6deg)",
                      padding: "2px 6px",
                      borderWidth: "1.5px",
                    }}
                  >
                    {editType.toUpperCase()}
                  </span>
                </div>

                {/* Voucher display panel with visual transition */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    paddingTop: "20px",
                    opacity: transitioning ? 0.35 : 1,
                    transform: transitioning ? "translateY(-4px)" : "translateY(0)",
                    transition: "opacity 0.25s ease, transform 0.25s ease",
                  }}
                >
                  {/* Voucher Card Header block */}
                  <div
                    style={{
                      backgroundColor: "rgba(224, 212, 185, 0.15)",
                      border: "2px dashed var(--color-paper-grid)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      position: "relative",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Stamp Overlay Anim */}
                    {stampStatus === "approved" && (
                      <div
                        className="stamp stamp-green"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%) scale(1.6) rotate(-12deg)",
                          zIndex: 100,
                          fontSize: "18px",
                          fontWeight: "900",
                          backgroundColor: "rgba(253, 252, 247, 0.95)",
                          borderWidth: "3px",
                          letterSpacing: "2px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                        }}
                      >
                        POSTED APPROVED
                      </div>
                    )}

                    {stampStatus === "skipped" && (
                      <div
                        className="stamp stamp-red"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%) scale(1.5) rotate(15deg)",
                          zIndex: 100,
                          fontSize: "18px",
                          fontWeight: "900",
                          backgroundColor: "rgba(253, 252, 247, 0.95)",
                          borderWidth: "3px",
                          letterSpacing: "2px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                        }}
                      >
                        DEFERRED AUDIT
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", fontFamily: "var(--font-sans)", color: "var(--color-ink-dark)" }}>
                        {activeTx.description || activeTx.name || "—"}
                      </span>
                      <span
                        className="typewriter-num"
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: editType === "Income" ? "var(--color-stamp-green)" : "var(--color-stamp-red)",
                          fontFamily: "var(--font-ledger)",
                        }}
                      >
                        {editType === "Income" ? "+" : "−"}${fmt(parseFloat(activeTx.amount || 0))}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "rgba(32,30,28,0.55)", fontFamily: "var(--font-ledger)", borderTop: "1px dotted var(--color-paper-grid)", paddingTop: "8px" }}>
                      <span>DATE: <strong>{formatDateCompact(activeTx.date)}</strong></span>
                      <span>ACCOUNT: <strong>{activeTx.account || "Checking"}</strong></span>
                      <span>PERSON: <strong>{activeTx.person || "Ivan"}</strong></span>
                    </div>
                  </div>

                  {/* Audit inputs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginTop: "28px" }}>
                    
                    {/* Input: Description Rename */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)", letterSpacing: "0.5px" }}>
                        Merchant Name Cleanup / Voucher Description
                      </label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="e.g. Clean up Chase import..."
                        style={{
                          padding: "10px 14px",
                          border: "1px solid var(--color-paper-grid)",
                          borderRadius: "4px",
                          backgroundColor: "transparent",
                          fontFamily: "var(--font-sans)",
                          fontSize: "13px",
                          fontWeight: "500",
                          width: "100%",
                        }}
                      />
                    </div>

                    {/* Input: Segmented Controls for Class/Type */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)", letterSpacing: "0.5px" }}>
                        Authorize Voucher Ledger Class (Type)
                      </label>
                      <div className="segmented-control" style={{ width: "100%", height: "38px" }}>
                        {["Expense", "Income", "Bill", "Debt"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`segmented-tab ${editType === t ? "active" : ""}`}
                            onClick={() => handleTypeChange(t)}
                            style={{ fontSize: "11px", padding: "0" }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input: 1-Click Quick Category Stamps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)", letterSpacing: "0.5px", display: "flex", justifyContent: "space-between" }}>
                        <span>Quick-Stamp Category (Single Click)</span>
                        <span style={{ fontSize: "9px", opacity: 0.6, fontStyle: "italic" }}>Applies & posts immediately!</span>
                      </label>
                      
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "10px",
                        }}
                      >
                        {(QUICK_CATEGORIES[editType] || []).map((catName) => {
                          return (
                            <button
                              key={catName}
                              type="button"
                              onClick={() => handleCategorize(catName)}
                              style={{
                                padding: "10px 6px",
                                fontFamily: "var(--font-accent)",
                                fontSize: "10.5px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                border: "1px dashed var(--color-paper-edge)",
                                borderRadius: "4px",
                                backgroundColor: "rgba(235, 220, 185, 0.15)",
                                color: "var(--color-ink-dark)",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                textAlign: "center",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--color-manila-dark)";
                                e.currentTarget.style.borderStyle = "solid";
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(235, 220, 185, 0.15)";
                                e.currentTarget.style.borderStyle = "dashed";
                                e.currentTarget.style.transform = "translateY(0px)";
                              }}
                              title={`Categorize as ${catName}`}
                            >
                              {catName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input: Complete Dropdown Category Select */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "20px", alignItems: "end" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)", letterSpacing: "0.5px" }}>
                          Or Choose Other Category
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="paper-select-recessed"
                          style={{
                            width: "100%",
                            height: "38px",
                            padding: "6px 28px 6px 12px",
                            fontSize: "12.5px",
                            lineHeight: "1.2",
                          }}
                        >
                          {(categories[editType] || []).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Defer Button */}
                      <button
                        type="button"
                        onClick={handleSkip}
                        style={{
                          height: "38px",
                          width: "100%",
                          padding: "6px",
                          fontFamily: "var(--font-accent)",
                          fontSize: "10.5px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          color: "var(--color-stamp-red)",
                          backgroundColor: "transparent",
                          border: "1.5px dashed var(--color-stamp-red)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(127,29,29,0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        title="Skip and decide later"
                      >
                        Defer Audit
                      </button>
                    </div>

                  </div>

                  {/* Stamp Actions Footer */}
                  <div
                    style={{
                      borderTop: "2px double var(--color-ink-dark)",
                      paddingTop: "16px",
                      marginTop: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      height: "56px",
                    }}
                  >
                    {/* Progress details */}
                    <span style={{ fontSize: "11px", fontFamily: "var(--font-ledger)", color: "rgba(32,30,28,0.5)" }}>
                      AUDITING RECORD <strong>{activeIndex + 1}</strong> OF <strong>{uncategorizedList.length}</strong> IN SUSPENSE FILE
                    </span>

                    {/* Large stamp approved post button */}
                    <button
                      type="button"
                      onClick={() => handleCategorize(editCategory)}
                      disabled={!editCategory}
                      style={{
                        padding: "10px 24px",
                        fontFamily: "var(--font-accent)",
                        fontSize: "11px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "var(--color-paper-light)",
                        backgroundColor: "var(--color-stamp-green)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                        transition: "all 0.1s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#0f3d21";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-stamp-green)";
                        e.currentTarget.style.transform = "translateY(0px)";
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
                    >
                      <span>STAMP APPROVED & POST</span>
                      <span style={{ fontSize: "12px" }}>✍️</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
