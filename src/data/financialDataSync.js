// Financial Data Aggregator and Sync Layer
// Converts raw transactions list into exact structures required by dashboard tabs

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function aggregateFinancialData(transactions, savingsGoalsList = []) {
  // 1. Calculate Cash Flow Summary
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalBills = 0;
  let totalDebtPaid = 0;
  let totalSavings = 0;

  transactions.forEach((tx) => {
    const amt = parseFloat(tx.amount || 0);
    if (tx.type === "Income") {
      totalIncome += amt;
    } else if (tx.type === "Expense") {
      totalExpenses += amt;
    } else if (tx.type === "Bill") {
      totalBills += amt;
    } else if (tx.type === "Debt") {
      totalDebtPaid += amt;
    }
  });

  // Calculate dynamic savings contributions
  // (Goals with Savings category where current is positive)
  totalSavings = savingsGoalsList
    .filter(g => g.category === "Savings")
    .reduce((sum, g) => sum + parseFloat(g.current || 0), 0);

  const cashFlowSummary = {
    totalIncome,
    totalExpenses,
    totalBills,
    totalDebtPaid,
    totalSavings,
    get totalRemaining() {
      return this.totalIncome - (this.totalExpenses + this.totalBills + this.totalDebtPaid + this.totalSavings);
    }
  };

  // 2. Calculate Monthly Budgets (12-month array)
  const monthlyBudgets = MONTH_NAMES.map((mName, idx) => {
    let income = 0;
    let expenses = 0;
    let bills = 0;
    let debts = 0;
    let savings = 0;

    // Filter transactions for this month
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === idx) {
        const amt = parseFloat(tx.amount || 0);
        if (tx.type === "Income") income += amt;
        else if (tx.type === "Expense") expenses += amt;
        else if (tx.type === "Bill") bills += amt;
        else if (tx.type === "Debt") debts += amt;
      }
    });

    // In demo/excel, let's also attribute savings goal values to January/February for visual richness
    if (idx === 0) { // Jan
      savings = 0.00;
    } else if (idx === 1) { // Feb
      savings = 10.00;
    }

    return {
      month: mName,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      bills: Math.round(bills * 100) / 100,
      debts: Math.round(debts * 100) / 100,
      savings
    };
  });

  // 3. Calculate Category Breakdown
  const catSums = {};
  const catTypes = {};
  let totalOutflow = 0;

  transactions.forEach((tx) => {
    if (tx.type === "Income") return; // Only expenses, bills, and debts in breakdown
    const amt = parseFloat(tx.amount || 0);
    const cat = tx.category || "Uncategorized";
    catSums[cat] = (catSums[cat] || 0) + amt;
    catTypes[cat] = tx.type; // Bill, Debt, or Expense
    totalOutflow += amt;
  });

  const categoryBreakdown = Object.keys(catSums).map((catName) => {
    const sum = catSums[catName];
    const pct = totalOutflow > 0 ? (sum / totalOutflow) * 100 : 0;
    return {
      category: catName,
      actual: Math.round(sum * 100) / 100,
      percentage: Math.round(pct * 100) / 100,
      type: catTypes[catName] || "Expense"
    };
  }).sort((a, b) => b.actual - a.actual);

  // If empty, supply a placeholder so reports don't crash
  if (categoryBreakdown.length === 0) {
    categoryBreakdown.push({ category: "No Ledger Data", actual: 0, percentage: 0, type: "Expense" });
  }

  // 4. Investment Growth Data
  // Build dynamic growth from actual savings pool account value!
  const currentSavings = calculatedBalancesForInvestments(transactions)["Savings Pool"] || 4500;
  const monthlyContrib = 500; // default simulate
  const investmentGrowthData = MONTH_SHORT.map((shortName, idx) => {
    // Standard growth simulation starting from currentSavings
    const factor = Math.pow(1 + 0.08 / 12, idx + 1);
    const cumulativeContrib = monthlyContrib * (idx + 1);
    const estimatedBalance = currentSavings * factor + cumulativeContrib;

    return {
      month: shortName,
      balance: Math.round(estimatedBalance),
      contributions: cumulativeContrib,
      growth: Math.round(estimatedBalance - currentSavings - cumulativeContrib)
    };
  });

  return {
    cashFlowSummary,
    monthlyBudgets,
    categoryBreakdown,
    investmentGrowthData
  };
}

function calculatedBalancesForInvestments(transactions) {
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

  return calculatedBalances;
}
