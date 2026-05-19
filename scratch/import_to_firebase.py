import openpyxl
import os
import sys
import json
import urllib.request
import urllib.error
import getpass
from datetime import datetime

# Classify transactions into Ledger Types
DEBT_CATEGORIES = [
  "Discover It", "Freedom Chase", "Amazon Chase", "Sapphire Chase", 
  "Personal Loans", "Capital One 1", "Capital One 2", "Credit One 1", "Credit One 2"
]

BILL_CATEGORIES = [
  "Electricity", "Rent", "Insurance (Ford)", "Insurance (Volks)", 
  "YouTube Premium", "Google One", "Cricket", "Post Office", 
  "Mind Melt", "Websites", "WiFi", "KikOff", "Prison"
]

def authenticate_firebase(api_key, email, password):
    """Authenticate user with Firebase Auth REST API using email/password."""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    data = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True
    }).encode("utf-8")
    
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            response = json.loads(res.read().decode("utf-8"))
            return response["idToken"], response["localId"]
    except urllib.error.HTTPError as e:
        error_details = e.read().decode("utf-8")
        print(f"\n[ERROR] Authentication failed: {error_details}")
        sys.exit(1)

def write_to_firestore(project_id, token, uid, collection_name, document_data):
    """Write a document to Firestore using the REST API."""
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users/{uid}/{collection_name}"
    
    # Format firestore fields wrapper
    fields = {}
    for key, val in document_data.items():
        if isinstance(val, bool):
            fields[key] = {"booleanValue": val}
        elif isinstance(val, (int, float)):
            fields[key] = {"doubleValue": float(val)}
        elif val is None:
            fields[key] = {"nullValue": None}
        else:
            fields[key] = {"stringValue": str(val)}
            
    payload = json.dumps({"fields": fields}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"Error posting document: {e.read().decode('utf-8')}")
        return None

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 60)
    print("       IVAN'S OFFICE Excel-to-Firebase Migrator")
    print("=" * 60)
    
    # Configuration
    api_key = "YOUR_FIREBASE_API_KEY"
    project_id = "atnetnoc-404"
    
    # 1. Credentials Prompt
    print("Please enter your Comptroller credentials to authorize access:")
    email = input("Comptroller Email: ").strip()
    password = getpass.getpass("Comptroller Passcode: ").strip()
    
    print("\nAuthenticating credentials...")
    id_token, uid = authenticate_firebase(api_key, email, password)
    print("Credentials Authorized! User UID:", uid)
    
    # 2. Open spreadsheet
    excel_path = r"C:\Users\ireyes\Downloads\Annual Budget 4.0.xlsx"
    if not os.path.exists(excel_path):
        print(f"\n[ERROR] Spreadsheet not found at: {excel_path}")
        sys.exit(1)
        
    print(f"\nLoading Excel workbook: {excel_path}...")
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    extracted_txs = []
    
    print("Scanning monthly ledgers...")
    for month in months:
        if month not in wb.sheetnames:
            continue
        sheet = wb[month]
        month_count = 0
        
        # Columns AF(32) to AN(40) contain transactions
        for r_idx in range(4, 300):
            date_val = sheet.cell(row=r_idx, column=32).value
            in_val = sheet.cell(row=r_idx, column=34).value
            out_val = sheet.cell(row=r_idx, column=36).value
            cat_val = sheet.cell(row=r_idx, column=37).value
            acct_val = sheet.cell(row=r_idx, column=38).value
            person_val = sheet.cell(row=r_idx, column=39).value
            desc_val = sheet.cell(row=r_idx, column=40).value
            
            # Skip empty rows
            if date_val is None and in_val is None and out_val is None and cat_val is None:
                continue
                
            # Formatting dates
            tx_date = ""
            if isinstance(date_val, datetime):
                tx_date = date_val.strftime("%Y-%m-%d")
            elif date_val:
                tx_date = str(date_val)[:10]
            else:
                # If no date, use default date for the month
                month_num = months.index(month) + 1
                tx_date = f"2026-{str(month_num).padStart(2, '0')}-01"

            # Determine Voucher Type & Amount
            tx_type = "Expense"
            tx_amount = 0.0
            
            if in_val is not None and float(in_val) > 0:
                tx_type = "Income"
                tx_amount = float(in_val)
            elif out_val is not None and float(out_val) > 0:
                tx_amount = float(out_val)
                # Classify type based on category
                cat_str = str(cat_val) if cat_val else ""
                if any(debt.lower() in cat_str.lower() for debt in DEBT_CATEGORIES):
                    tx_type = "Debt"
                elif any(bill.lower() in cat_str.lower() for bill in BILL_CATEGORIES):
                    tx_type = "Bill"
                else:
                    tx_type = "Expense"
            else:
                continue # No amount recorded
                
            tx_category = str(cat_val) if cat_val else "Uncategorized"
            tx_account = str(acct_val) if acct_val else "Checking"
            tx_person = str(person_val) if person_val else "Ivan"
            tx_description = str(desc_val) if desc_val else tx_category
            
            extracted_txs.append({
                "date": tx_date,
                "type": tx_type,
                "category": tx_category,
                "amount": tx_amount,
                "account": tx_account,
                "description": tx_description,
                "person": tx_person,
                "paid": True
            })
            month_count += 1
            
        print(f" -> Sheet '{month}': Extracted {month_count} valid entries")
        
    total_txs = len(extracted_txs)
    print(f"\nScanning complete. Found a total of {total_txs} transactions.")
    
    if total_txs == 0:
        print("No transactions found to upload.")
        return
        
    print(f"Uploading {total_txs} transactions to your Cloud Ledger...")
    uploaded = 0
    for idx, tx in enumerate(extracted_txs):
        sys.stdout.write(f"\rPosting transaction {idx+1}/{total_txs}...")
        sys.stdout.flush()
        
        res = write_to_firestore(project_id, id_token, uid, "transactions", tx)
        if res:
            uploaded += 1
            
    print(f"\nUpload complete! Successfully posted {uploaded}/{total_txs} general ledger entries.")
    print("=" * 60)
    print("Transaction ledger sync successfully established!")
    print("=" * 60)

if __name__ == "__main__":
    main()
