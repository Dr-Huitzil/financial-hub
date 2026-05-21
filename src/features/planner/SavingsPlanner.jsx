import React, { useState } from 'react';
import styles from './SavingsPlanner.module.css';

// Dummy data for initial visual layout
const INITIAL_DUMMY_GOALS = [
  { id: 1, name: "Emergency Fund", target: 10000, current: 4500, category: "Savings" },
  { id: 2, name: "Personal Loan Payoff", target: 8000, current: 3200, category: "Debts" },
  { id: 3, name: "Vehicle Maintenance", target: 2000, current: 1200, category: "Bills" },
  { id: 4, name: "Vacation Fund", target: 5000, current: 1500, category: "Savings" },
];

export default function SavingsPlanner() {
  const [goals, setGoals] = useState(INITIAL_DUMMY_GOALS);

  const handleDeposit = (id) => {
    // Dummy action: add $100 to the goal
    setGoals(goals.map(g => {
      if (g.id === id) {
        return { ...g, current: Math.min(g.target, g.current + 100) };
      }
      return g;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card-title">
        <span>Active Savings Milestones</span>
        <div className="stamp stamp-green" style={{ fontSize: '9px', transform: 'rotate(-2deg)' }}>Reconciled</div>
      </div>

      <p style={{ fontSize: '12.5px', color: 'rgba(32,30,28,0.7)', marginTop: '-10px' }}>
        Track your financial goals in individual envelopes. Tap 'Deposit' to simulate adding funds.
      </p>

      <div className={styles.envelopeGrid}>
        {goals.map((goal) => {
          const percentCompleted = Math.min(100, Math.round((goal.current / goal.target) * 100));

          return (
            <div key={goal.id} className={styles.envelopeCard}>
              <div className={styles.envelopeHeader}>
                <h3 className={styles.goalName}>{goal.name}</h3>
                <div className={styles.goalAmounts}>
                  <span className={styles.amountSaved}>
                    ${goal.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={styles.amountTarget}>
                    / ${goal.target.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressTrack}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${percentCompleted}%` }} 
                  />
                </div>
                <div style={{ textAlign: 'right', marginTop: '4px', fontFamily: 'var(--font-ledger)', fontSize: '11px', color: 'rgba(32,30,28,0.6)' }}>
                  {percentCompleted}% COMPLETED
                </div>
              </div>

              <button 
                className={styles.depositButton}
                onClick={() => handleDeposit(goal.id)}
              >
                Deposit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
