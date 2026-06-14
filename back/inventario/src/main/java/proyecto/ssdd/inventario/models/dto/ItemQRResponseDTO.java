package proyecto.ssdd.inventario.models.dto;

public record ItemQRResponseDTO(
        Long itemId,
        String uniqueCode,
        String productName,
        String status,
        String qrImageBase64
) {}