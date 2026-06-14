package proyecto.ssdd.inventario.models.dto;

import jakarta.validation.constraints.NotBlank;

public record ScanRequestDTO(
        @NotBlank(message = "El código es obligatorio")
        String uniqueCode,

        @NotBlank(message = "La acción es obligatoria (PRESTAR, DEVOLVER, DAR_DE_BAJA)")
        String action,

        @NotBlank(message = "El usuario responsable es obligatorio")
        String responsibleUser,

        String notes // Opcional: "Se entrega a soporte", "Cable roto", etc.
) {}