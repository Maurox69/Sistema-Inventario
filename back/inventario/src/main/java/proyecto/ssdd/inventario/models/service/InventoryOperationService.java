package proyecto.ssdd.inventario.models.service;

import proyecto.ssdd.inventario.models.entity.Item;

public interface InventoryOperationService {
    Item processScan(String uniqueCode, String action, String responsibleUser, String notes);
}
