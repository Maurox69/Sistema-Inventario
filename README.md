# Sistema-Inventario
Sistema web de gestión de inventario de activos de oficina — Angular 17 + Spring Boot + MySQL


# Sistema de Inventario SSDD

Sistema web fullstack para la gestión de activos y consumibles de oficina,
desarrollado con Angular 17 en el frontend y Spring Boot en el backend.

## Características

- 📦 **Inventario** — tabla paginada con filtros en tiempo real por código,
  producto, estado, titular y rango de fechas. Pestañas para stock activo
  y consumidos.
- 📊 **Dashboard** — KPIs en tiempo real, distribución de estados, últimos
  movimientos, alertas de préstamos vencidos y ranking de prestadores.
- 🏷️ **Productos** — catálogo de tipos de activos con generación automática
  de prefijo de código e ingreso masivo de stock con generación de QR.
- 📷 **Scanner** — registro de movimientos mediante código QR o entrada manual.
  Acciones: Prestar, Devolver y Consumir.
- 📄 **Exportación PDF** — selección múltiple de ítems y generación de PDF
  con etiquetas QR configurando columnas y espaciado.
- 📱 **Responsive** — diseño adaptado para desktop, tablet y móvil con
  navegación hamburguesa.

## Stack tecnológico

### Frontend
- Angular 17 (Standalone Components, Signals, Control Flow)
- Angular Material 17
- RxJS
- TypeScript 5.2

### Backend
- Spring Boot 3
- Spring Data JPA
- MySQL
- Swagger / OpenAPI 3.1

## Flujo principal

1. Se crean **productos** como tipos de activos (Mouse, Teclado, Toner, etc.)
2. Se ingresa **stock** generando N ítems con QR únicos por producto
3. El **scanner** registra préstamos, devoluciones y consumos
4. El **inventario** muestra el estado en tiempo real con historial por ítem
5. Los ítems consumidos se mueven a una tabla separada manteniendo su historial

## Instalación

### Frontend
\```bash
cd frontend
npm install
npm start
\```

### Backend
Configurar \`application.properties\` con las credenciales de MySQL y ejecutar
el proyecto Spring Boot. La base de datos se crea automáticamente con JPA.

### Proxy
El frontend incluye \`proxy.conf.json\` que redirige \`/api/*\` a
\`http://localhost:8080\` para evitar problemas de CORS en desarrollo.

## Capturas

_Próximamente_

## Autor

Mauro — [@tu-usuario-github](https://github.com/tu-usuario)
