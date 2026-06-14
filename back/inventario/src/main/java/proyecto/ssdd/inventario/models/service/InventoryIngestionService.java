package proyecto.ssdd.inventario.models.service;


import proyecto.ssdd.inventario.models.entity.Item;
import java.util.List;

public interface InventoryIngestionService {

    /**
     * Genera un lote de ítems en la BD, asigna códigos y devuelve la lista creada.
     */
    List<Item> generateAndIngestItems(Long productId, int quantity);

    /**
     * Genera la imagen del QR en un arreglo de bytes para enviarla al Frontend.
     */
    byte[] generateQRCodeImage(String barcodeText) throws Exception;
    byte[] generateQRCodeLabel(String uniqueCode, String productName) throws Exception;
}