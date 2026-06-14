# Inventario SSDD — Frontend Angular

Dashboard completo para el sistema de gestión de activos y consumibles.

## Stack

- **Angular 17** (Standalone Components, Signals)
- **Angular Material 17** — dark theme
- **RxJS** — comunicación con el API
- **TypeScript 5.2**

## Requisitos

- Node.js 18+
- Angular CLI 17: `npm install -g @angular/cli`
- Backend corriendo en `http://localhost:8080`

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo (con proxy al backend)
npm start
```

La app abrirá en `http://localhost:4200`.  
El proxy redirige automáticamente `/api/*` → `http://localhost:8080/api/*` para evitar CORS.

## Estructura del proyecto

```
src/app/
├── core/
│   ├── models/          # interfaces que mapean los DTOs del API
│   │   └── inventory.models.ts
│   ├── services/
│   │   ├── inventory.service.ts   # GET /inventory, POST /scan, POST /ingest
│   │   └── product.service.ts     # GET /products, POST /products
│   └── interceptors/
│       └── error.interceptor.ts   # muestra snackbar en errores HTTP
├── layout/
│   └── sidebar.component.ts       # navegación lateral
├── shared/
│   └── components/
│       └── status-badge.component.ts  # badge de estado reutilizable
└── features/
    ├── inventory/
    │   └── components/
    │       ├── inventory-list.component.ts   # tabla paginada + filtro por estado
    │       └── history-dialog.component.ts   # timeline de transacciones
    ├── products/
    │   └── components/
    │       ├── product-list.component.ts     # listado + formulario de creación
    │       └── ingest-form.component.ts      # ingreso de stock + visor de QR
    └── scanner/
        └── components/
            └── scanner.component.ts          # registro de escaneos (CHECKOUT/CHECKIN/...)
```

## Rutas

| Ruta         | Componente             | Descripción                          |
|--------------|------------------------|--------------------------------------|
| `/inventory` | InventoryListComponent | Lista paginada con filtro por estado |
| `/products`  | ProductListComponent   | Catálogo + formulario de creación    |
| `/scanner`   | ScannerComponent       | Registro de escaneos QR              |
| `/ingest`    | IngestFormComponent    | Ingreso de stock + generación de QR  |

## API consumida

Todos los endpoints de `http://localhost:8080/api/v1`:

| Método | Endpoint                         | Uso                        |
|--------|----------------------------------|----------------------------|
| GET    | `/inventory`                     | Inventario paginado        |
| GET    | `/inventory/{code}/history`      | Historial de transacciones |
| POST   | `/inventory/ingest`              | Ingresar stock             |
| POST   | `/inventory/scan`                | Registrar escaneo          |
| GET    | `/products`                      | Listar productos           |
| POST   | `/products`                      | Crear producto             |

## Acciones de escaneo disponibles

- `CHECKOUT` — asignar ítem a un usuario (Salida)
- `CHECKIN` — devolver ítem al inventario (Entrada)
- `REPAIR` — enviar a reparación
- `RETIRE` — dar de baja el ítem

## Personalización

Los colores del tema se controlan con variables CSS en `src/styles.scss`:

```scss
:root {
  --bg-page:     #0f1117;   /* fondo general */
  --bg-sidebar:  #161b25;   /* sidebar */
  --bg-card:     #1a2030;   /* tarjetas */
  --accent:      #6366f1;   /* color primario (indigo) */
}
```

Cambia `--accent` para personalizar el color de énfasis.
