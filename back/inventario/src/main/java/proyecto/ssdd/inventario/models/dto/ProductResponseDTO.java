package proyecto.ssdd.inventario.models.dto;

public record ProductResponseDTO(
        Long id,
        String name,
        String description,
        boolean requiresBarcodeGeneration,
        String codePrefix
) {}