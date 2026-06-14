package proyecto.ssdd.inventario.models.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.ssdd.inventario.models.dto.ProductRequestDTO;
import proyecto.ssdd.inventario.models.dto.ProductResponseDTO;
import proyecto.ssdd.inventario.models.entity.Product;
import proyecto.ssdd.inventario.models.repository.ProductRepository;
import proyecto.ssdd.inventario.models.service.ProductService;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public ProductResponseDTO createProduct(ProductRequestDTO request) {
        // Regla de negocio: No permitir productos duplicados
        if (productRepository.findByName(request.name()).isPresent()) {
            throw new RuntimeException("Ya existe un producto con el nombre: " + request.name());
        }

        Product product = new Product();
        product.setName(request.name());
        product.setDescription(request.description());
        product.setRequiresBarcodeGeneration(request.requiresBarcodeGeneration());

        // Si el usuario envía un prefijo en minúsculas, lo normalizamos
        if (request.codePrefix() != null) {
            product.setCodePrefix(request.codePrefix().toUpperCase());
        }

        Product savedProduct = productRepository.save(product);

        return mapToDTO(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private ProductResponseDTO mapToDTO(Product product) {
        return new ProductResponseDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.isRequiresBarcodeGeneration(),
                product.getCodePrefix()
        );
    }
}