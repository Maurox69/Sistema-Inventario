package proyecto.ssdd.inventario.models.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "consumed_items")
public class ConsumedItem {

    @Id
    private Long id; // ID explícito proveniente del ítem original

    @Column(name = "unique_code", nullable = false, unique = true)
    private String uniqueCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String status;

    @Column(name = "current_holder")
    private String currentHolder;

    @Column(name = "consumed_at", nullable = false)
    private LocalDateTime consumedAt;

    @Column(name = "consumed_by", nullable = false)
    private String consumedBy;

    @Column(name = "ingested_at")
    private LocalDateTime ingestedAt;

    public LocalDateTime getIngestedAt() { return ingestedAt; }
    public void setIngestedAt(LocalDateTime ingestedAt) { this.ingestedAt = ingestedAt; }

    @Column(name = "last_transaction_at")
    private LocalDateTime lastTransactionAt;

    public LocalDateTime getLastTransactionAt() { return lastTransactionAt; }
    public void setLastTransactionAt(LocalDateTime lastTransactionAt) { this.lastTransactionAt = lastTransactionAt; }

    // Constructores, Getters y Setters
    public ConsumedItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUniqueCode() { return uniqueCode; }
    public void setUniqueCode(String uniqueCode) { this.uniqueCode = uniqueCode; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrentHolder() { return currentHolder; }
    public void setCurrentHolder(String currentHolder) { this.currentHolder = currentHolder; }

    public LocalDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(LocalDateTime consumedAt) { this.consumedAt = consumedAt; }

    public String getConsumedBy() { return consumedBy; }
    public void setConsumedBy(String consumedBy) { this.consumedBy = consumedBy; }
}
