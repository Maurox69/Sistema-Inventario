package proyecto.ssdd.inventario.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proyecto.ssdd.inventario.models.dto.*;
import proyecto.ssdd.inventario.models.entity.Item;
import proyecto.ssdd.inventario.models.service.InventoryIngestionService;
import proyecto.ssdd.inventario.models.service.InventoryOperationService;
import proyecto.ssdd.inventario.models.service.InventoryQueryService;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/inventory")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryIngestionService ingestionService;
    private final InventoryOperationService operationService;
    private final InventoryQueryService queryService;

//endpoint para generar PDF
@PostMapping("/export-pdf")
public ResponseEntity<byte[]> exportInventoryLabelsToPdf(@RequestBody PdfExportRequestDTO request) {
    try {
        // Pasamos el DTO completo
        byte[] pdfContent = queryService.generatePdfStickerSheet(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "etiquetas_inventario.pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
    } catch (Exception e) {
        throw new RuntimeException("Error al compilar el catálogo PDF: " + e.getMessage());
    }
}

// ==========================================
// ENDPOINTS DE LECTURA (GET)
// ==========================================

    @GetMapping
    public ResponseEntity<Page<ItemSummaryDTO>> getAllInventory(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(queryService.getInventory(status, pageable));
    }

    @GetMapping("/{uniqueCode}/history")
    public ResponseEntity<List<TransactionHistoryDTO>> getItemHistory(@PathVariable String uniqueCode) {
        return ResponseEntity.ok(queryService.getItemHistory(uniqueCode));
    }


    /**
     * Endpoint para registrar un lote de productos (Ingreso masivo).
     */
    @PostMapping("/ingest")
    public ResponseEntity<List<ItemQRResponseDTO>> ingestItems(@Valid @RequestBody IngestionRequestDTO request) throws Exception {

        List<Item> createdItems = ingestionService.generateAndIngestItems(request.productId(), request.quantity());
        List<ItemQRResponseDTO> responseList = new ArrayList<>();

        for (Item item : createdItems) {
            String base64QR = null;
            if (item.getUniqueCode() != null && !item.getUniqueCode().startsWith("PENDIENTE_")) {
                byte[] qrBytes = ingestionService.generateQRCodeImage(item.getUniqueCode());
                // IMPORTANTE: Angular suele necesitar el prefijo de data URI para renderizar imágenes en Base64 directamente en un <img>
                base64QR = "data:image/png;base64," + Base64.getEncoder().encodeToString(qrBytes);
            }

            // Traducción del estado para el contrato del Frontend
            String frontendStatus = item.getStatus().name();
            if ("DISPONIBLE".equals(frontendStatus)) {
                frontendStatus = "AVAILABLE";
            }

            responseList.add(new ItemQRResponseDTO(
                    item.getId(),
                    item.getUniqueCode(),
                    item.getProduct().getName(),
                    frontendStatus, // Enviamos "AVAILABLE"
                    base64QR
            ));
        }

        return ResponseEntity.ok(responseList);
    }

    /**
     * Endpoint para procesar el pistoleo de un código (Barras o QR).
     * Cambia estados y registra auditoría.
     */
    /*Fíjate lo inmensamente limpio que queda el código ahora que solo se preocupa del "camino feliz":*/
    @PostMapping("/scan")
    public ResponseEntity<ScanResponseDTO> processItemScan(@Valid @RequestBody ScanRequestDTO request) {

        Item updatedItem = operationService.processScan(
                request.uniqueCode(),
                request.action(),
                request.responsibleUser(),
                request.notes()
        );

        // Mapeo exacto al DTO que requiere tu FrontEnd
        ScanResponseDTO response = new ScanResponseDTO(
                updatedItem.getId(), // O itemId si tu DTO se llama así
                updatedItem.getUniqueCode(),
                updatedItem.getProduct().getName(),
                updatedItem.getStatus().name(), // Aquí se asigará a newStatus en el DTO
                updatedItem.getCurrentHolder()
        );

        return ResponseEntity.ok(response);
    }

    // Nuevo endpoint para listado exclusivo de consumidos
    @GetMapping("/consumed")
    public ResponseEntity<org.springframework.data.domain.Page<ItemSummaryDTO>> getConsumedInventory(
            @PageableDefault(size = 10) Pageable pageable) {

        // Llamamos al servicio que nos devuelve la página nativa de Spring
        org.springframework.data.domain.Page<ItemSummaryDTO> response = queryService.getConsumedInventory(pageable);

        return ResponseEntity.ok(response);
    }
}
