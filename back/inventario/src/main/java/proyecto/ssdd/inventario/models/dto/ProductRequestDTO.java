package proyecto.ssdd.inventario.models.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductRequestDTO(
        @NotBlank(message = "El nombre del producto es obligatorio")
        String name,

        String description,

        boolean requiresBarcodeGeneration,

        @Size(max = 10, message = "El prefijo no puede tener más de 10 caracteres")
        String codePrefix
) {}