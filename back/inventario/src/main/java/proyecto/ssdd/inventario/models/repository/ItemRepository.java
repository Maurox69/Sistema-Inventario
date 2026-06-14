package proyecto.ssdd.inventario.models.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.ssdd.inventario.models.entity.Item;
import proyecto.ssdd.inventario.models.entity.ItemStatus;


import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Este método se ejecutará cada vez que pistolees un QR o código de barras
    Optional<Item> findByUniqueCode(String uniqueCode);

    // Útil para filtrar en el panel de Angular cuántas cosas hay prestadas, disponibles, etc.
    List<Item> findByStatus(ItemStatus status);

    // Para ver las existencias físicas de un producto específico del catálogo
    List<Item> findByProductId(Long productId);

    // Devuelve ítems filtrados por estado, paginados.
    Page<Item> findByStatus(ItemStatus status, Pageable pageable);

}
