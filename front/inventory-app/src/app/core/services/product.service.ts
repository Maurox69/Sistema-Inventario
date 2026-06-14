import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequestDTO, ProductResponseDTO } from '../models/inventory.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  /** GET /products */
  getProducts(): Observable<ProductResponseDTO[]> {
    return this.http.get<ProductResponseDTO[]>(`${BASE}/products`);
  }

  /** POST /products */
  createProduct(body: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http.post<ProductResponseDTO>(`${BASE}/products`, body);
  }
}
