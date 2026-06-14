package proyecto.ssdd.inventario.models.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import proyecto.ssdd.inventario.models.entity.*;
import proyecto.ssdd.inventario.models.repository.ConsumedItemRepository;
import proyecto.ssdd.inventario.models.repository.InventoryTransactionRepository;
import proyecto.ssdd.inventario.models.repository.ItemRepository;
import proyecto.ssdd.inventario.models.service.InventoryOperationService;

import java.time.LocalDateTime;

@Service
public class InventoryOperationServiceImpl implements InventoryOperationService {

    private final ItemRepository itemRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ConsumedItemRepository consumedItemRepository;

    public InventoryOperationServiceImpl(ItemRepository itemRepository,
                                         InventoryTransactionRepository transactionRepository,
                                         ConsumedItemRepository consumedItemRepository) {
        this.itemRepository = itemRepository;
        this.transactionRepository = transactionRepository;
        this.consumedItemRepository = consumedItemRepository;
    }

    @Override
    @Transactional
    public Item processScan(String uniqueCode, String actionStr, String responsibleUser, String notes) {
        // 1. Buscar el ítem en la tabla activa
        Item item = itemRepository.findByUniqueCode(uniqueCode)
                .orElseThrow(() -> new RuntimeException("Ítem no encontrado o ya fue consumido: " + uniqueCode));

        // 2. Parsear la acción
        TransactionAction action;
        try {
            action = TransactionAction.valueOf(actionStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Acción no válida: " + actionStr);
        }

        // 3. Flujo especial para CONSUME (Mover a la otra tabla y guardar historial plano)
        if (action == TransactionAction.CONSUME) {

            // A. Trasladar los datos a la nueva entidad independiente
            ConsumedItem consumedItem = new ConsumedItem();
            consumedItem.setId(item.getId());
            consumedItem.setUniqueCode(item.getUniqueCode());
            consumedItem.setProduct(item.getProduct());
            consumedItem.setStatus("CONSUMIDO");
            consumedItem.setCurrentHolder(responsibleUser);
            LocalDateTime now = LocalDateTime.now();
            consumedItem.setConsumedAt(now);
            consumedItem.setIngestedAt(item.getIngestedAt());
            consumedItem.setLastTransactionAt(now); // <-- Nueva columna física
            consumedItem.setConsumedBy(responsibleUser);
            consumedItemRepository.save(consumedItem);

            // B. Registrar el historial usando el ID plano (Evita el TransientObjectException)
            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setItemId(item.getId()); // <-- ID Numérico plano
            transaction.setTransactionType(action);
            transaction.setTimestamp(now);
            transaction.setResponsibleUser(responsibleUser);
            transaction.setNotes(notes);
            transactionRepository.save(transaction);

            // C. Actualizar los datos en el objeto en memoria para la respuesta del controlador
            item.setStatus(ItemStatus.CONSUMIDO);
            item.setCurrentHolder(responsibleUser);

            // D. Eliminar el ítem físicamente de la tabla activa
            itemRepository.delete(item);

            return item;
        }

        // 4. Flujo normal para acciones operativas (CHECKOUT y CHECKIN)
        switch (action) {
            case CHECKOUT:
                if (item.getStatus() == ItemStatus.PRESTADO) {
                    throw new RuntimeException("El ítem ya se encuentra prestado.");
                }
                item.setStatus(ItemStatus.PRESTADO);
                item.setCurrentHolder(responsibleUser);
                break;

            case CHECKIN:
                if (item.getStatus() == ItemStatus.DISPONIBLE) {
                    throw new RuntimeException("El ítem ya está disponible en inventario.");
                }
                item.setStatus(ItemStatus.DISPONIBLE);
                item.setCurrentHolder(null);
                break;
        }

        LocalDateTime now = LocalDateTime.now();
        item.setLastTransactionAt(now); // <-- Nueva columna física
        itemRepository.save(item);

        // Registrar el historial de transacciones estándar usando el ID plano
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setItemId(item.getId()); // <-- ID Numérico plano
        transaction.setTransactionType(action);
        transaction.setTimestamp(now);
        transaction.setResponsibleUser(responsibleUser);
        transaction.setNotes(notes);
        transactionRepository.save(transaction);

        return item;
    }
}