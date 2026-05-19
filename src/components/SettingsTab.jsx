import React, { useState } from "react";

export default function SettingsTab({ 
  categories, 
  onUpdateCategories, 
  upcomingPayments, 
  onAddPayment, 
  onDeletePayment, 
  onUpdatePayment,
  goals,
  onAddGoal,
  onDeleteGoal,
  onUpdateGoal,
  creditCards = [],
  onUpdateCreditCards
}) {
  // Category management states
  const [selectedType, setSelectedType] = useState("Expense");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Recurring Bill states
  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDueDate, setNewBillDueDate] = useState("");

  // Goal states
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("Savings");

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
    const typeCats = categories[selectedType] || [];
    if (typeCats.includes(catTrimmed)) return;

    const updated = {
      ...categories,
      [selectedType]: [...typeCats, catTrimmed]
    };
    onUpdateCategories(updated);
    setNewCategoryName("");
  };

  // Handle deleting flow category
  const handleDeleteCategory = (catToDelete) => {
    const typeCats = categories[selectedType] || [];
    const updated = {
      ...categories,
      [selectedType]: typeCats.filter(c => c !== catToDelete)
    };
    onUpdateCategories(updated);
  };

  // Handle adding recurring bill
  const handleAddBill = (e) => {
    e.preventDefault();
    if (!newBillName || !newBillAmount || !newBillDueDate) return;

    const newBill = {
      id: Date.now(),
      name: newBillName,
      amount: parseFloat(newBillAmount),
      dueDate: newBillDueDate,
      paid: false
    };

    onAddPayment(newBill);
    setNewBillName("");
    setNewBillAmount("");
    setNewBillDueDate("");
  };

  // Handle adding a savings goal in setup
  const handleAddGoalSetup = (e) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;

    const newGoalObj = {
      id: Date.now(),
      name: newGoalName,
      target: parseFloat(newGoalTarget),
      current: 0,
      category: newGoalCategory
    };

    onAddGoal(newGoalObj);
    setNewGoalName("");
    setNewGoalTarget("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Overview/Header Stamped Row */}
      <div className="tactile-card" style={{ border: "2px solid var(--color-ink-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-accent)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Treasury Ledger Setup Control Panel
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "rgba(32,30,28,0.7)", fontFamily: "var(--font-sans)" }}>
            Comptroller permissions granted. Manage categories, recurring bill schedules, and milestone targets below.
          </p>
        </div>
        <span className="stamp stamp-blue" style={{ transform: "rotate(-4deg)", fontSize: "9px" }}>
          OFFICIAL SYSTEM
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "30px" }} className="overview-grid">
        
        {/* Left Side: Categories Registry & Savings Goals Setup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Card 1: Categories Registry */}
          <div className="tactile-card" style={{ height: "fit-content" }}>
            <div className="card-title" style={{ marginBottom: "15px" }}>
              <span>Flow Categories Registry</span>
              <span className="stamp stamp-red" style={{ fontSize: "7px", transform: "rotate(3deg)" }}>INDEX REG</span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              {["Expense", "Income", "Bill", "Debt"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    fontFamily: "var(--font-accent)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    backgroundColor: selectedType === type ? "var(--color-ink-dark)" : "var(--color-manila-light)",
                    color: selectedType === type ? "var(--color-paper-light)" : "var(--color-ink-dark)",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* List of active categories */}
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px", 
              padding: "12px", 
              backgroundColor: "rgba(32,30,28,0.03)", 
              border: "1px dashed var(--color-paper-grid)", 
              borderRadius: "6px",
              minHeight: "100px",
              maxHeight: "200px",
              overflowY: "auto",
              marginBottom: "16px"
            }}>
              {(categories[selectedType] || []).map((cat) => (
                <div 
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    backgroundColor: "var(--color-paper-light)",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-typewriter)"
                  }}
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-stamp-red)",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 2px"
                    }}
                    title={`Delete category: ${cat}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(categories[selectedType] || []).length === 0 && (
                <span style={{ fontSize: "11px", fontStyle: "italic", margin: "auto", color: "rgba(32,30,28,0.5)" }}>
                  No categories in registry.
                </span>
              )}
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder={`New ${selectedType} Category...`}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "12px"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 14px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "9px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "var(--color-paper-light)",
                  backgroundColor: "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                + Add
              </button>
            </form>
          </div>

          {/* Card 2: Milestone Savings Goals Setup */}
          <div className="tactile-card" style={{ height: "fit-content" }}>
            <div className="card-title" style={{ marginBottom: "15px" }}>
              <span>Milestone Savings Setup</span>
              <span className="stamp stamp-blue" style={{ fontSize: "7px", transform: "rotate(-2deg)" }}>SAVINGS</span>
            </div>

            {/* Goals registry table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {goals.map((g) => (
                <div 
                  key={g.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: "1px dashed var(--color-paper-grid)"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "bold" }}>{g.name}</span>
                    <span style={{ fontSize: "10px", opacity: 0.6 }}>{g.category || "Savings"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "10px", textTransform: "uppercase", opacity: 0.5 }}>Target:</span>
                      <input
                        type="number"
                        value={g.target}
                        onChange={(e) => onUpdateGoal(g.id, { target: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "70px",
                          padding: "4px",
                          fontSize: "11px",
                          fontFamily: "var(--font-ledger)",
                          border: "1px solid var(--color-paper-grid)",
                          borderRadius: "4px",
                          backgroundColor: "var(--color-paper-light)"
                        }}
                      />
                    </div>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-stamp-red)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontFamily: "var(--font-typewriter)",
                        fontSize: "12px"
                      }}
                      title="Delete Goal"
                    >
                      [DELETE]
                    </button>
                  </div>
                </div>
              ))}
              {goals.length === 0 && (
                <span style={{ fontSize: "11px", fontStyle: "italic", textAlign: "center", padding: "10px" }}>
                  No savings milestones registered.
                </span>
              )}
            </div>

            {/* Quick Add Goal Form */}
            <form onSubmit={handleAddGoalSetup} style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "14px" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)" }}>Register New Savings Milestone</span>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Milestone Name (e.g. Volks Insurance)..."
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  required
                  style={{
                    padding: "8px",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-paper-light)",
                    fontSize: "12px"
                  }}
                />
                <input
                  type="number"
                  placeholder="Target ($)..."
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
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
              <button
                type="submit"
                style={{
                  padding: "8px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "9px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "var(--color-paper-light)",
                  backgroundColor: "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Register Goal
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Recurring Bills Setup */}
        <div className="tactile-card" style={{ height: "fit-content" }}>
          <div className="card-title" style={{ marginBottom: "15px" }}>
            <span>Scheduled Monthly Obligation Ledger</span>
            <span className="barcode-stamp" style={{ opacity: 0.7 }}>
              <span className="barcode-stripes" style={{ display: "inline-block", width: "70px", height: "12px" }}></span>
              <span className="barcode-text" style={{ fontSize: "6px" }}>BILLS-IDX-88</span>
            </span>
          </div>

          <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.75)", marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
            These scheduled items populate your Overview Tab checkbox. Edit amounts or dates directly, and they will update your dashboard instantly.
          </p>

          {/* List of Bills Table */}
          <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
            <table className="ledger-table" style={{ fontSize: "11.5px" }}>
              <thead>
                <tr>
                  <th>Obligation Name</th>
                  <th style={{ width: "80px" }}>Amount ($)</th>
                  <th style={{ width: "100px" }}>Due Date</th>
                  <th style={{ textAlign: "center", width: "80px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => onUpdatePayment(p.id, { name: e.target.value })}
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
                        value={p.amount}
                        onChange={(e) => onUpdatePayment(p.id, { amount: parseFloat(e.target.value) || 0 })}
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
                        type="date"
                        value={p.dueDate}
                        onChange={(e) => onUpdatePayment(p.id, { dueDate: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "2px",
                          border: "1px dashed transparent",
                          backgroundColor: "transparent",
                          fontFamily: "var(--font-ledger)",
                          fontSize: "10.5px"
                        }}
                        onFocus={(e) => e.target.style.border = "1px dashed var(--color-paper-grid)"}
                        onBlur={(e) => e.target.style.border = "1px dashed transparent"}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => onDeletePayment(p.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-stamp-red)",
                          cursor: "pointer",
                          fontFamily: "var(--font-typewriter)",
                          fontSize: "11px",
                          fontWeight: "bold"
                        }}
                        title="Delete obligation"
                      >
                        [DELETE]
                      </button>
                    </td>
                  </tr>
                ))}
                {upcomingPayments.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                      No scheduled obligations registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Scheduled Bill Form */}
          <form onSubmit={handleAddBill} style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "16px" }}>
            <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.6)" }}>Register Scheduled Recurring Obligation</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <label style={{ fontSize: "8px", fontWeight: "bold" }}>Bill Name</label>
                <input
                  type="text"
                  placeholder="e.g. WiFi Bill..."
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  required
                  style={{
                    padding: "6px",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-paper-light)",
                    fontSize: "11.5px"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <label style={{ fontSize: "8px", fontWeight: "bold" }}>Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 50.00..."
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  required
                  style={{
                    padding: "6px",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-paper-light)",
                    fontSize: "11.5px",
                    fontFamily: "var(--font-ledger)"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <label style={{ fontSize: "8px", fontWeight: "bold" }}>Due Date</label>
                <input
                  type="date"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  required
                  style={{
                    padding: "5px",
                    border: "1px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-paper-light)",
                    fontSize: "11.5px",
                    fontFamily: "var(--font-ledger)"
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                padding: "8px",
                fontFamily: "var(--font-accent)",
                fontSize: "9px",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: "var(--color-paper-light)",
                backgroundColor: "var(--color-stamp-green)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Add Scheduled Obligation
            </button>
          </form>
        </div>

      </div>

      {/* Card 4: Credit Card Available Credit Registry (Full Width) */}
      <div className="tactile-card" style={{ height: "fit-content" }}>
        <div className="card-title" style={{ marginBottom: "15px" }}>
          <span>Credit Card Registry & Portfolio Limits</span>
          <span className="stamp stamp-green" style={{ fontSize: "8px", transform: "rotate(-1deg)" }}>PORTFOLIO</span>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.75)", marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
          Adjust your active credit limits and balances inline. Total available portfolio credit and utilization bars on the Overview Tab will update instantly.
        </p>

        <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
          <table className="ledger-table" style={{ fontSize: "11.5px" }}>
            <thead>
              <tr>
                <th>Credit Card Name</th>
                <th style={{ width: "120px" }}>Limit ($)</th>
                <th style={{ width: "120px" }}>Balance ($)</th>
                <th style={{ width: "120px" }}>Available Credit ($)</th>
                <th style={{ width: "100px" }}>Utilization</th>
                <th style={{ textAlign: "center", width: "80px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {creditCards.map((c) => {
                const available = Math.max(0, c.limit - c.balance);
                const utilization = c.limit > 0 ? Math.round((c.balance / c.limit) * 100) : 0;
                let utilColor = "var(--color-stamp-green)"; // < 30%
                if (utilization >= 50) {
                  utilColor = "var(--color-stamp-red)"; // >= 50%
                } else if (utilization >= 30) {
                  utilColor = "#b45309"; // 30% - 50% (amber)
                }

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
                    <td style={{ fontFamily: "var(--font-ledger)", fontWeight: "bold" }}>
                      ${available.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: "bold", 
                        color: utilColor,
                        fontFamily: "var(--font-ledger)"
                      }}>
                        {utilization}%
                      </span>
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
                  <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                    No credit cards registered in available portfolio limits registry.
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
              <label style={{ fontSize: "8px", fontWeight: "bold" }}>Card Name</label>
              <input
                type="text"
                placeholder="e.g. Chase Sapphire..."
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                required
                style={{
                  padding: "6px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "11.5px"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "8px", fontWeight: "bold" }}>Credit Limit ($)</label>
              <input
                type="number"
                placeholder="e.g. 5000..."
                value={newCardLimit}
                onChange={(e) => setNewCardLimit(e.target.value)}
                required
                style={{
                  padding: "6px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "11.5px",
                  fontFamily: "var(--font-ledger)"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "8px", fontWeight: "bold" }}>Current Balance ($)</label>
              <input
                type="number"
                placeholder="e.g. 1500..."
                value={newCardBalance}
                onChange={(e) => setNewCardBalance(e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)",
                  fontSize: "11.5px",
                  fontFamily: "var(--font-ledger)"
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              padding: "8px",
              fontFamily: "var(--font-accent)",
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "var(--color-paper-light)",
              backgroundColor: "var(--color-stamp-green)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Register Credit Card
          </button>
        </form>
      </div>

    </div>
  );
}
