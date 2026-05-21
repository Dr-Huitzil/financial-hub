import { useState } from "react";

export default function SetupTab({ 
  categories, 
  onUpdateCategories, 
  upcomingPayments, 
  onAddPayment, 
  onDeletePayment, 
  onUpdatePayment,
  creditCards = [],
  onUpdateCreditCards,
  budgetLimits = {},
  onUpdateBudgetLimits
}) {
  // Sub-tab navigation
  const [setupSubTab, setSetupSubTab] = useState("categories");

  // Category management states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [limitSearchTerm, setLimitSearchTerm] = useState("");
  const [limitSelectedType, setLimitSelectedType] = useState("Expense");



  // Credit Card states
  const [newCardName, setNewCardName] = useState("");
  const [newCardLimit, setNewCardLimit] = useState("");
  const [newCardBalance, setNewCardBalance] = useState("0");

  const handleUpdateCardField = (cardId, fieldName, value) => {
    const updated = creditCards.map(c => {
      if (c.id === cardId) {
        let val = fieldName === "name" ? value : parseFloat(value);
        if (isNaN(val) && fieldName !== "name") val = 0;
        return {
          ...c,
          [fieldName]: val
        };
      }
      return c;
    });
    onUpdateCreditCards(updated);
  };

  const handleDeleteCard = (cardId) => {
    const updated = creditCards.filter(c => c.id !== cardId);
    onUpdateCreditCards(updated);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCardName.trim() || !newCardLimit) return;

    const newCC = {
      id: `cc-${Date.now()}`,
      name: newCardName.trim(),
      limit: parseFloat(newCardLimit) || 0,
      balance: parseFloat(newCardBalance) || 0
    };

    onUpdateCreditCards([...creditCards, newCC]);
    setNewCardName("");
    setNewCardLimit("");
    setNewCardBalance("0");
  };

  // Handle adding custom flow category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const catTrimmed = newCategoryName.trim();
    const typeCats = categories[limitSelectedType] || [];
    if (typeCats.includes(catTrimmed)) return;

    const updated = {
      ...categories,
      [limitSelectedType]: [...typeCats, catTrimmed]
    };
    onUpdateCategories(updated);
    setNewCategoryName("");
  };

  // Handle deleting flow category
  const handleDeleteCategory = (catToDelete) => {
    const typeCats = categories[limitSelectedType] || [];
    const updated = {
      ...categories,
      [limitSelectedType]: typeCats.filter(c => c !== catToDelete)
    };
    onUpdateCategories(updated);
    // Also delete any scheduled payment and budget limit
    const existingBill = upcomingPayments.find(p => p.name === catToDelete);
    if (existingBill) {
      onDeletePayment(existingBill.id);
    }
  };

  // Handle updating category budget limit target
  const handleUpdateLimit = (category, limitVal) => {
    let numericLimit = parseFloat(limitVal);
    if (isNaN(numericLimit) || numericLimit < 0) numericLimit = 0;
    const updated = {
      ...budgetLimits,
      [category]: numericLimit
    };
    onUpdateBudgetLimits(updated);

    // Sync with scheduled bills if it exists
    const existingBill = upcomingPayments.find(p => p.name === category);
    if (existingBill) {
      onUpdatePayment(existingBill.id, { amount: numericLimit });
    }
  };

  const handleToggleScheduled = (category, isCurrentlyScheduled, existingBill, currentLimit) => {
    if (isCurrentlyScheduled) {
      onDeletePayment(existingBill.id);
    } else {
      const newBill = {
        id: Date.now(),
        name: category,
        amount: currentLimit,
        dueDate: "",
        paid: false
      };
      onAddPayment(newBill);
    }
  };



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview/Header Stamped Row */}
      <div className="tactile-card" style={{ border: "2px solid var(--color-ink-dark)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-accent)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Treasury Ledger Setup Control Panel
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "rgba(32,30,28,0.7)", fontFamily: "var(--font-sans)" }}>
            Configure your master categories and credit portfolio below. Click on a folder tab to switch views.
          </p>
        </div>
        <span className="stamp stamp-blue" style={{ transform: "rotate(-4deg)", fontSize: "9px" }}>
          SETUP REGISTRY
        </span>
      </div>

      {/* Skeuomorphic Folder Tab Headers */}
      <div className="budget-tabs-container" style={{ marginBottom: 0 }}>
        <button
          className={`budget-month-tab ${setupSubTab === "categories" ? "active" : ""}`}
          onClick={() => setSetupSubTab("categories")}
          style={{ minWidth: "150px" }}
        >
          Categories & Caps
        </button>
        <button
          className={`budget-month-tab ${setupSubTab === "credit" ? "active" : ""}`}
          onClick={() => setSetupSubTab("credit")}
          style={{ minWidth: "150px" }}
        >
          Credit Portfolio
        </button>

      </div>

      {/* Main Setup Folder Sheet */}
      <div className="budget-ledger-sheet" style={{ borderTopLeftRadius: setupSubTab === "categories" ? "0px" : "6px" }}>
        
        {/* SUB-TAB 1: Categories & Spending Caps */}
        {setupSubTab === "categories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "12px", marginBottom: "10px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "13px", margin: 0, textTransform: "uppercase" }}>
                  Master Category Targets & Scheduled Obligations
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "rgba(32,30,28,0.6)" }}>
                  Organize transaction category groups, define spending caps, and schedule recurring bills.
                </p>
              </div>
              <span className="stamp stamp-blue" style={{ fontSize: "8px", transform: "rotate(1deg)" }}>CATEGORIES</span>
            </div>

            <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }} className="sub-tabs-strip">
                {["Expense", "Bill", "Debt"].map((type) => (
                  <button
                    key={type}
                    className={`sub-tab-btn ${limitSelectedType === type ? "active" : ""}`}
                    onClick={() => setLimitSelectedType(type)}
                    style={{ marginBottom: 0 }}
                  >
                    {type}s
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search categories..."
                value={limitSearchTerm}
                onChange={(e) => setLimitSearchTerm(e.target.value)}
                style={{
                  padding: "6px 12px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  minWidth: "220px",
                  marginLeft: "auto"
                }}
              />
            </div>

            <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
              <table className="ledger-table" style={{ fontSize: "11.5px" }}>
                <thead>
                  <tr>
                    <th>Category / Schedule Status</th>
                    <th style={{ width: "180px" }}>Monthly Target Cap ($)</th>
                    <th style={{ textAlign: "center", width: "100px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(categories[limitSelectedType] || [])
                    .filter(cat => cat.toLowerCase().includes(limitSearchTerm.toLowerCase()))
                    .map((cat) => {
                      const currentLimit = budgetLimits[cat] !== undefined ? budgetLimits[cat] : 0;
                      const existingBill = upcomingPayments.find(p => p.name === cat);
                      const isScheduled = !!existingBill;

                      return (
                        <tr key={cat}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ fontWeight: "bold", fontFamily: "var(--font-sans)", fontSize: "13px" }}>{cat}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ textTransform: "uppercase", fontSize: "9px", opacity: 0.6, backgroundColor: "rgba(32,30,28,0.05)", padding: "2px 4px", borderRadius: "2px" }}>
                                  {limitSelectedType}
                                </span>
                                {isScheduled ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--color-stamp-blue)", fontWeight: "bold" }}>🗓️ Scheduled:</span>
                                    <input
                                      type="date"
                                      value={existingBill.dueDate}
                                      onChange={(e) => onUpdatePayment(existingBill.id, { dueDate: e.target.value })}
                                      style={{
                                        padding: "0 2px",
                                        border: "1px dashed transparent",
                                        backgroundColor: "transparent",
                                        fontFamily: "var(--font-ledger)",
                                        fontSize: "10px",
                                        color: "var(--color-stamp-blue)"
                                      }}
                                      onFocus={(e) => e.target.style.border = "1px dashed var(--color-stamp-blue)"}
                                      onBlur={(e) => e.target.style.border = "1px dashed transparent"}
                                    />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "10px", color: "rgba(32,30,28,0.4)", fontStyle: "italic" }}>Not scheduled</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", opacity: 0.5 }}>$</span>
                              <input
                                type="number"
                                value={currentLimit}
                                onChange={(e) => handleUpdateLimit(cat, e.target.value)}
                                placeholder="0"
                                style={{
                                  width: "100px",
                                  padding: "4px 8px",
                                  border: "1px dashed var(--color-paper-grid)",
                                  borderRadius: "4px",
                                  backgroundColor: "transparent",
                                  fontFamily: "var(--font-ledger)",
                                  fontWeight: "bold"
                                }}
                                onFocus={(e) => e.target.style.border = "1px solid var(--color-paper-grid)"}
                                onBlur={(e) => e.target.style.border = "1px dashed var(--color-paper-grid)"}
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "top", paddingTop: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", cursor: "pointer" }}>
                                <input 
                                  type="checkbox" 
                                  checked={isScheduled} 
                                  onChange={() => handleToggleScheduled(cat, isScheduled, existingBill, currentLimit)}
                                  style={{ cursor: "pointer", margin: 0 }}
                                />
                                {isScheduled ? "Unschedule" : "Schedule"}
                              </label>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-stamp-red)",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-typewriter)",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  textDecoration: "underline"
                                }}
                                title="Delete Category"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {(categories[limitSelectedType] || [])
                    .filter(cat => cat.toLowerCase().includes(limitSearchTerm.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                        No categories found in registry for "{limitSelectedType}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline Add Category Form */}
            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "10px", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "16px" }}>
              <input
                type="text"
                placeholder={`Add new ${limitSelectedType} category...`}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12px",
                  fontFamily: "var(--font-sans)"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "var(--color-paper-light)",
                  backgroundColor: "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                + Add Category
              </button>
            </form>
          </div>
        )}

        {/* SUB-TAB 2: Credit Card Registry */}
        {setupSubTab === "credit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--color-paper-grid)", paddingBottom: "12px", marginBottom: "15px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-accent)", fontSize: "13px", margin: 0, textTransform: "uppercase" }}>
                  Credit Card Registry & Portfolio Limits
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "rgba(32,30,28,0.6)" }}>
                  Add or edit credit accounts, total available card limits, and active ledger balances.
                </p>
              </div>
              <span className="stamp stamp-green" style={{ fontSize: "8px", transform: "rotate(-1deg)" }}>PORTFOLIO</span>
            </div>

            <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
              <table className="ledger-table" style={{ fontSize: "11.5px" }}>
                <thead>
                  <tr>
                    <th>Credit Card Identifier</th>
                    <th style={{ width: "150px" }}>Credit Limit ($)</th>
                    <th style={{ width: "150px" }}>Current Balance ($)</th>
                    <th style={{ textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditCards.map((c) => {
                    return (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleUpdateCardField(c.id, "name", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px dashed transparent",
                              backgroundColor: "transparent",
                              fontWeight: "bold"
                            }}
                            onFocus={(e) => e.target.style.border = "1px dashed var(--color-paper-grid)"}
                            onBlur={(e) => e.target.style.border = "1px dashed transparent"}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={c.limit}
                            onChange={(e) => handleUpdateCardField(c.id, "limit", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px dashed transparent",
                              backgroundColor: "transparent",
                              fontFamily: "var(--font-ledger)",
                              fontWeight: "bold"
                            }}
                            onFocus={(e) => e.target.style.border = "1px dashed var(--color-paper-grid)"}
                            onBlur={(e) => e.target.style.border = "1px dashed transparent"}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={c.balance}
                            onChange={(e) => handleUpdateCardField(c.id, "balance", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px dashed transparent",
                              backgroundColor: "transparent",
                              fontFamily: "var(--font-ledger)",
                              fontWeight: "bold"
                            }}
                            onFocus={(e) => e.target.style.border = "1px dashed var(--color-paper-grid)"}
                            onBlur={(e) => e.target.style.border = "1px dashed transparent"}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteCard(c.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-stamp-red)",
                              cursor: "pointer",
                              fontFamily: "var(--font-typewriter)",
                              fontSize: "11px",
                              fontWeight: "bold"
                            }}
                            title="Delete Card"
                          >
                            [DELETE]
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {creditCards.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                        No credit accounts registered in active portfolio setup.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Card Form */}
            <form onSubmit={handleAddCard} style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)" }}>Register New Credit Card Portfolio Asset</span>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "9px", fontWeight: "bold" }}>Card Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Discover It..."
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    required
                    style={{
                      padding: "8px",
                      border: "1px solid var(--color-paper-grid)",
                      borderRadius: "4px",
                      backgroundColor: "var(--color-paper-light)",
                      fontSize: "12px"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "9px", fontWeight: "bold" }}>Credit Limit ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000..."
                    value={newCardLimit}
                    onChange={(e) => setNewCardLimit(e.target.value)}
                    required
                    style={{
                      padding: "8px",
                      border: "1px solid var(--color-paper-grid)",
                      borderRadius: "4px",
                      backgroundColor: "var(--color-paper-light)",
                      fontSize: "12px",
                      fontFamily: "var(--font-ledger)"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "9px", fontWeight: "bold" }}>Current Balance ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 0..."
                    value={newCardBalance}
                    onChange={(e) => setNewCardBalance(e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid var(--color-paper-grid)",
                      borderRadius: "4px",
                      backgroundColor: "var(--color-paper-light)",
                      fontSize: "12px",
                      fontFamily: "var(--font-ledger)"
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{
                  padding: "10px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "var(--color-paper-light)",
                  backgroundColor: "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "5px"
                }}
              >
                Register Credit Account
              </button>
            </form>
          </div>
        )}



      </div>
    </div>
  );
}
