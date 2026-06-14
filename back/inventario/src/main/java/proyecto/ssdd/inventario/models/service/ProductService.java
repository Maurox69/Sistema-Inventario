package proyecto.ssdd.inventario.models.service;

import proyecto.ssdd.inventario.models.dto.ProductRequestDTO;
import proyecto.ssdd.inventario.models.dto.ProductResponseDTO;

import java.util.List;

public interface ProductService {
    ProductResponseDTO createProduct(ProductRequestDTO request);
    List<ProductResponseDTO> getAllProducts();
}