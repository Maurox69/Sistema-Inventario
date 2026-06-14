import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PageItemSummaryDTO,
  TransactionHistoryDTO,
  IngestionRequestDTO,
  ItemQRResponseDTO,
  ScanRequestDTO,
  ScanResponseDTO,
  PdfExportRequestDTO,
} from '../models/inventory.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  /** GET /inventory — paginado, filtro opcional por status */
  getInventory(
    page = 0,
    size = 10,
    status?: string,
    sort = 'lastTransactionAt,desc'
  ): Observable<PageItemSummaryDTO> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    if (status) params = params.set('status', status);
    return this.http.get<PageItemSummaryDTO>(`${BASE}/inventory`, { params });
  }

  /** GET /inventory/{uniqueCode}/history */
  getHistory(uniqueCode: string): Observable<TransactionHistoryDTO[]> {
    return this.http.get<TransactionHistoryDTO[]>(
      `${BASE}/inventory/${uniqueCode}/history`
    );
  }

  /** POST /inventory/ingest → crea N ítems con QR */
  ingest(body: IngestionRequestDTO): Observable<ItemQRResponseDTO[]> {
    return this.http.post<ItemQRResponseDTO[]>(`${BASE}/inventory/ingest`, body);
  }

  /** POST /inventory/scan → registra un escaneo */
  scan(body: ScanRequestDTO): Observable<ScanResponseDTO> {
    return this.http.post<ScanResponseDTO>(`${BASE}/inventory/scan`, body);
  }

  /** POST /inventory/export-pdf → descarga PDF con QRs */
  exportPdf(body: PdfExportRequestDTO): Observable<Blob> {
    return this.http.post(
      `${BASE}/inventory/export-pdf`,
      body,
      { responseType: 'blob' }
    );
  }

  /** GET /inventory/consumed — ítems consumidos paginados */
  getConsumed(
    page = 0,
    size = 10,
    sort = 'lastTransactionAt,desc'
  ): Observable<PageItemSummaryDTO> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    return this.http.get<PageItemSummaryDTO>(`${BASE}/inventory/consumed`, { params });
  }
}
