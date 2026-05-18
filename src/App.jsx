import React, { useState } from "react";
import OverviewTab from "./components/OverviewTab";
import BudgetTab from "./components/BudgetTab";
import InvestmentsTab from "./components/InvestmentsTab";
import GoalsTab from "./components/GoalsTab";
import ReportsTab from "./components/ReportsTab";
import { initialUpcomingPayments } from "./data/financialData";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingPayments, setUpcomingPayments] = useState(initialUpcomingPayments);

  const togglePayment = (id) => {
    setUpcomingPayments(
      upcomingPayments.map((p) =>
        p.id === id ? { ...p, paid: !p.paid } : p
      )
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab upcomingPayments={upcomingPayments} onTogglePayment={togglePayment} />;
      case "budget":
        return <BudgetTab />;
      case "investments":
        return <InvestmentsTab />;
      case "goals":
        return <GoalsTab />;
      case "reports":
        return <ReportsTab />;
      default:
        return <OverviewTab upcomingPayments={upcomingPayments} onTogglePayment={togglePayment} />;
    }
  };

  return (
    <div className="folder-container">
      {/* Binder Spine line aesthetic */}
      <div className="binder-spine-line" />

      {/* Left Sidebar (Vertical Manila Folder Tabs) */}
      <div className="folder-sidebar">
        <button 
          className={`folder-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="folder-tab-text">Overview</span>
        </button>

        <button 
          className={`folder-tab ${activeTab === "budget" ? "active" : ""}`}
          onClick={() => setActiveTab("budget")}
        >
          <span className="folder-tab-text">Budget</span>
        </button>

        <button 
          className={`folder-tab ${activeTab === "investments" ? "active" : ""}`}
          onClick={() => setActiveTab("investments")}
        >
          <span className="folder-tab-text">Investments</span>
        </button>

        <button 
          className={`folder-tab ${activeTab === "goals" ? "active" : ""}`}
          onClick={() => setActiveTab("goals")}
        >
          <span className="folder-tab-text">Goals</span>
        </button>

        <button 
          className={`folder-tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <span className="folder-tab-text">Reports</span>
        </button>
      </div>

      {/* Main Manila Paper Sheet Content */}
      <div className="folder-body">
        {/* Binder Header */}
        <div className="folder-header">
          <div className="folder-title-block">
            <h1 className="folder-title-main">IVAN'S FINANCIAL HUB</h1>
            <p className="folder-subtitle">ANNUAL TREASURY & CAPITAL LEDGERS — EST. 2026</p>
          </div>

          <div className="folder-badge-strip">
            {/* Visual profile badge representing the auditor (Ivan) */}
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
              {/* Custom SVG Avatar Silhouette */}
              <svg width="32" height="32" viewBox="0 0 32 32" style={{ borderRadius: '50%', backgroundColor: 'var(--color-manila-dark)', border: '1px solid var(--color-ink-dark)' }}>
                <path d="M16,14 C18.7614237,14 21,11.7614237 21,9 C21,6.23857625 18.7614237,4 16,4 C13.2385763,4 11,6.23857625 11,9 C11,11.7614237 13.2385763,14 16,14 Z M16,16 C10.4771525,16 6,20.4771525 6,26 L26,26 C26,20.4771525 21.5228475,16 16,16 Z" fill="var(--color-ink-dark)" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ivan Alier-Reyes
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-ledger)', color: 'rgba(32,30,28,0.6)' }}>
                  Ledger Comptroller
                </span>
              </div>
            </div>

            <div className="barcode-stamp">
              <div className="barcode-stripes"></div>
              <span className="barcode-text">HUB-SEC-2026</span>
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
      </div>
    </div>
  );
}
