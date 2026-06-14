package proyecto.ssdd.inventario.models.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import proyecto.ssdd.inventario.models.entity.InventoryTransaction;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    // Obtiene toda la línea de tiempo de un objeto específico mediante su ID numérico plano,
    // del más reciente al más antiguo.
    List<InventoryTransaction> findByItemIdOrderByTimestampDesc(Long itemId);

    @Query("SELECT MAX(t.timestamp) FROM InventoryTransaction t WHERE t.itemId = :itemId")
    LocalDateTime findLastTransactionDateByItemId(@Param("itemId") Long itemId);
}