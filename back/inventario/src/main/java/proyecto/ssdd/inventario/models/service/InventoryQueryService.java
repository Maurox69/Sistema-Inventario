package proyecto.ssdd.inventario.models.service;

import org.springframework.data.domain.Page;
import proyecto.ssdd.inventario.models.dto.ItemSummaryDTO;
import proyecto.ssdd.inventario.models.dto.PdfExportRequestDTO;
import proyecto.ssdd.inventario.models.dto.TransactionHistoryDTO;
import java.util.List;

public interface InventoryQueryService {

    byte[] generatePdfStickerSheet(PdfExportRequestDTO request) throws Exception;

    Page<ItemSummaryDTO> getInventory(String status, org.springframework.data.domain.Pageable pageable);

    List<TransactionHistoryDTO> getItemHistory(String uniqueCode);

    Page<ItemSummaryDTO> getConsumedInventory(org.springframework.data.domain.Pageable pageable);
}