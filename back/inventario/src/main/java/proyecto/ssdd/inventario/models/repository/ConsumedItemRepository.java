package proyecto.ssdd.inventario.models.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable; // <-- ESTA ES LA IMPORTACIÓN CORRECTA
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.ssdd.inventario.models.entity.ConsumedItem;

import java.util.Optional;
@Repository
public interface ConsumedItemRepository extends JpaRepository<ConsumedItem, Long> {
    Optional<ConsumedItem> findByUniqueCode(String uniqueCode);
    Page<ConsumedItem> findAll(Pageable pageable);
}