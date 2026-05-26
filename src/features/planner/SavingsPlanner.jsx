import { useState } from 'react';
import styles from './SavingsPlanner.module.css';

const generateGoalId = () => String(Date.now());

const getProgressColor = (pct) => {
  if (pct <= 50) return 'rgba(239, 68, 68, 0.55)';   // Bright highlighter red/pink
  if (pct < 80) return 'rgba(249, 115, 22, 0.55)';   // Bright highlighter orange
  return 'rgba(34, 197, 94, 0.55)';                  // Bright highlighter green
};

// Child component representing an individual 3D flippable Envelope Card
function EnvelopeCard({ goal, onUpdateGoal, onDeleteGoal }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [editTarget, setEditTarget] = useState(goal.target);
  const [editDate, setEditDate] = useState(goal.targetDate || '');
  const [frequency, setFrequency] = useState(goal.frequency || 'monthly');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');

  const handleCustomDeposit = (e) => {
    if (e) e.stopPropagation();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;
    const nextAmount = Math.min(goal.target, goal.current + val);
    if (onUpdateGoal) {
      onUpdateGoal(goal.id, { current: nextAmount });
    }
    setIsDepositing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomDeposit(e);
    }
  };

  const handleSavePlan = (e) => {
    e.stopPropagation();
    const targetVal = parseFloat(editTarget);
    if (isNaN(targetVal) || targetVal <= 0) return;

    if (onUpdateGoal) {
      onUpdateGoal(goal.id, {
        target: targetVal,
        targetDate: editDate,
        frequency: frequency
      });
    }
    setIsFlipped(false);
  };

  // Math Contribution Projections Calculation based on selected frequency
  const calculateContribution = () => {
    if (!editDate || !editTarget) return null;
    
    const targetDate = new Date(editDate);
    const today = new Date();
    
    // Normalize times to midnight for accurate day calculations
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const needed = Math.max(0, parseFloat(editTarget) - goal.current);
    
    if (frequency === 'daily') {
      const timeDiff = targetDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const daysRemaining = Math.max(1, daysDiff);
      return needed / daysRemaining;
    }
    
    if (frequency === 'weekly') {
      const timeDiff = targetDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksRemaining = Math.max(1, Math.ceil(daysDiff / 7));
      return needed / weeksRemaining;
    }
    
    if (frequency === 'biweekly') {
      const timeDiff = targetDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const biweeksRemaining = Math.max(1, Math.ceil(daysDiff / 14));
      return needed / biweeksRemaining;
    }
    
    // Default: Monthly
    const yearDiff = targetDate.getFullYear() - today.getFullYear();
    const monthDiff = targetDate.getMonth() - today.getMonth();
    const totalMonths = yearDiff * 12 + monthDiff;
    
    const monthsRemaining = Math.max(1, totalMonths);
    return needed / monthsRemaining;
  };

  const getFrequencyLabel = () => {
    switch (frequency) {
      case 'daily': return { label: 'Required Daily Savings:', suffix: '/ day' };
      case 'weekly': return { label: 'Required Weekly Savings:', suffix: '/ week' };
      case 'biweekly': return { label: 'Required Bi-weekly Savings:', suffix: '/ fortn' };
      default: return { label: 'Required Monthly Savings:', suffix: '/ month' };
    }
  };

  const contributionNeeded = calculateContribution();
  const freqDetails = getFrequencyLabel();
  const percentCompleted = Math.min(100, Math.round((goal.current / goal.target) * 100));

  return (
    <div className={styles.cardContainer}>
      <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
        
        {/* FRONT FACE */}
        <div className={`${styles.cardFront} ${styles.dogEaredFront}`}>
          {/* Discreet Delete / Void Button */}
          <button 
            className={styles.deleteButton} 
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmingDelete(true);
            }}
            title="Void Milestone"
          >
            ×
          </button>

          {/* Hover effect VOID stamp overlay */}
          <div className={styles.voidOverlay}>
            <div className={styles.voidStampText}>VOID</div>
          </div>

          {/* Skeuomorphic Delete Confirmation Overlay */}
          {isConfirmingDelete && (
            <div className={styles.confirmOverlay} onClick={(e) => e.stopPropagation()}>
              <span className={styles.confirmTitle}>VOID MILESTONE?</span>
              <p className={styles.confirmText}>
                Are you sure you want to void the "{goal.name}" envelope?
              </p>
              <div className={styles.confirmActions}>
                <button 
                  type="button"
                  className={styles.confirmNoButton} 
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  No, Keep
                </button>
                <button 
                  type="button"
                  className={styles.confirmYesButton} 
                  onClick={() => {
                    onDeleteGoal(goal.id);
                    setIsConfirmingDelete(false);
                  }}
                >
                  Yes, Void
                </button>
              </div>
            </div>
          )}

          <div className={styles.envelopeHeader}>
            <h3 className={styles.goalName}>{goal.name}</h3>
            <div className={styles.goalAmounts}>
              <span className={styles.amountSaved}>
                ${parseFloat(goal.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={styles.amountTarget}>
                / ${parseFloat(goal.target || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${percentCompleted}%`,
                  backgroundColor: getProgressColor(percentCompleted)
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontFamily: 'var(--font-ledger)', fontSize: '11px', color: 'rgba(32,30,28,0.6)' }}>
              <span style={{ fontSize: '10px', fontStyle: 'italic' }}>
                {goal.targetDate ? `Due: ${goal.targetDate}` : ''}
              </span>
              <span>
                {percentCompleted}% COMPLETED
              </span>
            </div>
          </div>

          {isDepositing ? (
            <div className={styles.depositForm} onClick={(e) => e.stopPropagation()}>
              <span style={{ fontFamily: 'var(--font-ledger)', fontSize: '15px', color: 'var(--color-ink-dark)', fontWeight: 'bold', marginRight: '-2px' }}>$</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.depositInput}
                placeholder="0.00"
                min="0.01"
                step="any"
                autoFocus
              />
              <div className={styles.depositFormActions}>
                <button
                  type="button"
                  className={styles.depositCancelButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDepositing(false);
                    setDepositAmount('100');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.depositConfirmButton}
                  onClick={handleCustomDeposit}
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button 
                className={styles.planButton}
                onClick={(e) => {
                  e.stopPropagation();
                  // Sync local input state with latest goal prop on opening the plan face
                  setEditTarget(goal.target);
                  setEditDate(goal.targetDate || '');
                  setFrequency(goal.frequency || 'monthly');
                  setIsFlipped(true);
                }}
              >
                Plan
              </button>
              <button 
                className={styles.depositButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDepositing(true);
                }}
              >
                Deposit
              </button>
            </div>
          )}
        </div>

        {/* BACK FACE */}
        <div className={`${styles.cardBack} ${styles.dogEaredBack}`} onClick={(e) => e.stopPropagation()}>
          <h4 className={styles.backTitle}>Ledger Sheet: {goal.name}</h4>
          
          <div className={styles.backFormGroup}>
            <label className={styles.backLabel}>Target Amount ($)</label>
            <input 
              type="number"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              className={styles.backInput}
              min={1}
              required
            />
          </div>

          <div className={styles.backFormGroup}>
            <label className={styles.backLabel}>Target Date</label>
            <input 
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className={styles.backInput}
              required
            />
          </div>

          <div className={styles.backFormGroup}>
            <label className={styles.backLabel}>Schedule</label>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(e.target.value)}
              className={styles.backSelect}
            >
              <option value="daily">Daily Savings</option>
              <option value="weekly">Weekly Savings</option>
              <option value="biweekly">Bi-weekly Savings</option>
              <option value="monthly">Monthly Savings</option>
            </select>
          </div>

          <div className={styles.calculationArea}>
            {contributionNeeded !== null ? (
              <>
                <span className={styles.calcLabel}>{freqDetails.label}</span>
                <span className={styles.calcAmount}>
                  ${contributionNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{ fontSize: '10px', fontWeight: 'normal', fontFamily: 'var(--font-sans)', color: 'rgba(32,30,28,0.6)', marginLeft: '4px' }}>
                    {freqDetails.suffix}
                  </span>
                </span>
              </>
            ) : (
              <span className={styles.calcPlaceholder}>Set target date to calculate required rate.</span>
            )}
          </div>

          <div className={styles.backActions}>
            <button 
              type="button"
              className={styles.cancelPlanButton}
              onClick={() => {
                setEditTarget(goal.target);
                setEditDate(goal.targetDate || '');
                setFrequency(goal.frequency || 'monthly');
                setIsFlipped(false);
              }}
            >
              Cancel
            </button>
            <button 
              type="button"
              className={styles.savePlanButton}
              onClick={handleSavePlan}
            >
              Stamp & Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SavingsPlanner({ goals = [], onAddGoal, onDeleteGoal, onUpdateGoal }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  const handleAuthorizeClick = (e) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !newTarget) return;

    const targetVal = parseFloat(newTarget);
    if (isNaN(targetVal) || targetVal <= 0) return;

    setShowAddConfirm(true);
  };

  const handleSave = () => {
    const targetVal = parseFloat(newTarget);
    const newGoal = {
      id: generateGoalId(), // generate unique id string compatible with both demo & firebase
      name: newName.trim(),
      target: targetVal,
      current: 0,
      category: "Savings"
    };

    if (onAddGoal) {
      onAddGoal(newGoal);
    }

    resetForm();
  };

  const resetForm = () => {
    setIsCreating(false);
    setNewName('');
    setNewTarget('');
    setShowAddConfirm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card-title">
        <span>Active Savings Goals</span>
        <div className="stamp stamp-green" style={{ fontSize: '9px', transform: 'rotate(-2deg)' }}>Matched Up</div>
      </div>

      <p style={{ fontSize: '12.5px', color: 'rgba(32,30,28,0.7)', marginTop: '-10px' }}>
        Track your financial goals in individual envelopes. Tap 'Plan' to configure targets and frequency schedules, or 'Deposit' to add $100.00.
      </p>

      <div className={styles.envelopeGrid}>
        {goals.map((goal) => (
          <EnvelopeCard 
            key={goal.id} 
            goal={goal}
            onUpdateGoal={onUpdateGoal}
            onDeleteGoal={onDeleteGoal}
          />
        ))}

        {/* Create Goal Blank Envelope / Inline Form */}
        {isCreating ? (
          <form className={`${styles.envelopeCard} ${styles.formEnvelope}`} onSubmit={handleAuthorizeClick}>
            {showAddConfirm ? (
              <div className={styles.confirmAddOverlay}>
                <span className={styles.confirmAddTitle}>PENDING SIGNATURE</span>
                <p className={styles.confirmAddText}>
                  Are you sure you want to authorize the creation of the <strong>{newName}</strong> savings envelope with a target of <strong>${parseFloat(newTarget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>?
                </p>
                <div className={styles.confirmAddActions}>
                  <button 
                    type="button" 
                    className={styles.confirmAddNoButton} 
                    onClick={() => setShowAddConfirm(false)}
                  >
                    Revise Draft
                  </button>
                  <button 
                    type="button" 
                    className={styles.confirmAddYesButton} 
                    onClick={handleSave}
                  >
                    Sign & Stamp
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className={styles.formTitle}>Authorize New Envelope</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Milestone Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Travel Fund" 
                    className={styles.formInput}
                    maxLength={30}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Amount ($)</label>
                  <input 
                    type="number" 
                    value={newTarget} 
                    onChange={(e) => setNewTarget(e.target.value)} 
                    placeholder="0.00" 
                    className={styles.formInput}
                    min={1}
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={resetForm}
                  >
                    Void
                  </button>
                  
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                  >
                    Authorize & Stamp
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div 
            className={`${styles.envelopeCard} ${styles.blankEnvelope}`}
            onClick={() => setIsCreating(true)}
          >
            <div className={styles.blankEnvelopeContent}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.blankEnvelopeLabel}>New Savings Envelope</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
