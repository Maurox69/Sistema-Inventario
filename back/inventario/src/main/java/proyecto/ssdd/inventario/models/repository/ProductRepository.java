package proyecto.ssdd.inventario.models.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.ssdd.inventario.models.entity.Product;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Para evitar duplicados al registrar un nuevo tipo de objeto
    Optional<Product> findByName(String name);
}