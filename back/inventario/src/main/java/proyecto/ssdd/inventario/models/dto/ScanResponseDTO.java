package proyecto.ssdd.inventario.models.dto;

public record ScanResponseDTO(
        Long itemId,
        String uniqueCode,
        String productName,
        String newStatus,
        String currentHolder
) {}