import React, { useState, useEffect } from "react";

/**
 * TransactionModal component
 * Implements a floating action button (FAB) in the bottom-right corner.
 * Clicking the FAB opens a beautiful skeuomorphic center overlay card modal
 * in the manila folder style for new transaction voucher authorization.
 *
 * @param {Object} categories - Pre-defined category groups from parent state
 * @param {function} onAddTransaction - Authorized transaction submission handler
 */
export default function TransactionModal({ categories = {}, onAddTransaction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryMode, setEntryMode] = useState("single");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batchRows, setBatchRows] = useState([
    { id: 1, date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: "" },
    { id: 2, date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: "" },
    { id: 3, date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: "" }
  ]);

  // Form states for transaction record
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Expense");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Search & Filter Category States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Account states for transfers
  const [fromAccount, setFromAccount] = useState("Checking");
  const [toAccount, setToAccount] = useState("Savings");

  // Compute filtered categories matching selected Voucher Class (type)
  const categoryOptions = categories[type] || [];
  const filteredCategories = categoryOptions.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setIsSubmitting(true);

    try {
      if (entryMode === "batch") {
        const txArray = batchRows
          .filter(row => row.description.trim() !== "" && row.amount !== "")
          .map(row => ({
            description: row.description.trim(),
            amount: parseFloat(row.amount) || 0,
            category: row.category || (categories[row.type]?.[0] || ""),
            type: row.type,
            date: row.date
          }));
        
        if (txArray.length > 0 && onAddTransaction) {
          await onAddTransaction(txArray);
        } else {
          throw new Error("Please enter a description and amount for at least one row in the batch.");
        }
      } else {
        const isTransfer = type === "Transfer";
        if (!desc.trim() || !amount || (!isTransfer && !category)) throw new Error("Please fill in all required fields.");
        if (isTransfer && fromAccount === toAccount) throw new Error("Source and Destination accounts cannot be identical.");

        const newTx = {
          description: desc.trim(),
          amount: parseFloat(amount) || 0,
          category: isTransfer ? "Transfer" : category,
          type,
          date,
          ...(isTransfer ? { fromAccount, toAccount } : {})
        };

        if (onAddTransaction) {
          await onAddTransaction(newTx);
        }
      }

      // Reset form states & close modal
      setDesc("");
      setAmount("");
      setCategorySearchQuery("");
      setIsCategoryDropdownOpen(false);
      setBatchRows([
        { id: Date.now(), date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: categories["Expense"]?.[0] || "" },
        { id: Date.now()+1, date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: categories["Expense"]?.[0] || "" },
        { id: Date.now()+2, date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: categories["Expense"]?.[0] || "" }
      ]);
      setIsOpen(false);
    } catch (err) {
      console.error("Submission error:", err);
      setLocalError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. Fixed FAB Trigger in bottom-right corner */}
      <button 
        className="fab-trigger" 
        onClick={() => {
          setIsOpen(true);
          setLocalError("");
          const defaultCat = categories[type]?.[0] || "";
          setCategory(defaultCat);
          setCategorySearchQuery("");
          setIsCategoryDropdownOpen(false);
        }}
        title="Post New Transaction Voucher"
      >
        <span className="fab-plus">+</span>
      </button>

      {/* 2. Manila Card Overlay Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="modal-card manila-folder-modal" 
            style={{ maxWidth: entryMode === "batch" ? "850px" : undefined, transition: "max-width 0.3s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Folder tab peak to align with cabinet style */}
            <div className="modal-folder-tab-peak">
              <span className="modal-folder-tab-text">New Purchase Entry</span>
            </div>

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title">ADD NEW PURCHASE</h3>
                <span className="modal-subtitle">Enter purchase details below</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
            </div>

            {/* Entry Mode Toggle */}
            <div style={{ padding: "0 24px", marginBottom: "16px" }}>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-tab ${entryMode === "single" ? "active" : ""}`}
                  onClick={() => { setEntryMode("single"); setLocalError(""); }}
                >
                  SINGLE ENTRY
                </button>
                <button
                  type="button"
                  className={`segmented-tab ${entryMode === "batch" ? "active" : ""}`}
                  onClick={() => { setEntryMode("batch"); setLocalError(""); }}
                >
                  BATCH ENTRY
                </button>
              </div>
            </div>

            {/* Local Error State */}
            {localError && (
              <div style={{ margin: "0 24px 16px 24px", padding: "10px", backgroundColor: "rgba(158, 42, 43, 0.08)", border: "1.5px dashed var(--color-stamp-red)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="stamp stamp-red" style={{ fontSize: "8px", transform: "rotate(-2deg)" }}>ERROR</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-stamp-red)", fontWeight: "bold" }}>
                  {localError}
                </span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="modal-form">
              {entryMode === "single" ? (
              <div className="modal-grid">
                
                {/* Description */}
                <div className="form-group full-width">
                  <label className="form-label">Description / Recipient</label>
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="e.g. Shell Gasoline Corp, Rent, Safeway..."
                    required
                    className="form-input"
                  />
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">Ledger Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                    className="form-input typewriter-num"
                  />
                </div>

                 {/* Type (Skeuomorphic Segmented Controls) */}
                 <div className="form-group full-width">
                   <label className="form-label">Type</label>
                   <div className="segmented-control">
                     {["Expense", "Income", "Bill", "Debt", "Transfer"].map((t) => (
                       <button
                         key={t}
                         type="button"
                         className={`segmented-tab ${type === t ? "active" : ""}`}
                         onClick={() => {
                           setType(t);
                           setIsCategoryDropdownOpen(false);
                           setCategorySearchQuery("");
                           if (t !== "Transfer") {
                             // Auto-select first category of selected type
                             const typeOptions = categories[t] || [];
                             if (typeOptions.length > 0) {
                               setCategory(typeOptions[0]);
                             } else {
                               setCategory("");
                             }
                           } else {
                             setCategory("");
                           }
                         }}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Conditional Category or Account Dropdowns */}
                 {type !== "Transfer" ? (
                   <div className="form-group" style={{ position: "relative" }}>
                     <label className="form-label">Budget Category</label>
                     
                     {/* Custom Skeuomorphic Combobox Dropdown Trigger */}
                     <div
                       className="form-input"
                       onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                       style={{
                         display: "flex",
                         justifyContent: "space-between",
                         alignItems: "center",
                         cursor: "pointer",
                         userSelect: "none",
                         backgroundColor: "var(--color-paper-light)",
                         border: "1px solid var(--color-paper-edge)",
                         borderRadius: "4px",
                         padding: "9px 12px",
                         height: "38px",
                         boxSizing: "border-box"
                       }}
                     >
                       <span style={{ 
                         color: category ? "var(--color-ink-dark)" : "rgba(32, 30, 28, 0.45)",
                         fontFamily: "var(--font-sans)",
                         fontSize: "13px"
                       }}>
                         {category || "-- Choose Category --"}
                       </span>
                       <span style={{ fontSize: "9px", opacity: 0.6 }}>▼</span>
                     </div>

                     {/* Floating Combobox Search & List Dropdown Popover */}
                     {isCategoryDropdownOpen && (
                       <>
                         {/* Backdrop overlay to capture clicks outside and close dropdown */}
                         <div
                           onClick={() => setIsCategoryDropdownOpen(false)}
                           style={{
                             position: "fixed",
                             top: 0,
                             left: 0,
                             right: 0,
                             bottom: 0,
                             zIndex: 2008,
                             background: "transparent"
                           }}
                         />
                         
                         <div
                           className="combobox-popover"
                           style={{
                             position: "absolute",
                             top: "100%",
                             left: 0,
                             right: 0,
                             marginTop: "4px",
                             backgroundColor: "var(--color-paper-light)",
                             border: "2px solid var(--color-paper-edge)",
                             borderRadius: "6px",
                             boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)",
                             zIndex: 2009,
                             padding: "8px",
                             display: "flex",
                             flexDirection: "column",
                             gap: "8px"
                           }}
                         >
                           {/* Filter Search Input */}
                           <input
                             type="text"
                             placeholder="Search category..."
                             value={categorySearchQuery}
                             onChange={(e) => setCategorySearchQuery(e.target.value)}
                             autoFocus
                             className="form-input"
                             style={{
                               padding: "6px 10px",
                               fontSize: "12.5px",
                               border: "1px solid var(--color-paper-edge)",
                               backgroundColor: "#ffffff"
                             }}
                             onClick={(e) => e.stopPropagation()} // Prevent dropdown closing on click inside search
                           />

                           {/* Category scrollable options list */}
                           <div
                             className="combobox-options-list"
                             style={{
                               maxHeight: "160px",
                               overflowY: "auto",
                               display: "flex",
                               flexDirection: "column",
                               gap: "2px"
                             }}
                           >
                             {filteredCategories.length > 0 ? (
                               filteredCategories.map((cat) => (
                                 <div
                                   key={cat}
                                   onClick={() => {
                                     setCategory(cat);
                                     setIsCategoryDropdownOpen(false);
                                     setCategorySearchQuery("");
                                   }}
                                   className={`combobox-option-item ${category === cat ? "active" : ""}`}
                                   style={{
                                     padding: "8px 12px",
                                     fontSize: "13px",
                                     cursor: "pointer",
                                     borderRadius: "4px",
                                     backgroundColor: category === cat ? "rgba(29, 53, 87, 0.12)" : "transparent",
                                     color: category === cat ? "var(--color-ink-blue)" : "var(--color-ink-dark)",
                                     fontWeight: category === cat ? "bold" : "normal",
                                     transition: "background-color 0.1s ease"
                                   }}
                                   onMouseEnter={(e) => {
                                     if (category !== cat) {
                                       e.currentTarget.style.backgroundColor = "rgba(32, 30, 28, 0.05)";
                                     }
                                   }}
                                   onMouseLeave={(e) => {
                                     if (category !== cat) {
                                       e.currentTarget.style.backgroundColor = "transparent";
                                     }
                                   }}
                                 >
                                   {cat}
                                 </div>
                               ))
                             ) : (
                               <div style={{
                                 padding: "8px",
                                 fontSize: "11px",
                                 color: "rgba(32, 30, 28, 0.5)",
                                 textAlign: "center",
                                 fontStyle: "italic"
                               }}>
                                 No matching categories
                               </div>
                             )}
                           </div>
                         </div>
                       </>
                     )}
                   </div>
                 ) : (
                   <>
                     <div className="form-group">
                       <label className="form-label">From Account</label>
                       <select
                         value={fromAccount}
                         onChange={(e) => setFromAccount(e.target.value)}
                         required
                         className="form-input"
                       >
                         <option value="Checking">Checking</option>
                         <option value="Savings">Savings</option>
                         <option value="Physical Cash">Physical Cash</option>
                       </select>
                     </div>
                     <div className="form-group">
                       <label className="form-label">To Account</label>
                       <select
                         value={toAccount}
                         onChange={(e) => setToAccount(e.target.value)}
                         required
                         className="form-input"
                       >
                         <option value="Checking">Checking</option>
                         <option value="Savings">Savings</option>
                         <option value="Physical Cash">Physical Cash</option>
                       </select>
                     </div>
                   </>
                 )}

                {/* Date */}
                <div className="form-group">
                  <label className="form-label">Matching It Up Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="form-input typewriter-num"
                  />
                </div>

              </div>
              ) : (
                <div className="form-group full-width" style={{ padding: "0 24px" }}>
                  <label className="form-label">Batch Data Grid</label>
                  <div style={{ overflowX: "auto", border: "1px solid var(--color-paper-edge)", borderRadius: "4px", backgroundColor: "#fff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--color-paper-light)", borderBottom: "2px solid var(--color-paper-edge)" }}>
                          <th style={{ padding: "8px", textAlign: "left", width: "110px" }}>Date</th>
                          <th style={{ padding: "8px", textAlign: "left" }}>Description</th>
                          <th style={{ padding: "8px", textAlign: "left", width: "90px" }}>Amount</th>
                          <th style={{ padding: "8px", textAlign: "left", width: "100px" }}>Type</th>
                          <th style={{ padding: "8px", textAlign: "left", width: "120px" }}>Category</th>
                          <th style={{ padding: "8px", width: "30px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchRows.map((row, index) => (
                          <tr key={row.id} style={{ borderBottom: "1px solid var(--color-paper-edge)" }}>
                            <td style={{ padding: "4px" }}>
                              <input type="date" value={row.date} onChange={(e) => {
                                const newRows = [...batchRows];
                                newRows[index].date = e.target.value;
                                setBatchRows(newRows);
                              }} style={{ width: "100%", border: "none", outline: "none", background: "transparent" }} required={!!row.description || !!row.amount} />
                            </td>
                            <td style={{ padding: "4px" }}>
                              <input type="text" placeholder="Description" value={row.description} onChange={(e) => {
                                const newRows = [...batchRows];
                                newRows[index].description = e.target.value;
                                setBatchRows(newRows);
                              }} style={{ width: "100%", border: "none", outline: "none", background: "transparent" }} />
                            </td>
                            <td style={{ padding: "4px" }}>
                              <input type="number" placeholder="0.00" step="0.01" value={row.amount} onChange={(e) => {
                                const newRows = [...batchRows];
                                newRows[index].amount = e.target.value;
                                setBatchRows(newRows);
                              }} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-mono)" }} />
                            </td>
                            <td style={{ padding: "4px" }}>
                              <select value={row.type} onChange={(e) => {
                                const newRows = [...batchRows];
                                newRows[index].type = e.target.value;
                                newRows[index].category = categories[e.target.value]?.[0] || "";
                                setBatchRows(newRows);
                              }} style={{ width: "100%", border: "none", outline: "none", background: "transparent" }}>
                                <option value="Expense">Expense</option>
                                <option value="Income">Income</option>
                                <option value="Bill">Bill</option>
                                <option value="Debt">Debt</option>
                              </select>
                            </td>
                            <td style={{ padding: "4px" }}>
                              <select value={row.category || (categories[row.type]?.[0] || "")} onChange={(e) => {
                                const newRows = [...batchRows];
                                newRows[index].category = e.target.value;
                                setBatchRows(newRows);
                              }} style={{ width: "100%", border: "none", outline: "none", background: "transparent" }}>
                                {categories[row.type]?.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "4px", textAlign: "center" }}>
                              <button type="button" onClick={() => {
                                setBatchRows(batchRows.filter((_, i) => i !== index));
                              }} style={{ border: "none", background: "transparent", color: "#e63946", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>&times;</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={() => {
                    setBatchRows([...batchRows, { id: Date.now(), date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "Expense", category: categories["Expense"]?.[0] || "" }]);
                  }} style={{ marginTop: "8px", border: "1px dashed var(--color-paper-edge)", background: "var(--color-paper-light)", padding: "6px", width: "100%", cursor: "pointer", borderRadius: "4px", color: "var(--color-ink-light)", fontWeight: "bold" }}>
                    + Add Row
                  </button>
                </div>
              )}

              {/* Form Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>

            </form>

            {/* Manila Folder Authentic Stamped Accent */}
            <div className="modal-stamp-container">
              <span className="stamp stamp-blue" style={{ fontSize: "8px", transform: "rotate(-1.5deg)" }}>
                LEDGER YEARLY OVERVIEW SECURED
              </span>
              <span className="stamp stamp-green" style={{ fontSize: "8px", transform: "rotate(2.5deg)" }}>
                APPROVED DEPOSIT
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
