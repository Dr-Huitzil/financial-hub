import React, { useState } from "react";
import { savingsGoals as initialGoals } from "../data/financialData";

export default function GoalsTab() {
  const [goals, setGoals] = useState(initialGoals);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("Savings");

  const handleSliderChange = (id, val) => {
    setGoals(goals.map(g => g.id === id ? { ...g, current: parseFloat(val) } : g));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;

    const newGoalObj = {
      id: Date.now(),
      name: newGoalName,
      target: parseFloat(newGoalTarget),
      current: 0,
      category: newGoalCategory
    };

    setGoals([...goals, newGoalObj]);
    setNewGoalName("");
    setNewGoalTarget("");
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }} className="overview-grid">
      {/* Interactive Goal Sliders Ledger */}
      <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card-title">
          <span>Active Savings Milestones</span>
          <div className="stamp stamp-green" style={{ fontSize: '9px', transform: 'rotate(-2deg)' }}>Reconciled</div>
        </div>

        <p style={{ fontSize: '12.5px', color: 'rgba(32,30,28,0.7)' }}>
          Slide the analog metal thumbs to simulate deposits. Goals reaching 100% will trigger an official stamp authorization.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '10px' }}>
          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.current / g.target) * 100)) || 0;
            const remaining = Math.max(0, g.target - g.current);
            const isCompleted = percent >= 100;

            return (
              <div 
                key={g.id} 
                className="metric-stamp-card" 
                style={{ 
                  alignItems: 'stretch', 
                  backgroundColor: 'var(--color-paper-light)',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Stamp diagonal overlay */}
                {isCompleted && (
                  <div 
                    className="stamp stamp-green" 
                    style={{ 
                      position: 'absolute', 
                      right: '20px', 
                      top: '20px', 
                      fontSize: '11px', 
                      transform: 'rotate(-12deg) scale(1.15)',
                      zIndex: 3,
                      boxShadow: '0 0 5px rgba(37,96,70,0.3)',
                      borderColor: 'var(--color-stamp-green)',
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }}
                  >
                    Fully Secured
                  </div>
                )}

                <div className="range-container">
                  <div className="range-label-row">
                    <span className="range-title" style={{ color: isCompleted ? 'var(--color-stamp-green)' : 'var(--color-ink-blue)' }}>
                      {g.name} ({g.category})
                    </span>
                    <span className="range-percent">{percent}%</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max={g.target} 
                    value={g.current} 
                    onChange={(e) => handleSliderChange(g.id, e.target.value)}
                    className="analog-range"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-ledger)', marginTop: '8px', color: 'rgba(32,30,28,0.7)' }}>
                  <div>Current: <strong>${g.current.toLocaleString()}</strong></div>
                  <div>Target: <strong>${g.target.toLocaleString()}</strong></div>
                  <div>Missing: <strong style={{ color: isCompleted ? 'var(--color-stamp-green)' : 'var(--color-stamp-red)' }}>${remaining.toLocaleString()}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Savings Goal Ledger Card */}
      <div className="tactile-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <div className="card-title">
          <span>Authorize New Milestone</span>
          <span className="barcode-text" style={{ fontSize: '8px' }}>FORM-G-77</span>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(32,30,28,0.7)' }}>
          Establish a new capital reserve allocation by completing the ledger form below.
        </p>

        <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Milestone Identifier</label>
            <input 
              type="text" 
              value={newGoalName} 
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="e.g. Travel Fund, Car Payoff"
              required
              style={{ padding: '10px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Target Funding Amount ($)</label>
            <input 
              type="number" 
              value={newGoalTarget} 
              onChange={(e) => setNewGoalTarget(e.target.value)}
              placeholder="5000"
              required
              style={{ padding: '10px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-ledger)', fontWeight: 'bold' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Milestone Category</label>
            <select 
              value={newGoalCategory} 
              onChange={(e) => setNewGoalCategory(e.target.value)}
              style={{ padding: '10px', border: '1px solid var(--color-paper-grid)', borderRadius: '4px', backgroundColor: 'var(--color-paper-light)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
            >
              <option value="Savings">Savings Pool</option>
              <option value="Debts">Debt Clearance</option>
              <option value="Bills">Pre-paid Reserves</option>
            </select>
          </div>

          <button 
            type="submit"
            style={{
              padding: '12px',
              fontFamily: 'var(--font-accent)',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--color-paper-light)',
              backgroundColor: 'var(--color-ink-blue)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              marginTop: '8px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0f1d30'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-ink-blue)'}
          >
            Authorize Savings Contract
          </button>
        </form>

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
          <div className="barcode-stamp">
            <div className="barcode-stripes" style={{ width: '90px', height: '14px' }}></div>
            <span className="barcode-text" style={{ fontSize: '7px' }}>REGISTRY-NO-898</span>
          </div>
        </div>
      </div>
    </div>
  );
}
