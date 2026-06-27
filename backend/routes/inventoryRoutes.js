const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const ord = require('../controllers/orderController');
const ret = require('../controllers/returnController');
const po = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/locations', protect, inv.getLocations);
router.post('/locations', protect, inv.createLocation);
router.put('/locations/:id', protect, inv.updateLocation);

router.get('/products', protect, inv.getProducts);
router.post('/products', protect, inv.createProduct);
router.put('/products/:id', protect, inv.updateProduct);

router.post('/stock/add', protect, inv.addStock);
router.post('/stock/remove', protect, inv.removeStock);
router.get('/stock/summary', protect, inv.getStockSummary);
router.get('/stock', protect, inv.getStock);

router.get('/ledger', protect, inv.getLedger);

router.get('/orders', protect, ord.getOrders);
router.post('/orders', protect, ord.createOrder);
router.patch('/orders/:id/status', protect, ord.updateOrderStatus);

router.get('/transfers', protect, ord.getTransfers);
router.post('/transfers', protect, ord.createTransfer);
router.patch('/transfers/:id/accept', protect, ord.acceptTransfer);

router.get('/returns', protect, ret.getReturns);
router.post('/returns', protect, ret.createReturn);

router.get('/stats', protect, ret.getInventoryStats);

router.get('/purchase-orders', protect, po.getPOs);
router.post('/purchase-orders/auto-reorder', protect, po.autoReorder);
router.post('/purchase-orders', protect, po.createPO);
router.patch('/purchase-orders/:id/receive', protect, po.receivePO);
router.patch('/purchase-orders/:id/cancel', protect, po.cancelPO);

module.exports = router;
