package proyecto.ssdd.inventario.models.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record IngestionRequestDTO(
        @NotNull(message = "El ID del producto es obligatorio")
        Long productId,

        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        int quantity
) {}