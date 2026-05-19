import React, { useState } from "react";

const DEFAULT_CATEGORIES = {
  Income: ["Paycheck 1", "Paycheck 2", "Overtime On Call", "Mileage", "Commission", "Business", "Side hustle", "Interest", "School Refund", "Cash"],
  Expense: ["Groceries", "Restaurant", "Games", "Fuel", "Car Maintenance", "Clothing", "Childcare", "Home", "Entertainment", "Pets", "Travel", "Electronics", "Personal Care", "Jessica", "Prison", "Snacks", "Work Equipment", "Gift", "Hobbies", "Thrifting", "Fast Food", "School"],
  Bill: ["Electricity", "Rent", "Insurance (Ford)", "Insurance (Volks)", "YouTube Premium", "Google One", "Cricket", "Post Office", "Mind Melt", "Websites", "WiFi", "KikOff", "Prison"],
  Debt: ["Discover It", "Freedom Chase", "Amazon Chase", "Sapphire Chase", "Personal Loans", "Capital One 1", "Capital One 2", "Credit One 1", "Credit One 2"]
};

const DEFAULT_ACCOUNTS = ["Checking", "Prepaid Card", "Gift Card", "Cash Envelopes", "Cash Wallet", "Savings Pool"];

export default function TransactionTab({ transactions, categories, onAddTransaction, onDeleteTransaction }) {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [type, setType] = useState("Expense");
  const [category, setCategory] = useState((categories?.Expense?.[0]) || "Groceries");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState(DEFAULT_ACCOUNTS[0]);
  const [description, setDescription] = useState("");
  const [person, setPerson] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  // Excel Batch Mode state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState([
    { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" },
    { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" },
    { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" }
  ]);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    details: {},
    onConfirm: null,
    confirmLabel: "AUTHORIZE",
    cancelLabel: "DENY",
    stamp: "PENDING"
  });

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory((categories?.[newType]?.[0]) || DEFAULT_CATEGORIES[newType]?.[0] || "");
  };

  // 1. Add row to Excel Batch Entry Sheet
  const handleAddBatchRow = () => {
    setBatchRows([
      ...batchRows,
      { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" }
    ]);
  };

  // 2. Modify field on Excel batch row index
  const handleUpdateBatchRow = (index, field, value) => {
    const updated = [...batchRows];
    updated[index][field] = value;
    if (field === "type") {
      const activeCats = categories?.[value] || DEFAULT_CATEGORIES[value] || [];
      updated[index].category = activeCats[0] || "";
    }
    setBatchRows(updated);
  };

  // 3. Remove row from Excel batch sheet
  const handleRemoveBatchRow = (index) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  // 4. Submit multiple Excel ledger entries
  const handleBatchSubmit = (e) => {
    e.preventDefault();
    const validRows = batchRows.filter(row => row.amount && parseFloat(row.amount) > 0);
    if (validRows.length === 0) {
      alert("Please enter a valid amount for at least one transaction row.");
      return;
    }

    const totalBatchAmount = validRows.reduce((sum, row) => sum + parseFloat(row.amount), 0);

    setConfirmState({
      isOpen: true,
      title: "Authorize Batch Ledger Posting?",
      stamp: "BATCH APPR",
      confirmLabel: "POST BATCH",
      cancelLabel: "ABANDON",
      details: {
        "Total Rows": `${validRows.length} Vouchers`,
        "Total Amount": `$${totalBatchAmount.toFixed(2)}`,
        "Debits (Out)": `${validRows.filter(r => r.type !== "Income").length} Entries`,
        "Credits (In)": `${validRows.filter(r => r.type === "Income").length} Entries`
      },
      onConfirm: () => {
        validRows.forEach((row) => {
          onAddTransaction({
            date: row.date,
            type: row.type,
            category: row.category,
            amount: parseFloat(row.amount),
            account: row.account,
            description: row.description || row.category,
            person: row.person || "Ivan",
            paid: true
          });
        });

        // Seed fresh batch template
        setBatchRows([
          { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" },
          { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" },
          { date: new Date().toISOString().substring(0, 10), type: "Expense", category: (categories?.Expense?.[0]) || "Groceries", account: DEFAULT_ACCOUNTS[0], description: "", amount: "", person: "Ivan" }
        ]);
        setIsBatchMode(false);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setConfirmState({
      isOpen: true,
      title: "Authorize Ledger Posting?",
      stamp: "APPROVED",
      confirmLabel: "POST ENTRY",
      cancelLabel: "ABANDON",
      details: {
        Date: date,
        Type: type,
        Category: category,
        Account: account,
        Amount: `$${parseFloat(amount).toFixed(2)}`,
        Description: description || category
      },
      onConfirm: () => {
        const newTx = {
          date,
          type,
          category,
          amount: parseFloat(amount),
          account,
          description: description || category,
          person: person || "Ivan",
          paid: true
        };

        onAddTransaction(newTx);
        setAmount("");
        setDescription("");
        setPerson("");
      }
    });
  };

  // Calculations for skeuomorphic balance cards
  // Base balances from Ivan's Excel Setup
  const STARTING_BALANCES = {
    Checking: 12547.32,
    "Prepaid Card": 0,
    "Gift Card": 0,
    "Cash Envelopes": 0,
    "Cash Wallet": 0,
    "Savings Pool": 4500.00
  };

  const calculatedBalances = { ...STARTING_BALANCES };
  
  transactions.forEach((tx) => {
    const amt = parseFloat(tx.amount || 0);
    const acct = tx.account || "Checking";
    if (tx.type === "Income") {
      calculatedBalances[acct] = (calculatedBalances[acct] || 0) + amt;
    } else {
      calculatedBalances[acct] = (calculatedBalances[acct] || 0) - amt;
    }
  });

  // Filters for ledger index
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch = tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All" || tx.type === filterType;
    
    let matchesMonth = true;
    if (selectedMonth !== "All" && tx.date) {
      const txMonthIndex = new Date(tx.date).getMonth();
      const targetMonthIndex = months.indexOf(selectedMonth);
      matchesMonth = txMonthIndex === targetMonthIndex;
    }
    
    return matchesSearch && matchesType && matchesMonth;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Account Balances Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
        {DEFAULT_ACCOUNTS.map((acct) => {
          const bal = calculatedBalances[acct] || 0;
          
          // Hide optional ledger envelopes if their balance displays zero
          const HIDE_IF_ZERO_ACCOUNTS = ["Prepaid Card", "Gift Card", "Cash Wallet", "Cash Envelopes"];
          if (HIDE_IF_ZERO_ACCOUNTS.includes(acct) && bal === 0) {
            return null;
          }

          return (
            <div 
              key={acct} 
              className="metric-stamp-card"
              style={{
                backgroundColor: "var(--color-paper-light)",
                border: "1.5px solid var(--color-paper-grid)",
                padding: "14px 10px",
                boxShadow: "var(--shadow-paper)"
              }}
            >
              <span className="metric-stamp-label" style={{ fontSize: "9px" }}>{acct} Ledger</span>
              <span 
                className="metric-stamp-value" 
                style={{ 
                  fontSize: "15px", 
                  color: bal >= 0 ? "var(--color-stamp-green)" : "var(--color-stamp-red)",
                  fontFamily: "var(--font-ledger)"
                }}
              >
                ${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>

      {/* View Mode Toggle Stamped Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "-16px", zIndex: 5 }}>
        <button
          onClick={() => setIsBatchMode(false)}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-accent)",
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
            backgroundColor: !isBatchMode ? "var(--color-ink-dark)" : "var(--color-manila-light)",
            color: !isBatchMode ? "var(--color-paper-light)" : "var(--color-ink-dark)",
            border: "1.5px solid var(--color-ink-dark)",
            borderBottom: "none",
            borderRadius: "14px 14px 0 0",
            cursor: "pointer",
            transform: !isBatchMode ? "translateY(2px)" : "none",
            boxShadow: !isBatchMode ? "none" : "inset 0 -2px 4px rgba(0,0,0,0.05)"
          }}
        >
          Single Entry
        </button>
        <button
          onClick={() => setIsBatchMode(true)}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-accent)",
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
            backgroundColor: isBatchMode ? "var(--color-ink-dark)" : "var(--color-manila-light)",
            color: isBatchMode ? "var(--color-paper-light)" : "var(--color-ink-dark)",
            border: "1.5px solid var(--color-ink-dark)",
            borderBottom: "none",
            borderRadius: "14px 14px 0 0",
            cursor: "pointer",
            transform: isBatchMode ? "translateY(2px)" : "none",
            boxShadow: isBatchMode ? "none" : "inset 0 -2px 4px rgba(0,0,0,0.05)"
          }}
        >
          Batch Entry
        </button>
      </div>

      {isBatchMode ? (
        /* Full-Width Spreadsheet Mode Layout */
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Card 1: Batch Spreadsheet Table Card */}
          <div className="tactile-card" style={{ border: "2px solid var(--color-ink-dark)", overflowX: "auto" }}>
            <div className="card-title" style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>Batch Transaction Entry</span>
                <span className="stamp stamp-blue" style={{ fontSize: "8px", transform: "rotate(-3deg)" }}>BATCH SHEETS</span>
              </div>
              <div className="barcode-stamp" style={{ opacity: 0.7 }}>
                <span className="barcode-stripes" style={{ display: "inline-block", width: "70px", height: "12px" }}></span>
                <span className="barcode-text" style={{ fontSize: "6px" }}>SPREAD-VO-99</span>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.75)", marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
              Direct spreadsheet replication. Fill rows in parallel and hit Post. Incomplete or empty rows are automatically bypassed.
            </p>

            <form onSubmit={handleBatchSubmit}>
              <div style={{ overflowX: "auto" }}>
                <table className="ledger-table" style={{ width: "100%", fontSize: "11.5px", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "120px" }}>Date</th>
                      <th style={{ width: "110px" }}>Type</th>
                      <th style={{ width: "150px" }}>Flow Category</th>
                      <th style={{ width: "140px" }}>Account</th>
                      <th>Description / Merchant</th>
                      <th style={{ width: "100px" }}>Amount ($)</th>
                      <th style={{ width: "100px" }}>Person</th>
                      <th style={{ width: "60px", textAlign: "center" }}>Void</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleUpdateBatchRow(idx, "date", e.target.value)}
                            required
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontFamily: "var(--font-ledger)", fontSize: "11px" }}
                          />
                        </td>
                        <td>
                          <select
                            value={row.type}
                            onChange={(e) => handleUpdateBatchRow(idx, "type", e.target.value)}
                            style={{ width: "100%", padding: "5px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "11.5px" }}
                          >
                            <option value="Expense">Expense</option>
                            <option value="Income">Income</option>
                            <option value="Bill">Bill</option>
                            <option value="Debt">Debt</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={row.category}
                            onChange={(e) => handleUpdateBatchRow(idx, "category", e.target.value)}
                            style={{ width: "100%", padding: "5px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "11.5px" }}
                          >
                            {(categories?.[row.type] || DEFAULT_CATEGORIES[row.type] || []).map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={row.account}
                            onChange={(e) => handleUpdateBatchRow(idx, "account", e.target.value)}
                            style={{ width: "100%", padding: "5px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "11.5px" }}
                          >
                            {DEFAULT_ACCOUNTS.map((acct) => (
                              <option key={acct} value={acct}>{acct}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Voucher Merchant/Details..."
                            value={row.description}
                            onChange={(e) => handleUpdateBatchRow(idx, "description", e.target.value)}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "11.5px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={row.amount}
                            onChange={(e) => handleUpdateBatchRow(idx, "amount", e.target.value)}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontFamily: "var(--font-ledger)", fontWeight: "bold", fontSize: "11.5px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Ivan"
                            value={row.person}
                            onChange={(e) => handleUpdateBatchRow(idx, "person", e.target.value)}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "11.5px" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(idx)}
                            style={{ background: "none", border: "none", color: "var(--color-stamp-red)", cursor: "pointer", fontWeight: "bold", fontFamily: "var(--font-typewriter)", fontSize: "11px" }}
                            disabled={batchRows.length <= 1}
                            title="Exclude Row"
                          >
                            [VOID]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={handleAddBatchRow}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "var(--font-accent)",
                    fontSize: "9px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "var(--color-ink-dark)",
                    backgroundColor: "var(--color-manila-light)",
                    border: "1.5px solid var(--color-paper-grid)",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  + Add Ledger Row
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    fontFamily: "var(--font-accent)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "var(--color-paper-light)",
                    backgroundColor: "var(--color-stamp-green)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                  }}
                >
                  Post Batch Entries
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Audit Journal Log Book underneath in spreadsheet view */}
          <div className="tactile-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="card-title">
              <span>Transaction History</span>
              <span className="stamp stamp-blue" style={{ fontSize: "8px", transform: "rotate(-1deg)" }}>ARCHIVE LOGS</span>
            </div>
            
            {/* Filter Log Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search description/category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "12.5px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)"
                }}
              />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-manila-light)", cursor: "pointer", fontSize: "11.5px", fontWeight: "bold", fontFamily: "var(--font-accent)" }}
              >
                <option value="All">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-manila-light)", cursor: "pointer", fontSize: "11.5px", fontWeight: "bold", fontFamily: "var(--font-accent)" }}
              >
                <option value="All">All Vouchers</option>
                <option value="Expense">Expenses Only</option>
                <option value="Income">Incomes Only</option>
                <option value="Bill">Bills Only</option>
                <option value="Debt">Debts Only</option>
              </select>
            </div>

            <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="ledger-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Journal Entry</th>
                    <th>Account</th>
                    <th className="number-cell">Credit (+)</th>
                    <th className="number-cell">Debit (-)</th>
                    <th style={{ textAlign: "center" }}>Void</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: "var(--font-ledger)" }}>{tx.date}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "bold" }}>{tx.description}</span>
                          <span style={{ fontSize: "9.5px", color: "rgba(32,30,28,0.5)" }}>{tx.category} • {tx.person || "Ivan"}</span>
                        </div>
                      </td>
                      <td>{tx.account}</td>
                      <td className="number-cell" style={{ color: tx.type === "Income" ? "var(--color-stamp-green)" : "inherit" }}>
                        {tx.type === "Income" ? `+$${tx.amount.toFixed(2)}` : ""}
                      </td>
                      <td className="number-cell" style={{ color: tx.type !== "Income" ? "var(--color-stamp-red)" : "inherit" }}>
                        {tx.type !== "Income" ? `-$${tx.amount.toFixed(2)}` : ""}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => {
                            setConfirmState({
                              isOpen: true,
                              title: "Void Journal Entry?",
                              stamp: "VOID",
                              confirmLabel: "VOID ENTRY",
                              cancelLabel: "RETAIN",
                              details: {
                                Date: tx.date,
                                Account: tx.account,
                                Description: tx.description,
                                Amount: `$${tx.amount.toFixed(2)}`
                              },
                              onConfirm: () => onDeleteTransaction(tx.id)
                            });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-stamp-red)",
                            fontFamily: "var(--font-typewriter)",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            padding: "2px 6px"
                          }}
                        >
                          [VOID]
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTxs.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic", padding: "30px", opacity: 0.5 }}>
                        No general ledger transactions found matching active search indices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-ledger)", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "12px" }}>
              <span>Posted Entries: <strong>{filteredTxs.length}</strong></span>
              <span>Total Debited Out: <strong>${filteredTxs.filter(tx => tx.type !== "Income").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Total Credited In: <strong>${filteredTxs.filter(tx => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* Original Single Voucher Entry Split Layout */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px" }} className="overview-grid">
          
          {/* Transaction Voucher Form */}
          <div className="tactile-card" style={{ height: "fit-content", border: "2.5px solid var(--color-ink-dark)" }}>
            <div className="card-title" style={{ marginBottom: "15px" }}>
              <span>Transaction Entry</span>
              <span className="stamp stamp-red" style={{ fontSize: "8px", transform: "rotate(4deg)" }}>POSTED</span>
            </div>

            <p style={{ fontSize: "12px", color: "rgba(32,30,28,0.75)", marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
              Complete the fields below to register and post a transaction. Authorizations are saved in real-time.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontFamily: "var(--font-ledger)" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => handleTypeChange(e.target.value)}
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", cursor: "pointer" }}
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income Receipt</option>
                    <option value="Bill">Scheduled Bill</option>
                    <option value="Debt">Debt Repayment</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Flow Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", cursor: "pointer" }}
                  >
                    {(categories?.[type] || DEFAULT_CATEGORIES[type] || []).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Account</label>
                  <select 
                    value={account} 
                    onChange={(e) => setAccount(e.target.value)}
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", cursor: "pointer" }}
                  >
                    {DEFAULT_ACCOUNTS.map((acct) => (
                      <option key={acct} value={acct}>{acct}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Description</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Costco wholesale"
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "12.5px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="120.50"
                    style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontFamily: "var(--font-ledger)", fontWeight: "bold" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Debited / Credited Person (Optional)</label>
                <input 
                  type="text" 
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="e.g. Jessica, Ivan"
                  style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-paper-light)", fontSize: "12.5px" }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  padding: "12px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "var(--color-paper-light)",
                  backgroundColor: "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  marginTop: "10px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#1b4a35"}
                onMouseOut={(e) => e.target.style.backgroundColor = "var(--color-stamp-green)"}
              >
                Post Ledger Entry
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
              <div className="barcode-stamp" style={{ opacity: 0.7 }}>
                <div className="barcode-stripes" style={{ width: "90px", height: "14px" }}></div>
                <span className="barcode-text" style={{ fontSize: "7px" }}>ENTRY-VO-2026</span>
              </div>
            </div>
          </div>

          {/* Ledger table log */}
          <div className="tactile-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="card-title">
              <span>Transaction History</span>
              <span className="barcode-text" style={{ fontSize: "8px" }}>LEDG-IDX-88A</span>
            </div>
            
            {/* Table Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Search description/category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "12.5px",
                  border: "1px solid var(--color-paper-grid)",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-paper-light)"
                }}
              />

              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-manila-light)", cursor: "pointer", fontSize: "11.5px", fontWeight: "bold", fontFamily: "var(--font-accent)" }}
              >
                <option value="All">All Months</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                style={{ padding: "8px", border: "1px solid var(--color-paper-grid)", borderRadius: "4px", backgroundColor: "var(--color-manila-light)", cursor: "pointer", fontSize: "11.5px", fontWeight: "bold", fontFamily: "var(--font-accent)" }}
              >
                <option value="All">All Vouchers</option>
                <option value="Expense">Expenses Only</option>
                <option value="Income">Incomes Only</option>
                <option value="Bill">Bills Only</option>
                <option value="Debt">Debts Only</option>
              </select>
            </div>

            {/* Ledger Table */}
            <div className="ledger-table-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="ledger-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Journal Entry</th>
                    <th>Account</th>
                    <th className="number-cell">Credit (+)</th>
                    <th className="number-cell">Debit (-)</th>
                    <th style={{ textAlign: "center" }}>Void</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: "var(--font-ledger)" }}>{tx.date}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "bold" }}>{tx.description}</span>
                          <span style={{ fontSize: "9.5px", color: "rgba(32,30,28,0.5)" }}>{tx.category} • {tx.person || "Ivan"}</span>
                        </div>
                      </td>
                      <td>{tx.account}</td>
                      <td className="number-cell" style={{ color: tx.type === "Income" ? "var(--color-stamp-green)" : "inherit" }}>
                        {tx.type === "Income" ? `+$${tx.amount.toFixed(2)}` : ""}
                      </td>
                      <td className="number-cell" style={{ color: tx.type !== "Income" ? "var(--color-stamp-red)" : "inherit" }}>
                        {tx.type !== "Income" ? `-$${tx.amount.toFixed(2)}` : ""}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setConfirmState({
                              isOpen: true,
                              title: "Void Journal Entry?",
                              stamp: "VOID",
                              confirmLabel: "VOID ENTRY",
                              cancelLabel: "RETAIN",
                              details: {
                                Date: tx.date,
                                Account: tx.account,
                                Description: tx.description,
                                Amount: `$${tx.amount.toFixed(2)}`
                              },
                              onConfirm: () => {
                                onDeleteTransaction(tx.id);
                              }
                            });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-stamp-red)",
                            cursor: "pointer",
                            fontFamily: "var(--font-typewriter)",
                            fontSize: "12px",
                            fontWeight: "bold",
                            padding: "2px 6px"
                          }}
                          title="Void Journal Entry"
                        >
                          [VOID]
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTxs.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic", padding: "30px" }}>
                        No ledger vouchers posted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-ledger)", borderTop: "1px dashed var(--color-paper-grid)", paddingTop: "12px" }}>
              <span>Posted Entries: <strong>{filteredTxs.length}</strong></span>
              <span>Total Debited Out: <strong>${filteredTxs.filter(tx => tx.type !== "Income").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Total Credited In: <strong>${filteredTxs.filter(tx => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* Retro Manila Custom Dialog Caching Authorization Overlay */}
      {confirmState.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(32, 30, 28, 0.45)",
          backdropFilter: "blur(3px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div className="tactile-card" style={{
            width: "370px",
            backgroundColor: "var(--color-paper-light)",
            border: "3.5px solid var(--color-ink-dark)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
            padding: "26px",
            position: "relative",
            transform: "rotate(-1.5deg)",
            backgroundImage: "radial-gradient(var(--color-paper-grid) 1px, transparent 1px)",
            backgroundSize: "18px 18px"
          }}>
            {/* Skeuomorphic Stamp Box */}
            <span className={`stamp stamp-${confirmState.stamp === "VOID" ? "red" : "blue"}`} style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "1px",
              transform: "rotate(8deg)",
              borderWidth: "2px",
              padding: "4px 8px"
            }}>
              {confirmState.stamp}
            </span>

            <div style={{
              fontFamily: "var(--font-accent)",
              fontSize: "13px",
              fontWeight: "bold",
              color: "var(--color-ink-dark)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              borderBottom: "2.5px solid var(--color-ink-dark)",
              paddingBottom: "8px",
              marginBottom: "18px"
            }}>
              {confirmState.title}
            </div>

            <div style={{
              fontFamily: "var(--font-typewriter)",
              fontSize: "12px",
              lineHeight: "1.7",
              color: "var(--color-ink-dark)",
              marginBottom: "24px"
            }}>
              {Object.entries(confirmState.details).map(([key, val]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", borderBottom: "1px dashed var(--color-paper-grid)", padding: "5px 0" }}>
                  <span style={{ textTransform: "uppercase", fontSize: "10px", opacity: 0.6, fontWeight: "bold" }}>{key}:</span>
                  <strong style={{ fontFamily: "var(--font-ledger)", color: confirmState.stamp === "VOID" && key === "Amount" ? "var(--color-stamp-red)" : "inherit" }}>
                    {val}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <button
                onClick={() => {
                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  padding: "10px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--color-stamp-red)",
                  backgroundColor: "transparent",
                  border: "2px dashed var(--color-stamp-red)",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  padding: "10px",
                  fontFamily: "var(--font-accent)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--color-paper-light)",
                  backgroundColor: confirmState.stamp === "VOID" ? "var(--color-stamp-red)" : "var(--color-stamp-green)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                }}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
