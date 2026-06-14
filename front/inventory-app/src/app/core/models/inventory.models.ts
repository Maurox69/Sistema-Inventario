// ─── Product ───────────────────────────────────────────────────────────────

export interface ProductRequestDTO {
  name: string;
  description: string;
  requiresBarcodeGeneration: boolean;
  codePrefix: string; // [0, 10] chars
}

export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  requiresBarcodeGeneration: boolean;
  codePrefix: string;
}

// ─── Inventory ─────────────────────────────────────────────────────────────

export interface ItemSummaryDTO {
  uniqueCode: string;
  productName: string;
  status: string;
  currentHolder: string;
  ingestedAt: string | null;
  lastTransactionAt: string | null;
}

export interface PageItemSummaryDTO {
  totalElements: number;   // int64
  totalPages: number;      // int32
  size: number;            // int32
  content: ItemSummaryDTO[];
  number: number;          // int32 — página actual (0-based)
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface TransactionHistoryDTO {
  transactionType: string;
  timestamp: string;        // ISO date-time
  responsibleUser: string;
  notes: string;
}

// ─── Ingest ────────────────────────────────────────────────────────────────

export interface IngestionRequestDTO {
  productId: number;  // int64
  quantity: number;   // int32 >= 1
}

export interface ItemQRResponseDTO {
  itemId: number;       // int64
  uniqueCode: string;
  productName: string;
  status: string;
  qrImageBase64: string;
}

// ─── Scan ──────────────────────────────────────────────────────────────────

export interface ScanRequestDTO {
  uniqueCode: string;
  action: string;          // CHECKOUT | CHECKIN | REPAIR | RETIRE
  responsibleUser: string;
  notes: string;
}

export interface ScanResponseDTO {
  itemId: number;       // int64
  uniqueCode: string;
  productName: string;
  newStatus: string;
  currentHolder: string;
}


// ─── PDF Export ────────────────────────────────────────────────────────────

export interface PdfExportRequestDTO {
  uniqueCodes: string[];  // códigos de los ítems a exportar
  columns: number;        // int32 — columnas del grid de QR
  cellPadding: number;    // float — espaciado entre celdas
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export type ItemStatus = 'AVAILABLE' | 'IN_USE' | 'IN_REPAIR' | 'RETIRED' | string;
export type ScanAction = 'CHECKOUT' | 'CHECKIN' | 'CONSUME';
