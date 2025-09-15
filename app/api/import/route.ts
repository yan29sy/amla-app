import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import * as Papa from "papaparse";  // Import for unparse (install: npm i papaparse @types/papaparse)
import { transactionSchema, Transaction } from "@/types/transactions";
import { randomUUID } from "crypto";

// Mock annex data (from Python) - Use arrays for random selection
const ANNEX_F_MOT: number[] = [1, 2, 3];
const ANNEX_G_PURPOSE: string[] = ["PR1", "PR2"];
const ANNEX_H_PRODUCT: string[] = ["PT1", "PT2"];
const ANNEX_I_ID_TYPES: string[] = ["ID1", "ID2"];
const ANNEX_J_SOURCE_FUND: string[] = ["SF1", "SF2"];
const ANNEX_L_CURRENCY: string[] = ["PHP", "USD", "EUR"];
const ANNEX_N_CITY: string[] = ["010000000", "020000000"];

// Helper: Add defaults, transform, and validate row
function addDefaultsAndValidate(row: (string | number | undefined)[]): Partial<Transaction> {
  return {
    id: parseInt(randomUUID().slice(0, 8), 16),
    date: row[0] ? new Date(row[0] as string | number).toISOString().split("T")[0] : "",
    orNo: row[1]?.toString() || "",
    acNum: row[2]?.toString() || "",
    name: row[3]?.toString() || "",
    amount: parseFloat(row[4]?.toString() || "0") || 0,
    bankCode: row[5]?.toString() || "",
    country: row[6]?.toString() || "PHL",
    isCash: (row[5]?.toString() || "") === "CASH",
    checkNo: row[7]?.toString() || "",
    checkDate: row[8] ? new Date(row[8] as string | number).toISOString().split("T")[0] : "",
    userId: row[9]?.toString() || "",
    stat: row[10]?.toString() || "P",
    type: "Deposit",  // Default, override later
    email: "",
    employmentStatus: "employed",
    isFlagged: false,
    flagReason: "",
    balance: 0,
    contactChanges: "",
    mot: ANNEX_F_MOT[Math.floor(Math.random() * ANNEX_F_MOT.length)],
    purpose: ANNEX_G_PURPOSE[Math.floor(Math.random() * ANNEX_G_PURPOSE.length)],
    productType: ANNEX_H_PRODUCT[Math.floor(Math.random() * ANNEX_H_PRODUCT.length)],
    idType: ANNEX_I_ID_TYPES[Math.floor(Math.random() * ANNEX_I_ID_TYPES.length)],
    idNo: Math.floor(Math.random() * 900000 + 100000).toString(),
    sourceFund: ANNEX_J_SOURCE_FUND[Math.floor(Math.random() * ANNEX_J_SOURCE_FUND.length)],
    currencyCode: ANNEX_L_CURRENCY[Math.floor(Math.random() * ANNEX_L_CURRENCY.length)],
    cityCode: ANNEX_N_CITY[Math.floor(Math.random() * ANNEX_N_CITY.length)],
  };
}

// Process Deposits/Withdrawals (port of convert_excel_to_csv_dep_wd)
function processDepWd(buffer: ArrayBuffer, type: "Deposit" | "Withdrawal"): Transaction[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  let json: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Drop first 13 rows
  json = json.slice(13);

  // Select columns: 0,3,8,10,19,23,27,29,31,33 (adjust if less columns)
  const maxCol = Math.max(...json.map(row => row.length)) - 1 || 0;
  const colIndices = [0, 3, 8, 10, 19, 23, 27, 29, 31, 33].filter(c => c <= maxCol);
  json = json.map(row => colIndices.map(c => row[c]));

  // Clean: remove 'sub total', 'grand total', dropna equiv, etc.
  json = json.filter(row => 
    row.some(cell => cell !== undefined && cell !== null && !String(cell).toLowerCase().includes("sub total") && !String(cell).toLowerCase().includes("grand total"))
  );
  json = json.filter(row => row.filter(cell => cell !== undefined && cell !== null && cell !== "").length >= 2);

  // Process each row with defaults
  const processed: Partial<Transaction>[] = json.map(row => addDefaultsAndValidate(row));
  processed.forEach(p => p.type = type);

  // Validate
  return processed.map(p => transactionSchema.parse(p));
}

// Process Buy/Sell (port of convert_excel_to_csv_buy_sell)
function processBuySell(buffer: ArrayBuffer): { buys: Transaction[]; sells: Transaction[] } {
  const wb = XLSX.read(buffer, { type: "array" });
  const results = { buys: [] as Transaction[], sells: [] as Transaction[] };

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    let json: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Drop first 15 rows
    json = json.slice(15);

    // Select columns: 0,1,2,5,6,8,11,13,16,19,22,25,27,29,30,33,35,38,41 (adjust)
    const maxCol = Math.max(...json.map(row => row.length)) - 1 || 0;
    const colIndices = [0,1,2,5,6,8,11,13,16,19,22,25,27,29,30,33,35,38,41].filter(c => c <= maxCol);
    json = json.map(row => colIndices.map(c => row[c]));

    // Detect buying/selling mode
    let sellingMode = false;
    const processedSheet: Partial<Transaction>[] = [];
    json.forEach(row => {
      const dateStr = String(row[0] || "").toLowerCase().trim();
      if (dateStr === "buying" || dateStr === "selling") {
        sellingMode = dateStr === "selling";
        return;
      }
      if (row[0] !== undefined) {  // Valid row
        const p = addDefaultsAndValidate(row);
        p.amount = (parseFloat(row[6]?.toString() || "0") * parseFloat(row[7]?.toString() || "0")) || 0;
        p.orNo = row[1]?.toString() || "";
        p.acNum = row[16]?.toString() || "";
        p.name = row[3]?.toString() || row[2]?.toString() || "";
        p.bankCode = "";
        p.country = "PHL";
        p.checkNo = "";
        p.checkDate = "";
        p.userId = row[17]?.toString() || "";
        p.stat = row[18]?.toString() || "P";
        p.isCash = false;
        p.email = "";
        p.employmentStatus = "employed";
        p.isFlagged = false;
        p.flagReason = "";
        p.balance = 0;
        p.contactChanges = "";
        p.type = sellingMode ? "Sell" : "Buy";
        processedSheet.push(p);
      }
    });

    const validatedSheet = processedSheet.map(p => transactionSchema.parse(p));
    if (sellingMode) {
      results.sells.push(...validatedSheet);
    } else {
      results.buys.push(...validatedSheet);
    }
  });

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const filename = file.name.toLowerCase();
    let processedData: Transaction[] = [];

    // Detect type from filename or form field (add 'type' to form if needed; default Deposit)
    let typeParam = formData.get("type") as string | null;
    if (!typeParam) {
      typeParam = filename.includes("dep") ? "Deposit" : 
                  filename.includes("wd") ? "Withdrawal" : "Buy";  // Default for buy/sell
    }
    const isBuySell = filename.includes("buy") || filename.includes("sell") || typeParam === "Buy" || typeParam === "Sell";

    let csvBuffer: string;
    if (isBuySell) {
      const { buys, sells } = processBuySell(buffer);
      processedData.push(...buys, ...sells);
      // For CSV save, combine buys/sells
      const combined = [...buys, ...sells].map(t => ({ ...t, id: undefined }));  // Exclude id for CSV
      csvBuffer = Papa.unparse(combined);
    } else {
      const type = typeParam as "Deposit" | "Withdrawal";
      processedData = processDepWd(buffer, type);
      // For CSV
      const combined = processedData.map(t => ({ ...t, id: undefined }));
      csvBuffer = Papa.unparse(combined);
    }

    // Save raw CSV to public/raw_csvs/
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const csvName = `${file.name.replace(/\.[^/.]+$/, "")}_${typeParam}_${timestamp}.csv`;
    const csvPath = join(process.cwd(), "public", "raw_csvs", csvName);
    writeFileSync(csvPath, csvBuffer);

    return NextResponse.json({ data: processedData, csvPath: `/raw_csvs/${csvName}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}