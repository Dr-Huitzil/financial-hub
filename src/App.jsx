import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import OverviewTab from "./components/OverviewTab";
import BudgetTab from "./components/BudgetTab";
import InvestmentsTab from "./components/InvestmentsTab";
import SavingsPlanner from "./features/planner/SavingsPlanner";
import ReportsFolder from "./features/reports/ReportsFolder";
import TransactionTab from "./components/TransactionTab";
import SetupTab from "./components/SetupTab";
import Login from "./components/Login";

import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./features/dashboard/Dashboard";
import BudgetFolder from "./features/budget/BudgetFolder";
import TransactionModal from "./components/TransactionModal";

import { initialUpcomingPayments, savingsGoals as initialGoals } from "./data/financialData";
import { generateDemoTransactions } from "./data/demoDataGenerator";
import { aggregateFinancialData } from "./data/financialDataSync";

const DEFAULT_CATEGORIES = {
  Income: ["Paycheck 1", "Paycheck 2", "Overtime On Call", "Mileage", "Commission", "Business", "Side hustle", "Interest", "School Refund", "Cash"],
  Expense: ["Groceries", "Restaurant", "Games", "Fuel", "Car Maintenance", "Clothing", "Childcare", "Home", "Entertainment", "Pets", "Travel", "Electronics", "Personal Care", "Jessica", "Prison", "Snacks", "Work Equipment", "Gift", "Hobbies", "Thrifting", "Fast Food", "School"],
  Bill: ["Electricity", "Rent", "Insurance (Ford)", "Insurance (Volks)", "YouTube Premium", "Google One", "Cricket", "Post Office", "Mind Melt", "Websites", "WiFi", "KikOff", "Prison"],
  Debt: ["Discover It", "Freedom Chase", "Amazon Chase", "Sapphire Chase", "Personal Loans", "Capital One 1", "Capital One 2", "Credit One 1", "Credit One 2"]
};

const DEFAULT_CREDIT_CARDS = [
  { id: "discover-it", name: "Discover It", limit: 5000, balance: 1250 },
  { id: "freedom-chase", name: "Freedom Chase", limit: 3000, balance: 450 },
  { id: "amazon-chase", name: "Amazon Chase", limit: 4500, balance: 800 },
  { id: "sapphire-chase", name: "Sapphire Chase", limit: 12000, balance: 1800 },
  { id: "capital-one-1", name: "Capital One 1", limit: 2000, balance: 150 },
  { id: "capital-one-2", name: "Capital One 2", limit: 2500, balance: 350 },
  { id: "credit-one-1", name: "Credit One 1", limit: 1000, balance: 400 },
  { id: "credit-one-2", name: "Credit One 2", limit: 1000, balance: 250 }
];

const DEFAULT_BUDGET_LIMITS = {
  "Rent": 1800,
  "Discover It": 500,
  "Amazon Chase": 350,
  "Electricity": 150,
  "Groceries": 450,
  "Fuel": 250,
  "Fast Food": 150,
  "Personal Care": 100,
  "Entertainment": 150,
  "Restaurant": 200,
  "Car Maintenance": 300,
  "Electronics": 500
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [plannerSubTab, setPlannerSubTab] = useState("goals");

  // General ledger states
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [creditCards, setCreditCards] = useState(DEFAULT_CREDIT_CARDS);
  const [budgetLimits, setBudgetLimits] = useState(DEFAULT_BUDGET_LIMITS);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoMode(false);
      } else {
        setUser(null);
        // Clear live states on logout
        if (!isDemoMode) {
          setTransactions([]);
          setGoals([]);
          setUpcomingPayments([]);
        }
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [isDemoMode]);

  // Firestore Dynamic Database Sync
  useEffect(() => {
    if (!user) return;

    // 1. Sync Transactions
    const txRef = collection(db, "users", user.uid, "transactions");
    const unsubTx = onSnapshot(txRef, (snapshot) => {
      const txList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(txList);
    });

    // 2. Sync Savings Goals
    const goalsRef = collection(db, "users", user.uid, "savingsGoals");
    const unsubGoals = onSnapshot(goalsRef, (snapshot) => {
      if (snapshot.empty) {
        // Seed default goals in DB on first login
        initialGoals.forEach((goal) => {
          setDoc(doc(goalsRef, String(goal.id)), goal);
        });
      } else {
        const goalsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setGoals(goalsList);
      }
    });

    // 3. Sync Upcoming Payments Checklists
    const paymentsRef = collection(db, "users", user.uid, "upcomingPayments");
    const unsubPayments = onSnapshot(paymentsRef, (snapshot) => {
      if (snapshot.empty) {
        // Seed default payments in DB on first login
        initialUpcomingPayments.forEach((payment) => {
          setDoc(doc(paymentsRef, String(payment.id)), payment);
        });
      } else {
        const paymentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setUpcomingPayments(paymentsList);
      }
    });

    // 4. Sync Setup settings (Categories & Credit Cards & Budget Limits)
    const settingsRef = doc(db, "users", user.uid, "settings", "comptroller");
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.categories) {
          setCategories(data.categories);
        }
        if (data.creditCards) {
          setCreditCards(data.creditCards);
        }
        if (data.budgetLimits) {
          setBudgetLimits(data.budgetLimits);
        }
      } else {
        // Seed default categories in Firestore
        setDoc(settingsRef, { 
          categories: DEFAULT_CATEGORIES, 
          creditCards: DEFAULT_CREDIT_CARDS,
          budgetLimits: DEFAULT_BUDGET_LIMITS 
        });
      }
    });

    return () => {
      unsubTx();
      unsubGoals();
      unsubPayments();
      unsubSettings();
    };
  }, [user]);

  // Enter Demo / Guest Mode Handler
  const handleEnterDemoMode = () => {
    setIsDemoMode(true);
    setTransactions(generateDemoTransactions());
    setUpcomingPayments(initialUpcomingPayments);
    setGoals(initialGoals);
    setCreditCards(DEFAULT_CREDIT_CARDS);
    setBudgetLimits(DEFAULT_BUDGET_LIMITS);
    setActiveTab("overview");
  };

  // Sign out / Exit Demo mode
  const handleLogout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setTransactions([]);
      setGoals([]);
      setUpcomingPayments([]);
      setCreditCards(DEFAULT_CREDIT_CARDS);
      setBudgetLimits(DEFAULT_BUDGET_LIMITS);
    } else {
      await signOut(auth);
    }
    setActiveTab("overview");
  };

  // 1. Post a new transaction voucher
  const handleAddTransaction = async (newTx) => {
    if (isDemoMode) {
      setTransactions([{ ...newTx, id: `demo-${Date.now()}` }, ...transactions]);
    } else if (user) {
      await addDoc(collection(db, "users", user.uid, "transactions"), newTx);
    }
  };

  // 2. Void / Delete a transaction voucher
  const handleDeleteTransaction = async (id) => {
    if (isDemoMode) {
      setTransactions(transactions.filter((tx) => tx.id !== id));
    } else if (user) {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));
    }
  };

  // 3. Toggle upcoming obligation paid status
  const handleTogglePayment = async (id) => {
    const payment = upcomingPayments.find((p) => p.id === id);
    if (!payment) return;

    if (isDemoMode) {
      setUpcomingPayments(
        upcomingPayments.map((p) =>
          p.id === id ? { ...p, paid: !p.paid } : p
        )
      );
    } else if (user) {
      await setDoc(
        doc(db, "users", user.uid, "upcomingPayments", String(id)),
        { paid: !payment.paid },
        { merge: true }
      );
    }
  };

  // 4. Update Milestone savings slider
  const handleUpdateGoalSlider = async (id, currentVal) => {
    if (isDemoMode) {
      setGoals(goals.map((g) => (g.id === id ? { ...g, current: parseFloat(currentVal) } : g)));
    } else if (user) {
      await setDoc(
        doc(db, "users", user.uid, "savingsGoals", String(id)),
        { current: parseFloat(currentVal) },
        { merge: true }
      );
    }
  };

  // 5. Authorize new savings goal milestone
  const handleAddGoal = async (newGoal) => {
    if (isDemoMode) {
      setGoals([...goals, { ...newGoal, id: Date.now() }]);
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "savingsGoals", String(newGoal.id)), newGoal);
    }
  };

  // 6. Delete savings goal milestone
  const handleDeleteGoal = async (id) => {
    if (isDemoMode) {
      setGoals(goals.filter((g) => g.id !== id));
    } else if (user) {
      await deleteDoc(doc(db, "users", user.uid, "savingsGoals", String(id)));
    }
  };

  // 7. Update savings goal fields
  const handleUpdateGoal = async (id, updatedFields) => {
    if (isDemoMode) {
      setGoals(goals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g)));
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "savingsGoals", String(id)), updatedFields, { merge: true });
    }
  };

  // 8. Update customized categories registry
  const handleUpdateCategories = async (newCategories) => {
    setCategories(newCategories);
    if (isDemoMode) {
      // Keep in local guest state
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "settings", "comptroller"), { categories: newCategories }, { merge: true });
    }
  };

  // 12. Update credit card portfolio
  const handleUpdateCreditCards = async (newCreditCards) => {
    setCreditCards(newCreditCards);
    if (isDemoMode) {
      // Keep in local guest state
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "settings", "comptroller"), { creditCards: newCreditCards }, { merge: true });
    }
  };

  // 13. Update customized budget limits registry
  const handleUpdateBudgetLimits = async (newBudgetLimits) => {
    setBudgetLimits(newBudgetLimits);
    if (isDemoMode) {
      // Keep in local guest state
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "settings", "comptroller"), { budgetLimits: newBudgetLimits }, { merge: true });
    }
  };

  // 9. Add recurring scheduled payment
  const handleAddPayment = async (newPayment) => {
    if (isDemoMode) {
      setUpcomingPayments([...upcomingPayments, newPayment].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "upcomingPayments", String(newPayment.id)), newPayment);
    }
  };

  // 10. Delete scheduled recurring payment
  const handleDeletePayment = async (id) => {
    if (isDemoMode) {
      setUpcomingPayments(upcomingPayments.filter((p) => p.id !== id));
    } else if (user) {
      await deleteDoc(doc(db, "users", user.uid, "upcomingPayments", String(id)));
    }
  };

  // 11. Edit scheduled payment parameters
  const handleUpdatePayment = async (id, updatedFields) => {
    if (isDemoMode) {
      setUpcomingPayments(
        upcomingPayments.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      );
    } else if (user) {
      await setDoc(doc(db, "users", user.uid, "upcomingPayments", String(id)), updatedFields, { merge: true });
    }
  };

  // Compute live cumulative aggregations from raw transaction flow
  const aggregatedData = aggregateFinancialData(transactions, goals);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            transactions={transactions}
            creditCards={creditCards}
            goals={goals}
            upcomingPayments={upcomingPayments}
          />
        );
      case "budget":
        return (
          <BudgetFolder 
            transactions={transactions}
            budgetLimits={budgetLimits}
            categories={categories}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case "reports":
        return (
          <ReportsFolder 
            transactions={transactions}
            goals={goals}
          />
        );
      case "planner":
        return (
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Sloped inner folder dividers for Savings vs Investments */}
            <div className="budget-tabs-container">
              <button
                className={`budget-month-tab ${plannerSubTab === "goals" ? "active" : ""}`}
                onClick={() => setPlannerSubTab("goals")}
              >
                Milestone Savings
              </button>
              <button
                className={`budget-month-tab ${plannerSubTab === "investments" ? "active" : ""}`}
                onClick={() => setPlannerSubTab("investments")}
              >
                Investment Projections
              </button>
            </div>

            <div className="budget-ledger-sheet">
              {plannerSubTab === "goals" ? (
                <SavingsPlanner 
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onUpdateGoal={handleUpdateGoal}
                />
              ) : (
                <InvestmentsTab investmentGrowthData={aggregatedData.investmentGrowthData} />
              )}
            </div>
          </div>
        );
      case "setup":
        return (
          <SetupTab
            categories={categories}
            onUpdateCategories={handleUpdateCategories}
            upcomingPayments={upcomingPayments}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            onUpdatePayment={handleUpdatePayment}
            creditCards={creditCards}
            onUpdateCreditCards={handleUpdateCreditCards}
            budgetLimits={budgetLimits}
            onUpdateBudgetLimits={handleUpdateBudgetLimits}
          />
        );
      default:
        return (
          <Dashboard 
            transactions={transactions}
            creditCards={creditCards}
            goals={goals}
            upcomingPayments={upcomingPayments}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--color-manila-light)" }}>
        <h2 style={{ fontFamily: "var(--font-typewriter)", fontSize: "20px" }}>UNLOCKING LEDGER AUTHORIZATIONS...</h2>
      </div>
    );
  }

  // Auth gate
  if (!user && !isDemoMode) {
    return <Login onDemoMode={handleEnterDemoMode} />;
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Binder Header */}
      <div className="folder-header">
        <div className="folder-title-block">
          <h1 className="folder-title-main">IVAN'S FINANCIAL HUB</h1>
          <p className="folder-subtitle">
            {isDemoMode ? "ANNUAL TREASURY GENERAL LEDGER — DEMO VISITOR" : `ANNUAL TREASURY GENERAL LEDGER — ID: ${user.email.toUpperCase()}`}
          </p>
        </div>

        <div className="folder-badge-strip">
          {/* Live Mode Indicator or Logout Stamp */}
          <button
            onClick={handleLogout}
            className="stamp stamp-red"
            style={{
              fontSize: "10px",
              cursor: "pointer",
              border: "2px solid var(--color-stamp-red)",
              backgroundColor: "rgba(158, 42, 43, 0.08)",
              transform: "rotate(-3deg)",
              fontFamily: "var(--font-typewriter)",
              letterSpacing: "1.5px"
            }}
            title="Secure Lock & Exit Account"
          >
            [ Audit Lock-Out ]
          </button>

          {/* Profile badge */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              border: '1.5px solid var(--color-paper-grid)', 
              borderRadius: '6px', 
              padding: '6px 12px', 
              backgroundColor: 'rgba(235, 220, 185, 0.15)' 
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ borderRadius: '50%', backgroundColor: 'var(--color-manila-dark)', border: '1px solid var(--color-ink-dark)' }}>
              <path d="M16,14 C18.7614237,14 21,11.7614237 21,9 C21,6.23857625 18.7614237,4 16,4 C13.2385763,4 11,6.23857625 11,9 C11,11.7614237 13.2385763,14 16,14 Z M16,16 C10.4771525,16 6,20.4771525 6,26 L26,26 C26,20.4771525 21.5228475,16 16,16 Z" fill="var(--color-ink-dark)" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isDemoMode ? "Guest Comptroller" : user.email.split("@")[0].toUpperCase()}
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-ledger)', color: 'rgba(32,30,28,0.6)' }}>
                Ledger Comptroller
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Paper View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderActiveTab()}
      </div>

      {/* Tactile Page Footer elements */}
      <div 
        style={{ 
          marginTop: 'auto', 
          paddingTop: '20px', 
          borderTop: '1px dashed var(--color-paper-grid)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '11px', 
          fontFamily: 'var(--font-ledger)',
          color: 'rgba(32,30,28,0.5)'
        }}
      >
        <span>AUTORIZADO POR REGISTRO GENERAL DE FINANZAS</span>
        <span>FOLIO NO. 2026-XLSX-001</span>
      </div>

      {/* Floating Transaction Modal trigger FAB */}
      <TransactionModal 
        categories={categories}
        onAddTransaction={handleAddTransaction}
      />
    </MainLayout>
  );
}
