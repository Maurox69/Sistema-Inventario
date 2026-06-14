package proyecto.ssdd.inventario.models.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "responsible_user", nullable = false)
    private String responsibleUser;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionAction transactionType;

    @Column(name = "item_id", nullable = false) // <-- Cambiado a Long plano para evitar excepciones de ciclo de vida
    private Long itemId;

    public InventoryTransaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getResponsibleUser() { return responsibleUser; }
    public void setResponsibleUser(String responsibleUser) { this.responsibleUser = responsibleUser; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public TransactionAction getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionAction transactionType) { this.transactionType = transactionType; }

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
}