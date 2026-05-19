// General Ledger Demo Data Generator
// Seeding highly authentic transactions for guest mode

const CATEGORIES = {
  Income: ["Paycheck 1", "Paycheck 2", "Overtime On Call", "Mileage", "Commission", "Side hustle", "Interest"],
  Expense: ["Groceries", "Restaurant", "Games", "Fuel", "Car Maintenance", "Clothing", "Home", "Entertainment", "Pets", "Travel", "Electronics", "Personal Care", "Jessica", "Snacks", "Gift", "Hobbies", "Thrifting", "Fast Food", "School"],
  Bill: ["Electricity", "Rent", "Insurance (Ford)", "Insurance (Volks)", "YouTube Premium", "Google One", "Cricket", "Post Office", "Mind Melt", "Websites", "WiFi", "KikOff", "Prison"],
  Debt: ["Discover It", "Freedom Chase", "Amazon Chase", "Sapphire Chase", "Personal Loans", "Capital One 1", "Capital One 2", "Credit One 1", "Credit One 2"]
};

const ACCOUNTS = ["Checking", "Prepaid Card", "Gift Card", "Cash Envelopes", "Cash Wallet", "Savings Pool"];

const MERCHANTS = {
  Groceries: ["Safeway", "Trader Joe's", "Costco Wholesale", "Target Superstore", "Whole Foods", "Tortilleria"],
  Restaurant: ["Olive Garden", "Black Bear Diner", "Texas Roadhouse", "Applebee's", "Local Sushi Bar"],
  Games: ["Steam Store", "Epic Games", "PlayStation Network", "Nintendo eShop"],
  Fuel: ["Chevron Gas", "Shell station", "Mobil station", "7-Eleven Fuel", "Costco Gas"],
  CarMaintenance: ["AutoZone Parts", "Valvoline Oil Change", "Local Brake Service", "Tire Center"],
  Clothing: ["Goodwill Industries", "Macy's Department", "Target Clothing", "Ross Dress For Less"],
  Entertainment: ["AMC Movie Theater", "Bowling Alley", "Concert Ticket Center", "Bookstore Purchase"],
  PersonalCare: ["CVS Pharmacy", "Walgreens Health", "Ulta Beauty Center", "Supercuts Haircare"],
  Jessica: ["Flower Bouquet Shop", "Anniversary Restaurant", "Target Gift Purchase", "Movie Night Date"],
  Hobbies: ["Hobby Lobby Store", "Oddity Shop Curios", "Local Game Center", "Art Supply Depot"],
  Thrifting: ["Salvation Army", "Local Thrift Store", "Garage Sale Find", "Goodwill Shop"],
  FastFood: ["In-N-Out Burger", "Carl's Jr. Drive-Thru", "Starbucks Coffee", "Panda Express", "Taco Bell"],
  School: ["CompTIA Exam Lab", "Barnes & Noble Books", "University Bookstore", "Online Learning License"]
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function generateDemoTransactions() {
  const txs = [];
  let idCounter = 1;

  // Let's generate data for January to May 2026
  const months = [
    { name: "Jan", year: 2026, days: 31, numIndex: 0 },
    { name: "Feb", year: 2026, days: 28, numIndex: 1 },
    { name: "Mar", year: 2026, days: 31, numIndex: 2 },
    { name: "Apr", year: 2026, days: 30, numIndex: 3 },
    { name: "May", year: 2026, days: 19, numIndex: 4 } // up to today's date May 19, 2026!
  ];

  months.forEach((m) => {
    // 1. Double Paychecks every month on 7th and 22nd
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-07`,
      type: "Income",
      category: "Paycheck 1",
      amount: 2730.60,
      account: "Checking",
      description: "Payroll Direct Deposit",
      person: "Ivan",
      paid: true
    });

    if (m.name !== "May" || m.days >= 22) {
      txs.push({
        id: `demo-${idCounter++}`,
        date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-22`,
        type: "Income",
        category: "Paycheck 2",
        amount: 2730.60,
        account: "Checking",
        description: "Payroll Direct Deposit",
        person: "Ivan",
        paid: true
      });
    }

    // 2. Rent on 5th
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-05`,
      type: "Bill",
      category: "Rent",
      amount: 600.00,
      account: "Checking",
      description: "Monthly Rent Reconciled",
      person: "Ivan",
      paid: true
    });

    // 3. Recurring Utilities
    // Electricity on 3rd
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-03`,
      type: "Bill",
      category: "Electricity",
      amount: 120.00,
      account: "Checking",
      description: "Power Utility Grid",
      person: "Ivan",
      paid: true
    });
    // Cricket mobile on 3rd
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-03`,
      type: "Bill",
      category: "Cricket",
      amount: 100.00,
      account: "Checking",
      description: "Cricket Wireless Phone Plan",
      person: "Ivan",
      paid: true
    });
    // WiFi on 28th
    if (m.name !== "May" || m.days >= 28) {
      txs.push({
        id: `demo-${idCounter++}`,
        date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-28`,
        type: "Bill",
        category: "WiFi",
        amount: 30.12,
        account: "Checking",
        description: "Comcast Broadband Internet",
        person: "Ivan",
        paid: true
      });
    }
    // YouTube Premium on 7th
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-07`,
      type: "Bill",
      category: "YouTube Premium",
      amount: 22.99,
      account: "Checking",
      description: "YouTube Premium Subscription",
      person: "Ivan",
      paid: true
    });

    // 4. Regular Debt Payments
    // Discover It CC on 1st
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-01`,
      type: "Debt",
      category: "Discover It",
      amount: 20.00,
      account: "Checking",
      description: "Credit Card Minimum Due",
      person: "Ivan",
      paid: true
    });
    // Freedom Chase CC on 8th
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-08`,
      type: "Debt",
      category: "Freedom Chase",
      amount: 20.00,
      account: "Checking",
      description: "Chase CC Reconcile",
      person: "Ivan",
      paid: true
    });
    // Amazon Chase CC on 8th
    txs.push({
      id: `demo-${idCounter++}`,
      date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-08`,
      type: "Debt",
      category: "Amazon Chase",
      amount: 20.00,
      account: "Checking",
      description: "Amazon Rewards Card",
      person: "Ivan",
      paid: true
    });

    // 5. Random Variable Expenses (12 to 18 transactions per month)
    const numExpenses = 12 + Math.floor(Math.random() * 7);
    for (let i = 0; i < numExpenses; i++) {
      const day = 1 + Math.floor(Math.random() * m.days);
      const cat = getRandomElement(CATEGORIES.Expense);
      
      let desc = cat;
      let amt = getRandomAmount(5, 80);
      let acct = "Checking";

      // Specialized merchant naming and amounts for realism
      if (cat === "Groceries") {
        desc = getRandomElement(MERCHANTS.Groceries);
        amt = getRandomAmount(15, 180);
      } else if (cat === "Restaurant") {
        desc = getRandomElement(MERCHANTS.Restaurant);
        amt = getRandomAmount(25, 95);
      } else if (cat === "Fast Food") {
        desc = getRandomElement(MERCHANTS.FastFood);
        amt = getRandomAmount(4.50, 22.00);
        acct = Math.random() > 0.4 ? "Prepaid Card" : "Checking";
      } else if (cat === "Fuel") {
        desc = getRandomElement(MERCHANTS.Fuel);
        amt = getRandomAmount(25, 55);
      } else if (cat === "Games") {
        desc = getRandomElement(MERCHANTS.Games);
        amt = getRandomAmount(4.99, 59.99);
      } else if (cat === "Jessica") {
        desc = getRandomElement(MERCHANTS.Jessica);
        amt = getRandomAmount(12, 120);
      } else if (cat === "Hobbies") {
        desc = getRandomElement(MERCHANTS.Hobbies);
        amt = getRandomAmount(15, 110);
      } else if (cat === "Thrifting") {
        desc = getRandomElement(MERCHANTS.Thrifting);
        amt = getRandomAmount(5, 45);
      } else if (cat === "School") {
        desc = getRandomElement(MERCHANTS.School);
        amt = getRandomAmount(10, 150);
      } else if (cat === "Personal Care") {
        desc = getRandomElement(MERCHANTS.PersonalCare);
        amt = getRandomAmount(8, 65);
      }

      txs.push({
        id: `demo-${idCounter++}`,
        date: `${m.year}-${String(m.numIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        type: "Expense",
        category: cat,
        amount: amt,
        account: acct,
        description: desc,
        person: cat === "Jessica" ? "Jessica" : "Ivan",
        paid: true
      });
    }
  });

  return txs;
}
