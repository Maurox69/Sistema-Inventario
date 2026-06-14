package proyecto.ssdd.inventario.models.serviceImpl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import proyecto.ssdd.inventario.models.entity.Item;
import proyecto.ssdd.inventario.models.entity.ItemStatus;
import proyecto.ssdd.inventario.models.entity.Product;
import proyecto.ssdd.inventario.models.repository.ItemRepository;
import proyecto.ssdd.inventario.models.repository.ProductRepository;
import proyecto.ssdd.inventario.models.service.InventoryIngestionService;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
public class InventoryIngestionServiceImpl implements InventoryIngestionService {

    private final ProductRepository productRepository;
    private final ItemRepository itemRepository;

    public InventoryIngestionServiceImpl(ProductRepository productRepository, ItemRepository itemRepository) {
        this.productRepository = productRepository;
        this.itemRepository = itemRepository;
    }

    //generar codigo QR
    public byte[] generateQRCodeLabel(String uniqueCode, String productName) throws Exception {
        int qrWidth = 300;
        int qrHeight = 300;
        int textZoneHeight = 70; // Espacio superior reservado para el texto informativo
        int totalHeight = qrHeight + textZoneHeight;

        // 1. Generar el código QR puro con ZXing
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(uniqueCode, BarcodeFormat.QR_CODE, qrWidth, qrHeight);
        BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        // 2. Crear un lienzo nuevo ampliado para la etiqueta entera
        BufferedImage combinedLabel = new BufferedImage(qrWidth, totalHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = combinedLabel.createGraphics();

        // Habilitar Antialiasing para que las letras se vean nítidas al imprimir
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Rellenar fondo de color blanco
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, qrWidth, totalHeight);

        // 3. Escribir metadatos del dispositivo con fuente auto-ajustable
        g2d.setColor(Color.BLACK);

        int fontSize = 18; // Tamaño inicial grande
        Font font;
        FontMetrics metrics;

        // El sistema irá achicando la letra 1 punto a la vez hasta que quepa en el ancho de la etiqueta
        do {
            font = new Font("Arial", Font.BOLD, fontSize);
            g2d.setFont(font);
            metrics = g2d.getFontMetrics();
            fontSize--;
        } while (metrics.stringWidth(productName) > (qrWidth - 20) && fontSize > 9);

        // Si el nombre es absurdamente largo y ni siquiera en tamaño 9 cabe, lo truncamos suavemente a 35 caracteres
        String finalText = productName;
        if (metrics.stringWidth(finalText) > (qrWidth - 20)) {
            finalText = finalText.substring(0, Math.min(finalText.length(), 35)) + "...";
        }

        int nameX = (qrWidth - metrics.stringWidth(finalText)) / 2; // Centrado horizontal
        g2d.drawString(finalText, nameX, 28);

        // Dibujar el Código Único (Identificador visible)
        g2d.setFont(new Font("Arial", Font.PLAIN, 12));
        metrics = g2d.getFontMetrics();
        int codeX = (qrWidth - metrics.stringWidth(uniqueCode)) / 2; // Centrado horizontal
        g2d.drawString(uniqueCode, codeX, 50);

        // 4. Estampar el código QR debajo de la zona de texto
        g2d.drawImage(qrImage, 0, textZoneHeight, null);
        g2d.dispose();

        // 5. Transformar a arreglo de bytes PNG
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(combinedLabel, "png", baos);
        return baos.toByteArray();
    }


    @Override
    @Transactional
    public List<Item> generateAndIngestItems(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        List<Item> newItems = new ArrayList<>();

        for (int i = 0; i < quantity; i++) {
            Item newItem = new Item();
            newItem.setProduct(product);
            newItem.setStatus(ItemStatus.DISPONIBLE);

            // <-- AQUÍ AGREGAMOS LA FECHA DE INGESTA Y ÚLTIMA TRANSACCIÓN -->
            LocalDateTime now = LocalDateTime.now();
            newItem.setIngestedAt(now);
            newItem.setLastTransactionAt(now);

            if (product.isRequiresBarcodeGeneration()) {
                newItem.setUniqueCode(generateUniqueAlphanumericCode(product.getCodePrefix()));
            } else {
                newItem.setUniqueCode("PENDIENTE_" + UUID.randomUUID().toString().substring(0, 5));
            }
            newItems.add(newItem);
        }

        return itemRepository.saveAll(newItems);
    }

    @Override
    public byte[] generateQRCodeImage(String barcodeText) throws Exception {
        // Inicializamos el generador de QR de ZXing
        QRCodeWriter barcodeWriter = new QRCodeWriter();

        // Creamos una matriz de 200x200 píxeles
        BitMatrix bitMatrix = barcodeWriter.encode(barcodeText, BarcodeFormat.QR_CODE, 200, 200);

        // Convertimos la matriz a formato imagen (PNG) en un flujo de bytes
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return outputStream.toByteArray();
    }

    // Método privado auxiliar
    private String generateUniqueAlphanumericCode(String prefix) {
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String finalCode = (prefix != null ? prefix.toUpperCase() : "INV") + "-" + randomPart;

        while (itemRepository.findByUniqueCode(finalCode).isPresent()) {
            randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            finalCode = (prefix != null ? prefix.toUpperCase() : "INV") + "-" + randomPart;
        }
        return finalCode;
    }
}