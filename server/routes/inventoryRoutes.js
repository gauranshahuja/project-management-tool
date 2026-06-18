const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// Locations (warehouses)
router.get('/locations', protect, inv.getLocations);
router.post('/locations', protect, inv.createLocation);
router.put('/locations/:id', protect, inv.updateLocation);

// Products (catalog)
router.get('/products', protect, inv.getProducts);
router.post('/products', protect, inv.createProduct);
router.put('/products/:id', protect, inv.updateProduct);

// Stock (specific routes before none-needed; all org-scoped)
router.post('/stock/add', protect, inv.addStock);
router.post('/stock/remove', protect, inv.removeStock);
router.get('/stock/summary', protect, inv.getStockSummary);
router.get('/stock', protect, inv.getStock);

// Ledger (audit trail)
router.get('/ledger', protect, inv.getLedger);

module.exports = router;
