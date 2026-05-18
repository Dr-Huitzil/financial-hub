// Financial Data Model representing Ivan's Annual Spreadsheet

export const initialUpcomingPayments = [
  { id: 1, name: "Discover It", amount: 20.00, dueDate: "2026-01-01", paid: false, category: "Credit Card" },
  { id: 2, name: "Electricity", amount: 120.00, dueDate: "2026-01-03", paid: false, category: "Utilities" },
  { id: 3, name: "Cricket", amount: 100.00, dueDate: "2026-01-03", paid: false, category: "Utilities" },
  { id: 4, name: "Rent", amount: 600.00, dueDate: "2026-01-05", paid: false, category: "Rent" },
  { id: 5, name: "Paycheck 1", amount: 2730.60, dueDate: "2026-01-07", paid: false, isIncome: true, category: "Income" },
  { id: 6, name: "YouTube Premium", amount: 22.99, dueDate: "2026-01-07", paid: false, category: "Entertainment" },
  { id: 7, name: "Amazon Chase", amount: 20.00, dueDate: "2026-01-08", paid: false, category: "Credit Card" },
  { id: 8, name: "Freedom Chase", amount: 20.00, dueDate: "2026-01-08", paid: false, category: "Credit Card" },
  { id: 9, name: "Credit One 1", amount: 5.00, dueDate: "2026-01-10", paid: false, category: "Credit Card" },
  { id: 10, name: "Credit One 2", amount: 5.00, dueDate: "2026-01-10", paid: false, category: "Credit Card" },
  { id: 11, name: "Paycheck 2", amount: 2730.60, dueDate: "2026-01-22", paid: false, isIncome: true, category: "Income" },
  { id: 12, name: "Insurance (Ford)", amount: 61.15, dueDate: "2026-01-24", paid: false, category: "Insurance" },
  { id: 13, name: "Post Office", amount: 84.00, dueDate: "2026-01-25", paid: false, category: "Personal Care" },
  { id: 14, name: "Capital One 2", amount: 5.00, dueDate: "2026-01-25", paid: false, category: "Credit Card" },
  { id: 15, name: "Sapphire Chase", amount: 5.00, dueDate: "2026-01-26", paid: false, category: "Credit Card" },
  { id: 16, name: "Capital One 1", amount: 5.00, dueDate: "2026-01-27", paid: false, category: "Credit Card" },
  { id: 17, name: "WiFi", amount: 30.12, dueDate: "2026-01-28", paid: false, category: "Utilities" },
  { id: 18, name: "Discover It (Feb)", amount: 20.00, dueDate: "2026-02-01", paid: false, category: "Credit Card" },
  { id: 19, name: "Electricity (Feb)", amount: 120.00, dueDate: "2026-02-03", paid: false, category: "Utilities" },
  { id: 20, name: "Cricket (Feb)", amount: 100.00, dueDate: "2026-02-03", paid: false, category: "Utilities" },
];

export const cashFlowSummary = {
  totalIncome: 35380.98,
  totalExpenses: 9494.62,
  totalBills: 8505.27,
  totalDebtPaid: 10452.00,
  totalSavings: 10.00,
  get totalRemaining() {
    return this.totalIncome - (this.totalExpenses + this.totalBills + this.totalDebtPaid + this.totalSavings);
  }
};

export const monthlyBudgets = [
  { month: "January", income: 7756.60, expenses: 3063.80, bills: 1995.11, debts: 3437.25, savings: 0.00 },
  { month: "February", income: 12780.58, expenses: 1582.24, bills: 2096.96, debts: 6126.90, savings: 10.00 },
  { month: "March", income: 7406.01, expenses: 3089.40, bills: 2732.38, debts: 28.20, savings: 0.00 },
  { month: "April", income: 7437.79, expenses: 1759.18, bills: 1680.82, debts: 859.65, savings: 0.00 },
  { month: "May", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "June", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "July", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "August", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "September", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "October", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "November", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
  { month: "December", income: 0.00, expenses: 0.00, bills: 0.00, debts: 0.00, savings: 0.00 },
];

export const categoryBreakdown = [
  { category: "Rent", actual: 6900.00, percentage: 24.24, type: "Bill" },
  { category: "Discover It", actual: 4173.27, percentage: 14.66, type: "Debt" },
  { category: "Amazon Chase", actual: 2836.02, percentage: 9.96, type: "Debt" },
  { category: "Personal Loans", actual: 1504.72, percentage: 5.29, type: "Debt" },
  { category: "Fuel", actual: 1405.39, percentage: 4.94, type: "Expense" },
  { category: "Personal Care", actual: 1320.54, percentage: 4.64, type: "Expense" },
  { category: "Jessica", actual: 1043.92, percentage: 3.67, type: "Expense" },
  { category: "Fast Food", actual: 957.20, percentage: 3.36, type: "Expense" },
  { category: "Groceries", actual: 888.65, percentage: 3.12, type: "Expense" },
  { category: "Prison", actual: 850.00, percentage: 2.99, type: "Expense" },
  { category: "Hobbies", actual: 595.42, percentage: 2.09, type: "Expense" },
  { category: "Sapphire Chase", actual: 590.01, percentage: 2.07, type: "Debt" },
  { category: "Home", actual: 474.37, percentage: 1.67, type: "Expense" },
  { category: "Freedom Chase", actual: 404.01, percentage: 1.42, type: "Debt" },
  { category: "School", actual: 354.20, percentage: 1.24, type: "Expense" },
  { category: "Thrifting", actual: 329.26, percentage: 1.16, type: "Expense" },
  { category: "Restaurant", actual: 268.76, percentage: 0.94, type: "Expense" },
  { category: "Car Maintenance", actual: 199.59, percentage: 0.70, type: "Expense" },
  { category: "Capital One 2", actual: 190.80, percentage: 0.67, type: "Debt" },
  { category: "Electronics", actual: 173.01, percentage: 0.61, type: "Expense" },
  { category: "Snacks", actual: 161.13, percentage: 0.57, type: "Expense" },
  { category: "Entertainment", actual: 136.41, percentage: 0.48, type: "Expense" },
  { category: "Insurance (Ford)", actual: 122.30, percentage: 0.43, type: "Bill" },
  { category: "Capital One 1", actual: 117.12, percentage: 0.41, type: "Debt" },
  { category: "Credit One 1", actual: 109.20, percentage: 0.38, type: "Debt" },
  { category: "Cricket", actual: 100.00, percentage: 0.35, type: "Bill" },
  { category: "WiFi", actual: 30.12, percentage: 0.11, type: "Bill" },
  { category: "Google One", actual: 24.99, percentage: 0.09, type: "Bill" },
  { category: "Gift", actual: 15.93, percentage: 0.06, type: "Expense" },
];

export const investmentGrowthData = [
  { month: "Jan", balance: 52000, contributions: 2730, growth: 120 },
  { month: "Feb", balance: 78000, contributions: 5460, growth: 340 },
  { month: "Mar", balance: 112000, contributions: 8190, growth: 450 },
  { month: "Apr", balance: 135000, contributions: 10920, growth: 890 },
  { month: "May", balance: 148000, contributions: 13650, growth: 1120 },
  { month: "Jun", balance: 169000, contributions: 16380, growth: 1540 },
  { month: "Jul", balance: 185000, contributions: 19110, growth: 1980 },
  { month: "Aug", balance: 202000, contributions: 21840, growth: 2450 },
  { month: "Sep", balance: 215000, contributions: 24570, growth: 2980 },
  { month: "Oct", balance: 228000, contributions: 27300, growth: 3410 },
  { month: "Nov", balance: 236000, contributions: 30030, growth: 3820 },
  { month: "Dec", balance: 250000, contributions: 32760, growth: 4320 },
];

export const savingsGoals = [
  { id: 1, name: "Emergency Fund", target: 10000, current: 4500, category: "Savings" },
  { id: 2, name: "Personal Loan Payoff", target: 8000, current: 3200, category: "Debts" },
  { id: 3, name: "Vehicle Maintenance", target: 2000, current: 1200, category: "Bills" },
];
