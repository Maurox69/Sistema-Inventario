package proyecto.ssdd.inventario.models.dto;

import java.time.LocalDateTime;

public record TransactionHistoryDTO(
        String transactionType,
        LocalDateTime timestamp,
        String responsibleUser,
        String notes
) {}