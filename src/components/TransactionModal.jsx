import React, { useState } from "react";

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

  // Form states for transaction record
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Expense");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Account states for transfers
  const [fromAccount, setFromAccount] = useState("Checking");
  const [toAccount, setToAccount] = useState("Savings");

  const handleSubmit = (e) => {
    e.preventDefault();
    const isTransfer = type === "Transfer";
    if (!desc.trim() || !amount || (!isTransfer && !category)) return;

    if (isTransfer && fromAccount === toAccount) {
      alert("Comptroller Validation Error: Source and Destination accounts cannot be identical.");
      return;
    }

    const newTx = {
      description: desc.trim(),
      amount: parseFloat(amount) || 0,
      category: isTransfer ? "Transfer" : category,
      type,
      date,
      ...(isTransfer ? { fromAccount, toAccount } : {})
    };

    // Parent callback to submit transaction
    if (onAddTransaction) {
      onAddTransaction(newTx);
    }

    // =========================================================================
    // COMMENTED FIREBASE DOUBLE-ENTRY TRANSFER PROCESS
    // Demonstrates logging two voucher entries to preserve global net worth.
    // =========================================================================
    /*
    const postTransactionToFirestore = async (txData) => {
      try {
        if (!auth.currentUser) return;
        const txCollectionRef = collection(db, "users", auth.currentUser.uid, "transactions");
        await addDoc(txCollectionRef, {
          ...txData,
          createdAt: serverTimestamp()
        });
        console.log("Transaction voucher posted successfully to Firestore!");
      } catch (err) {
        console.error("Failed to upload transaction voucher:", err);
      }
    };

    const postTransferToFirestore = async (transferData) => {
      try {
        if (!auth.currentUser) return;
        const batch = writeBatch(db);
        const txCollectionRef = collection(db, "users", auth.currentUser.uid, "transactions");
        
        // Entry 1: Negative ledger entry (withdrawal from source account)
        const debitDocRef = doc(txCollectionRef);
        batch.set(debitDocRef, {
          description: `Transfer Out: ${transferData.description}`,
          amount: transferData.amount,
          type: "Expense",
          category: "Transfer",
          account: transferData.fromAccount,
          date: transferData.date,
          createdAt: serverTimestamp()
        });

        // Entry 2: Positive ledger entry (deposit to destination account)
        const creditDocRef = doc(txCollectionRef);
        batch.set(creditDocRef, {
          description: `Transfer In: ${transferData.description}`,
          amount: transferData.amount,
          type: "Income",
          category: "Transfer",
          account: transferData.toAccount,
          date: transferData.date,
          createdAt: serverTimestamp()
        });

        await batch.commit();
        console.log("Double-entry transfer voucher posted successfully to Firestore batch!");
      } catch (err) {
        console.error("Double-entry transfer failed:", err);
      }
    };

    if (isTransfer) {
      postTransferToFirestore(newTx);
    } else {
      postTransactionToFirestore(newTx);
    }
    */

    // Reset form states & close modal
    setDesc("");
    setAmount("");
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Fixed FAB Trigger in bottom-right corner */}
      <button 
        className="fab-trigger" 
        onClick={() => setIsOpen(true)}
        title="Post New Transaction Voucher"
      >
        <span className="fab-plus">+</span>
      </button>

      {/* 2. Manila Card Overlay Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-card manila-folder-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Folder tab peak to align with cabinet style */}
            <div className="modal-folder-tab-peak">
              <span className="modal-folder-tab-text">New Voucher Entry</span>
            </div>

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title">AUTHORIZE TRANSACTION VOUCHER</h3>
                <span className="modal-subtitle">FEDERAL CAPITAL LEDGER DEPOSIT/WITHDRAWAL RECORD</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-grid">
                
                {/* Description */}
                <div className="form-group full-width">
                  <label className="form-label">Voucher Description / Recipient</label>
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

                 {/* Voucher Type (Skeuomorphic Segmented Controls) */}
                 <div className="form-group full-width">
                   <label className="form-label">Voucher Class (Type)</label>
                   <div className="segmented-control">
                     {["Expense", "Income", "Transfer"].map((t) => (
                       <button
                         key={t}
                         type="button"
                         className={`segmented-tab ${type === t ? "active" : ""}`}
                         onClick={() => {
                           setType(t);
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
                   <div className="form-group">
                     <label className="form-label">Budget Category</label>
                     <select
                       value={category}
                       onChange={(e) => setCategory(e.target.value)}
                       required
                       className="form-input"
                     >
                       <option value="">-- Choose Category --</option>
                       {Object.keys(categories).map((grp) => (
                         <optgroup label={`${grp.toUpperCase()} CATEGORIES`} key={grp}>
                           {categories[grp].map((cat) => (
                             <option value={cat} key={cat}>{cat}</option>
                           ))}
                         </optgroup>
                       ))}
                     </select>
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
                  <label className="form-label">Reconciliation Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="form-input typewriter-num"
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={() => setIsOpen(false)}
                >
                  Void Voucher
                </button>
                <button 
                  type="submit" 
                  className="btn btn-submit"
                >
                  Post to Ledger
                </button>
              </div>

            </form>

            {/* Manila Folder Authentic Stamped Accent */}
            <div className="modal-stamp-container">
              <span className="stamp stamp-blue" style={{ fontSize: "8px", transform: "rotate(-1.5deg)" }}>
                LEDGER COMPTROLLER SECURED
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
