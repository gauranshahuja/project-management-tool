const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const ord = require('../controllers/orderController');
const ret = require('../controllers/returnController');
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

// Orders (FEFO fulfillment)
router.get('/orders', protect, ord.getOrders);
router.post('/orders', protect, ord.createOrder);
router.patch('/orders/:id/status', protect, ord.updateOrderStatus);

// Stock transfers (warehouse -> warehouse)
router.get('/transfers', protect, ord.getTransfers);
router.post('/transfers', protect, ord.createTransfer);
router.patch('/transfers/:id/accept', protect, ord.acceptTransfer);

// Returns
router.get('/returns', protect, ret.getReturns);
router.post('/returns', protect, ret.createReturn);

// Inventory dashboard stats
router.get('/stats', protect, ret.getInventoryStats);

module.exports = router;
