package proyecto.ssdd.inventario.models.serviceImpl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.ssdd.inventario.models.dto.ItemSummaryDTO;
import proyecto.ssdd.inventario.models.dto.PdfExportRequestDTO;
import proyecto.ssdd.inventario.models.dto.TransactionHistoryDTO;
import proyecto.ssdd.inventario.models.entity.ConsumedItem;
import proyecto.ssdd.inventario.models.entity.Item;
import proyecto.ssdd.inventario.models.entity.ItemStatus;
import proyecto.ssdd.inventario.models.repository.ConsumedItemRepository;
import proyecto.ssdd.inventario.models.repository.InventoryTransactionRepository;
import proyecto.ssdd.inventario.models.repository.ItemRepository;
import proyecto.ssdd.inventario.models.service.InventoryIngestionService;
import proyecto.ssdd.inventario.models.service.InventoryQueryService;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true) // Optimiza el rendimiento a nivel de base de datos para lecturas
public class InventoryQueryServiceImpl implements InventoryQueryService {

    private final ItemRepository itemRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final InventoryIngestionService ingestionService;
    private final ConsumedItemRepository consumedItemRepository; // <-- Nuevo repositorio inyectado

    public InventoryQueryServiceImpl(ItemRepository itemRepository,
                                     InventoryTransactionRepository transactionRepository,
                                     InventoryIngestionService ingestionService,
                                     ConsumedItemRepository consumedItemRepository) {
        this.itemRepository = itemRepository;
        this.transactionRepository = transactionRepository;
        this.ingestionService = ingestionService;
        this.consumedItemRepository = consumedItemRepository;
    }

    @Override
    public byte[] generatePdfStickerSheet(PdfExportRequestDTO request) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, baos);
        document.open();

        PdfPTable table = new PdfPTable(request.columns());
        table.setWidthPercentage(100);
        table.setSpacingBefore(15f);

        for (String code : request.uniqueCodes()) {
            String productName;

            // Buscar primero en ítems activos, luego en consumidos si no existe
            Optional<Item> activeItem = itemRepository.findByUniqueCode(code);
            if (activeItem.isPresent()) {
                productName = activeItem.get().getProduct().getName();
            } else {
                ConsumedItem consumedItem = consumedItemRepository.findByUniqueCode(code)
                        .orElseThrow(() -> new RuntimeException("Código no encontrado en ninguna tabla: " + code));
                productName = consumedItem.getProduct().getName();
            }

            byte[] labelBytes = ingestionService.generateQRCodeLabel(code, productName);
            Image stickerImage = Image.getInstance(labelBytes);
            stickerImage.setAlignment(Image.ALIGN_CENTER);

            PdfPCell cell = new PdfPCell();
            cell.addElement(stickerImage);
            cell.setPadding(request.cellPadding());
            cell.setBorder(PdfPCell.BOX);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            table.addCell(cell);
        }

        table.completeRow();
        document.add(table);
        document.close();

        return baos.toByteArray();
    }

    @Override
    public Page<ItemSummaryDTO> getInventory(String status, Pageable pageable) {
        Page<Item> itemPage;

        if (status != null && !status.isBlank()) {
            ItemStatus itemStatus = ItemStatus.valueOf(status.toUpperCase());
            itemPage = itemRepository.findByStatus(itemStatus, pageable);
        } else {
            itemPage = itemRepository.findAll(pageable);
        }

        return itemPage.map(item -> new ItemSummaryDTO(
                item.getUniqueCode(),
                item.getProduct().getName(),
                item.getStatus().name(),
                item.getCurrentHolder(),
                item.getIngestedAt(),
                item.getLastTransactionAt() // <-- Usamos la nueva columna física, eliminando N+1
        ));
    }

    @Override
    public Page<ItemSummaryDTO> getConsumedInventory(Pageable pageable) {
        Page<ConsumedItem> consumedPage = consumedItemRepository.findAll(pageable);

        return consumedPage.map(c -> new ItemSummaryDTO(
                c.getUniqueCode(),
                c.getProduct().getName(),
                "CONSUMIDO",
                c.getConsumedBy(),
                c.getIngestedAt(),
                c.getLastTransactionAt() // <-- Usamos la nueva columna física, eliminando N+1
        ));
    }

    @Override
    public List<TransactionHistoryDTO> getItemHistory(String uniqueCode) {
        Long itemId;

        // 1. Intentar buscar primero el ID en la tabla activa
        Optional<Item> activeItem = itemRepository.findByUniqueCode(uniqueCode);
        if (activeItem.isPresent()) {
            itemId = activeItem.get().getId();
        } else {
            // 2. Si no existe activamente, recuperar el ID desde la tabla de consumidos
            ConsumedItem consumedItem = consumedItemRepository.findByUniqueCode(uniqueCode)
                    .orElseThrow(() -> new RuntimeException("Código de inventario inexistente: " + uniqueCode));
            itemId = consumedItem.getId();
        }

        // 3. Buscar las transacciones utilizando el ID numérico plano
        return transactionRepository.findByItemIdOrderByTimestampDesc(itemId)
                .stream()
                .map(tx -> new TransactionHistoryDTO(
                        tx.getTransactionType().name(),
                        tx.getTimestamp(),
                        tx.getResponsibleUser(),
                        tx.getNotes()
                )).toList();
    }
}