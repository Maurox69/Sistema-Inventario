package proyecto.ssdd.inventario.models.dto;

import java.util.List;

public record PdfExportRequestDTO(
        List<String> uniqueCodes,
        int columns,       // Cantidad de etiquetas por fila (Ej: 3, 4, 5)
        float cellPadding  // Espacio en blanco alrededor del QR (A mayor padding, QR más pequeño)
) {}
