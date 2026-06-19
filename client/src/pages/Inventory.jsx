import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArchive,
  FiBarChart2,
  FiCheckCircle,
  FiClipboard,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiRepeat,
  FiRotateCcw,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { useConfirm } from "../components/ConfirmDialog";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { getSocket } from "../utils/socket";
import { errorMessage, notifyError, notifySuccess } from "../utils/toast";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
  { id: "warehouses", label: "Warehouses", icon: FiMapPin },
  { id: "products", label: "Products", icon: FiPackage },
  { id: "stock", label: "Stock", icon: FiArchive },
  { id: "orders", label: "Orders", icon: FiTruck },
  { id: "transfers", label: "Transfers", icon: FiRepeat },
  { id: "returns", label: "Returns", icon: FiRotateCcw },
  { id: "ledger", label: "Ledger", icon: FiClipboard },
];

const canManageInventory = (user) =>
  ["Owner", "Admin", "Manager"].includes(user?.role);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const statusClasses = {
  Fulfilled:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  "In Transit":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Received:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div>
    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
      <Icon aria-hidden="true" /> {title}
    </h2>
    {subtitle && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    )}
  </div>
);

const EmptyState = ({ icon: Icon = FiArchive, title, text }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <Icon className="mx-auto text-3xl text-gray-400" aria-hidden="true" />
    <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
  </div>
);

const LoadingRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

const Inventory = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const currentUser = getStoredUser();
  const isManager = canManageInventory(currentUser);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [summary, setSummary] = useState({ byLocation: [], lowStock: [] });
  const [inventoryStats, setInventoryStats] = useState({
    orders: {},
    returns: {},
    transfersInTransit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [stockFilters, setStockFilters] = useState({ locationId: "", productId: "" });

  const [locationForm, setLocationForm] = useState({
    name: "",
    code: "",
    address: "",
  });
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    barcode: "",
    category: "",
    unit: "pcs",
    reorderLevel: "0",
  });
  const [stockForm, setStockForm] = useState({
    productId: "",
    locationId: "",
    qty: "",
    batchNo: "",
    expiryDate: "",
  });
  const [orderForm, setOrderForm] = useState({
    productId: "",
    locationId: "",
    qty: "",
    source: "manual",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
  });
  const [transferForm, setTransferForm] = useState({
    fromLocationId: "",
    toLocationId: "",
    productId: "",
    batchNo: "",
    qty: "",
  });
  const [returnForm, setReturnForm] = useState({
    productId: "",
    locationId: "",
    orderId: "",
    batchNo: "",
    qty: "",
    reason: "",
    disposition: "Restocked",
  });

  const hydrateDefaultForms = useCallback((nextLocations, nextProducts) => {
    const firstLocationId = getEntityId(nextLocations[0]);
    const secondLocationId = getEntityId(nextLocations[1]) || firstLocationId;
    const firstProductId = getEntityId(nextProducts[0]);

    setStockForm((prev) => ({
      ...prev,
      locationId: prev.locationId || firstLocationId,
      productId: prev.productId || firstProductId,
    }));
    setOrderForm((prev) => ({
      ...prev,
      locationId: prev.locationId || firstLocationId,
      productId: prev.productId || firstProductId,
    }));
    setTransferForm((prev) => ({
      ...prev,
      fromLocationId: prev.fromLocationId || firstLocationId,
      toLocationId: prev.toLocationId || secondLocationId,
      productId: prev.productId || firstProductId,
    }));
    setReturnForm((prev) => ({
      ...prev,
      locationId: prev.locationId || firstLocationId,
      productId: prev.productId || firstProductId,
    }));
  }, []);

  const loadInventory = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      setError("");

      try {
        const [
          locationsRes,
          productsRes,
          summaryRes,
          stockRes,
          ledgerRes,
          ordersRes,
          transfersRes,
          returnsRes,
          statsRes,
        ] = await Promise.all([
          axios.get("/inventory/locations"),
          axios.get("/inventory/products", {
            params: productSearch ? { search: productSearch } : {},
          }),
          axios.get("/inventory/stock/summary"),
          axios.get("/inventory/stock", { params: stockFilters }),
          axios.get("/inventory/ledger", { params: { limit: 80 } }),
          axios.get("/inventory/orders", { params: { limit: 80 } }),
          axios.get("/inventory/transfers", { params: { limit: 80 } }),
          axios.get("/inventory/returns", { params: { limit: 80 } }),
          axios.get("/inventory/stats"),
        ]);

        setLocations(locationsRes.data || []);
        setProducts(productsRes.data || []);
        setSummary(summaryRes.data || { byLocation: [], lowStock: [] });
        setStock(stockRes.data || []);
        setLedger(ledgerRes.data || []);
        setOrders(ordersRes.data || []);
        setTransfers(transfersRes.data || []);
        setReturns(returnsRes.data || []);
        setInventoryStats(
          statsRes.data || { orders: {}, returns: {}, transfersInTransit: 0 }
        );
        hydrateDefaultForms(locationsRes.data || [], productsRes.data || []);
      } catch (err) {
        const message = errorMessage(err, "Failed to load inventory");
        setError(message);
        if (quiet) notifyError(message);
      } finally {
        setLoading(false);
      }
    },
    [hydrateDefaultForms, productSearch, stockFilters]
  );

  useEffect(() => {
    if (!currentUser?.token) {
      navigate("/");
      return;
    }

    loadInventory();
  }, [currentUser?.token, loadInventory, navigate]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const refreshOnInventoryEvent = () => loadInventory({ quiet: true });
    socket.on("order:new", refreshOnInventoryEvent);
    socket.on("activity:new", refreshOnInventoryEvent);

    return () => {
      socket.off("order:new", refreshOnInventoryEvent);
      socket.off("activity:new", refreshOnInventoryEvent);
    };
  }, [loadInventory]);

  const totalQty = useMemo(
    () => stock.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [stock]
  );

  const openOrders = orders.filter((order) => order.status === "Fulfilled").length;
  const inTransitTransfers = transfers.filter(
    (transfer) => transfer.status === "In Transit"
  ).length;

  const resetLocationForm = () =>
    setLocationForm({ name: "", code: "", address: "" });
  const resetProductForm = () =>
    setProductForm({
      sku: "",
      name: "",
      barcode: "",
      category: "",
      unit: "pcs",
      reorderLevel: "0",
    });
  const resetStockForm = () =>
    setStockForm((prev) => ({ ...prev, qty: "", batchNo: "", expiryDate: "" }));
  const resetOrderForm = () =>
    setOrderForm((prev) => ({
      ...prev,
      qty: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
    }));
  const resetTransferForm = () =>
    setTransferForm((prev) => ({ ...prev, batchNo: "", qty: "" }));
  const resetReturnForm = () =>
    setReturnForm((prev) => ({
      ...prev,
      orderId: "",
      batchNo: "",
      qty: "",
      reason: "",
      disposition: "Restocked",
    }));

  const createLocation = async (event) => {
    event.preventDefault();
    setBusy("location");
    try {
      await axios.post("/inventory/locations", {
        name: locationForm.name.trim(),
        code: locationForm.code.trim(),
        address: locationForm.address.trim(),
      });
      resetLocationForm();
      await loadInventory({ quiet: true });
      notifySuccess("Warehouse added.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to add warehouse"));
    } finally {
      setBusy("");
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setBusy("product");
    try {
      await axios.post("/inventory/products", {
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        barcode: productForm.barcode.trim(),
        category: productForm.category.trim(),
        unit: productForm.unit.trim() || "pcs",
        reorderLevel: Number(productForm.reorderLevel || 0),
      });
      resetProductForm();
      await loadInventory({ quiet: true });
      notifySuccess("Product added.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to add product"));
    } finally {
      setBusy("");
    }
  };

  const addStock = async (event) => {
    event.preventDefault();
    setBusy("stock");
    try {
      await axios.post("/inventory/stock/add", {
        productId: stockForm.productId,
        locationId: stockForm.locationId,
        qty: Number(stockForm.qty),
        batchNo: stockForm.batchNo.trim(),
        expiryDate: stockForm.expiryDate || undefined,
      });
      resetStockForm();
      await loadInventory({ quiet: true });
      notifySuccess("Stock added.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to add stock"));
    } finally {
      setBusy("");
    }
  };

  const removeBatch = async (batch) => {
    const confirmed = await confirm({
      title: "Remove stock batch?",
      message: `${batch.product?.name || batch.sku} / ${batch.batchNo} will be removed from inventory.`,
      confirmText: "Remove batch",
      danger: true,
    });
    if (!confirmed) return;

    setBusy(getEntityId(batch));
    try {
      await axios.post("/inventory/stock/remove", {
        batchId: getEntityId(batch),
        reason: "Removed from inventory console",
      });
      await loadInventory({ quiet: true });
      notifySuccess("Stock batch removed.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to remove stock"));
    } finally {
      setBusy("");
    }
  };

  const createOrder = async (event) => {
    event.preventDefault();
    setBusy("order");
    try {
      await axios.post("/inventory/orders", {
        productId: orderForm.productId,
        locationId: orderForm.locationId,
        qty: Number(orderForm.qty),
        source: orderForm.source.trim() || "manual",
        customer: {
          name: orderForm.customerName.trim(),
          phone: orderForm.customerPhone.trim(),
          address: orderForm.customerAddress.trim(),
        },
      });
      resetOrderForm();
      await loadInventory({ quiet: true });
      notifySuccess("Order fulfilled.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to create order"));
    } finally {
      setBusy("");
    }
  };

  const updateOrderStatus = async (order, status) => {
    const confirmed = await confirm({
      title: `${status} order?`,
      message:
        status === "Cancelled"
          ? "Cancelling restocks the fulfilled FEFO batches."
          : `${order.orderNo} will be marked delivered.`,
      confirmText: status,
      danger: status === "Cancelled",
    });
    if (!confirmed) return;

    setBusy(getEntityId(order));
    try {
      await axios.patch(`/inventory/orders/${getEntityId(order)}/status`, { status });
      await loadInventory({ quiet: true });
      notifySuccess(`Order ${status.toLowerCase()}.`);
    } catch (err) {
      notifyError(errorMessage(err, "Failed to update order"));
    } finally {
      setBusy("");
    }
  };

  const createTransfer = async (event) => {
    event.preventDefault();
    setBusy("transfer");
    try {
      await axios.post("/inventory/transfers", {
        fromLocationId: transferForm.fromLocationId,
        toLocationId: transferForm.toLocationId,
        productId: transferForm.productId,
        batchNo: transferForm.batchNo.trim(),
        qty: Number(transferForm.qty),
      });
      resetTransferForm();
      await loadInventory({ quiet: true });
      notifySuccess("Transfer shipped.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to create transfer"));
    } finally {
      setBusy("");
    }
  };

  const acceptTransfer = async (transfer) => {
    const confirmed = await confirm({
      title: "Accept transfer?",
      message: `${transfer.transferNo} will add stock to the destination warehouse.`,
      confirmText: "Accept",
    });
    if (!confirmed) return;

    setBusy(getEntityId(transfer));
    try {
      await axios.patch(`/inventory/transfers/${getEntityId(transfer)}/accept`);
      await loadInventory({ quiet: true });
      notifySuccess("Transfer received.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to accept transfer"));
    } finally {
      setBusy("");
    }
  };

  const createReturn = async (event) => {
    event.preventDefault();
    setBusy("return");
    try {
      await axios.post("/inventory/returns", {
        productId: returnForm.productId,
        locationId: returnForm.locationId,
        orderId: returnForm.orderId || undefined,
        batchNo: returnForm.batchNo.trim(),
        qty: Number(returnForm.qty),
        reason: returnForm.reason.trim(),
        disposition: returnForm.disposition,
      });
      resetReturnForm();
      await loadInventory({ quiet: true });
      notifySuccess("Return recorded.");
    } catch (err) {
      notifyError(errorMessage(err, "Failed to record return"));
    } finally {
      setBusy("");
    }
  };

  const renderSelectOptions = (items, getLabel) =>
    items.map((item) => (
      <option key={getEntityId(item)} value={getEntityId(item)}>
        {getLabel(item)}
      </option>
    ));

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total stock units</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {totalQty}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Warehouses</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {locations.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Open orders</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {openOrders}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">In transit</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {inTransitTransfers}
          </p>
        </div>
      </div>

      <section>
        <SectionTitle
          icon={FiBarChart2}
          title="Movement stats"
          subtitle="Order, return, and transfer signals from the inventory backend."
        />
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Fulfilled orders</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {inventoryStats.orders?.Fulfilled?.count || 0}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {inventoryStats.orders?.Fulfilled?.units || 0} units
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivered orders</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {inventoryStats.orders?.Delivered?.count || 0}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {inventoryStats.orders?.Delivered?.units || 0} units
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Restocked returns</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {inventoryStats.returns?.Restocked?.count || 0}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {inventoryStats.returns?.Restocked?.units || 0} units
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Damaged returns</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {inventoryStats.returns?.Damaged?.count || 0}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {inventoryStats.returns?.Damaged?.units || 0} units
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle
            icon={FiMapPin}
            title="Stock by warehouse"
            subtitle="Live quantity and batch spread across locations."
          />
          <div className="mt-3 space-y-3">
            {summary.byLocation.length === 0 ? (
              <EmptyState
                icon={FiArchive}
                title="No stock yet"
                text="Add products and stock batches to populate warehouse totals."
              />
            ) : (
              summary.byLocation.map((item) => (
                <div
                  key={item.locationId}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.location}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.batches} batch{item.batches === 1 ? "" : "es"}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {item.totalQty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <SectionTitle
            icon={FiPackage}
            title="Low-stock alerts"
            subtitle="Products at or below their reorder threshold."
          />
          <div className="mt-3 space-y-3">
            {summary.lowStock.length === 0 ? (
              <EmptyState
                icon={FiCheckCircle}
                title="No low-stock alerts"
                text="Reorder thresholds are currently healthy."
              />
            ) : (
              summary.lowStock.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        {item.name}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-200">
                        {item.sku} - reorder at {item.reorderLevel}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                      {item.totalQty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderWarehouses = () => (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form
        onSubmit={createLocation}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle icon={FiPlus} title="Add warehouse" />
        <div className="mt-4 space-y-4">
          <input
            value={locationForm.name}
            onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Warehouse name"
            required
            disabled={!isManager || busy === "location"}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={locationForm.code}
            onChange={(e) => setLocationForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Code"
            disabled={!isManager || busy === "location"}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            value={locationForm.address}
            onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Address"
            rows={3}
            disabled={!isManager || busy === "location"}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={!isManager || busy === "location"}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "location" ? "Adding..." : "Add warehouse"}
          </button>
          {!isManager && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only Owner, Admin, or Manager roles can add warehouses.
            </p>
          )}
        </div>
      </form>

      <section>
        <SectionTitle icon={FiMapPin} title="Warehouses" />
        <div className="mt-3 space-y-3">
          {locations.length === 0 ? (
            <EmptyState icon={FiMapPin} title="No warehouses" text="Create a warehouse to start stocking products." />
          ) : (
            locations.map((location) => (
              <div
                key={getEntityId(location)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {location.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {location.code || "No code"} - {location.address || "No address"}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      location.active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {location.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderProducts = () => (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form
        onSubmit={createProduct}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle icon={FiPlus} title="Add product" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <input
            value={productForm.sku}
            onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU"
            required
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={productForm.name}
            onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Product name"
            required
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={productForm.barcode}
            onChange={(e) => setProductForm((prev) => ({ ...prev, barcode: e.target.value }))}
            placeholder="Barcode"
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={productForm.category}
            onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Category"
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={productForm.unit}
            onChange={(e) => setProductForm((prev) => ({ ...prev, unit: e.target.value }))}
            placeholder="Unit"
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            min="0"
            value={productForm.reorderLevel}
            onChange={(e) => setProductForm((prev) => ({ ...prev, reorderLevel: e.target.value }))}
            placeholder="Reorder level"
            disabled={busy === "product"}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy === "product"}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "product" ? "Adding..." : "Add product"}
          </button>
        </div>
      </form>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={FiPackage} title="Catalog" />
          <label className="relative w-full sm:w-72">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search SKU, name, barcode"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {products.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState icon={FiPackage} title="No products" text="Add products to build your catalog." />
            </div>
          ) : (
            products.map((product) => (
              <div
                key={getEntityId(product)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.sku} - {product.category || "Uncategorized"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {product.unit || "pcs"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Barcode: {product.barcode || "-"} - Reorder: {product.reorderLevel || 0}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderStock = () => (
    <div className="space-y-6">
      <form
        onSubmit={addStock}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle icon={FiPlus} title="Add batch stock" subtitle="Batch and expiry are optional; FEFO uses expiry when available." />
        <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <select
            value={stockForm.productId}
            onChange={(e) => setStockForm((prev) => ({ ...prev, productId: e.target.value }))}
            required
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Product</option>
            {renderSelectOptions(products, (product) => `${product.sku} - ${product.name}`)}
          </select>
          <select
            value={stockForm.locationId}
            onChange={(e) => setStockForm((prev) => ({ ...prev, locationId: e.target.value }))}
            required
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Warehouse</option>
            {renderSelectOptions(locations, (location) => location.name)}
          </select>
          <input
            type="number"
            min="1"
            value={stockForm.qty}
            onChange={(e) => setStockForm((prev) => ({ ...prev, qty: e.target.value }))}
            placeholder="Quantity"
            required
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={stockForm.batchNo}
            onChange={(e) => setStockForm((prev) => ({ ...prev, batchNo: e.target.value }))}
            placeholder="Batch no"
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="date"
            value={stockForm.expiryDate}
            onChange={(e) => setStockForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
            className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy === "stock"}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "stock" ? "Adding..." : "Add stock"}
          </button>
        </div>
      </form>

      <section>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SectionTitle icon={FiArchive} title="Batch inventory" subtitle="Sorted by FEFO: earliest expiry first." />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={stockFilters.locationId}
              onChange={(e) =>
                setStockFilters((prev) => ({ ...prev, locationId: e.target.value }))
              }
              className="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All warehouses</option>
              {renderSelectOptions(locations, (location) => location.name)}
            </select>
            <select
              value={stockFilters.productId}
              onChange={(e) =>
                setStockFilters((prev) => ({ ...prev, productId: e.target.value }))
              }
              className="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All products</option>
              {renderSelectOptions(products, (product) => `${product.sku} - ${product.name}`)}
            </select>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {stock.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={FiArchive} title="No stock batches" text="Add stock or clear filters." />
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stock.map((batch) => (
                <div
                  key={getEntityId(batch)}
                  className="grid gap-3 p-4 text-sm md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {batch.product?.name || batch.sku}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {batch.product?.sku || batch.sku} - {batch.batchNo}
                    </p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">
                    {batch.location?.name || "-"}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {batch.qty} {batch.product?.unit || ""}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Exp {formatDate(batch.expiryDate)}
                  </p>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => removeBatch(batch)}
                      disabled={busy === getEntityId(batch)}
                      className="inline-flex w-fit items-center gap-2 rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                    >
                      <FiXCircle aria-hidden="true" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderOrders = () => (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form
        onSubmit={createOrder}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle icon={FiTruck} title="Create order" subtitle="Stock is deducted using FEFO automatically." />
        <div className="mt-4 space-y-4">
          <select
            value={orderForm.productId}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, productId: e.target.value }))}
            required
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Product</option>
            {renderSelectOptions(products, (product) => `${product.sku} - ${product.name}`)}
          </select>
          <select
            value={orderForm.locationId}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, locationId: e.target.value }))}
            required
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Warehouse</option>
            {renderSelectOptions(locations, (location) => location.name)}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              min="1"
              value={orderForm.qty}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, qty: e.target.value }))}
              placeholder="Quantity"
              required
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              value={orderForm.source}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, source: e.target.value }))}
              placeholder="Source"
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <input
            value={orderForm.customerName}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, customerName: e.target.value }))}
            placeholder="Customer name"
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={orderForm.customerPhone}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
            placeholder="Customer phone"
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            value={orderForm.customerAddress}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, customerAddress: e.target.value }))}
            placeholder="Customer address"
            rows={3}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy === "order"}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "order" ? "Fulfilling..." : "Fulfill order"}
          </button>
        </div>
      </form>

      <section>
        <SectionTitle icon={FiTruck} title="Orders" />
        <div className="mt-3 space-y-3">
          {orders.length === 0 ? (
            <EmptyState icon={FiTruck} title="No orders" text="Create an order to see FEFO batch breakdowns." />
          ) : (
            orders.map((order) => (
              <article
                key={getEntityId(order)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {order.orderNo}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusClasses[order.status] || statusClasses.Fulfilled
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {order.product?.name || order.sku} - {order.qty} from {order.location?.name || "-"}
                    </p>
                  </div>
                  {order.status === "Fulfilled" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order, "Delivered")}
                        disabled={busy === getEntityId(order)}
                        className="rounded border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950"
                      >
                        Delivered
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order, "Cancelled")}
                        disabled={busy === getEntityId(order)}
                        className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {order.batchBreakdown?.length > 0 && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      FEFO breakdown
                    </p>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                      {order.batchBreakdown.map((line, index) => (
                        <p key={`${line.batchNo}-${index}`}>
                          {line.batchNo}: {line.qty} units, exp {formatDate(line.expiryDate)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderTransfers = () => (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form
        onSubmit={createTransfer}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle icon={FiRepeat} title="Ship transfer" subtitle="Transfers deduct from source first and wait for receipt." />
        <div className="mt-4 space-y-4">
          <select
            value={transferForm.fromLocationId}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, fromLocationId: e.target.value }))}
            required
            disabled={!isManager}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">From warehouse</option>
            {renderSelectOptions(locations, (location) => location.name)}
          </select>
          <select
            value={transferForm.toLocationId}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, toLocationId: e.target.value }))}
            required
            disabled={!isManager}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">To warehouse</option>
            {renderSelectOptions(locations, (location) => location.name)}
          </select>
          <select
            value={transferForm.productId}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, productId: e.target.value }))}
            required
            disabled={!isManager}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Product</option>
            {renderSelectOptions(products, (product) => `${product.sku} - ${product.name}`)}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={transferForm.batchNo}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, batchNo: e.target.value }))}
              placeholder="Batch no optional"
              disabled={!isManager}
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="number"
              min="1"
              value={transferForm.qty}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, qty: e.target.value }))}
              placeholder="Quantity"
              required
              disabled={!isManager}
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={!isManager || busy === "transfer"}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "transfer" ? "Shipping..." : "Ship transfer"}
          </button>
        </div>
      </form>

      <section>
        <SectionTitle icon={FiRepeat} title="Transfers" />
        <div className="mt-3 space-y-3">
          {transfers.length === 0 ? (
            <EmptyState icon={FiRepeat} title="No transfers" text="Move stock between warehouses to track in-transit inventory." />
          ) : (
            transfers.map((transfer) => (
              <article
                key={getEntityId(transfer)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {transfer.transferNo}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusClasses[transfer.status] || statusClasses["In Transit"]
                        }`}
                      >
                        {transfer.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {transfer.product?.name || transfer.sku} - {transfer.qty} from{" "}
                      {transfer.fromLocation?.name || "-"} to {transfer.toLocation?.name || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Batch {transfer.batchNo || "-"} - exp {formatDate(transfer.expiryDate)}
                    </p>
                  </div>
                  {isManager && transfer.status === "In Transit" && (
                    <button
                      type="button"
                      onClick={() => acceptTransfer(transfer)}
                      disabled={busy === getEntityId(transfer)}
                      className="inline-flex w-fit items-center gap-2 rounded border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950"
                    >
                      <FiCheckCircle aria-hidden="true" /> Accept
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderReturns = () => (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form
        onSubmit={createReturn}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <SectionTitle
          icon={FiRotateCcw}
          title="Record return"
          subtitle="Restocked returns add sellable stock back; damaged returns only record the event."
        />
        <div className="mt-4 space-y-4">
          <select
            value={returnForm.orderId}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, orderId: e.target.value }))}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">No linked order</option>
            {orders.map((order) => (
              <option key={getEntityId(order)} value={getEntityId(order)}>
                {order.orderNo} - {order.product?.name || order.sku}
              </option>
            ))}
          </select>
          <select
            value={returnForm.productId}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, productId: e.target.value }))}
            required
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Product</option>
            {renderSelectOptions(products, (product) => `${product.sku} - ${product.name}`)}
          </select>
          <select
            value={returnForm.locationId}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, locationId: e.target.value }))}
            required
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Warehouse</option>
            {renderSelectOptions(locations, (location) => location.name)}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={returnForm.batchNo}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, batchNo: e.target.value }))}
              placeholder="Batch no optional"
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="number"
              min="1"
              value={returnForm.qty}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, qty: e.target.value }))}
              placeholder="Quantity"
              required
              className="rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={returnForm.disposition}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, disposition: e.target.value }))}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="Restocked">Restocked</option>
            <option value="Damaged">Damaged</option>
          </select>
          <textarea
            value={returnForm.reason}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason"
            rows={3}
            className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy === "return"}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy === "return" ? "Recording..." : "Record return"}
          </button>
        </div>
      </form>

      <section>
        <SectionTitle icon={FiRotateCcw} title="Returns" />
        <div className="mt-3 space-y-3">
          {returns.length === 0 ? (
            <EmptyState
              icon={FiRotateCcw}
              title="No returns"
              text="Customer returns will appear here after they are recorded."
            />
          ) : (
            returns.map((item) => (
              <article
                key={getEntityId(item)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.returnNo}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          item.disposition === "Damaged"
                            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        }`}
                      >
                        {item.disposition}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {item.product?.name || item.sku} - {item.qty} at {item.location?.name || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Batch {item.batchNo || "-"} - Order {item.orderNo || "-"} - {formatDateTime(item.createdAt)}
                    </p>
                    {item.reason && (
                      <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By {item.by?.name || "-"}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderLedger = () => (
    <section>
      <SectionTitle icon={FiClipboard} title="Stock ledger" subtitle="Immutable movement history across stock, orders, and transfers." />
      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {ledger.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={FiClipboard} title="No ledger entries" text="Stock movement history will appear here." />
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {ledger.map((entry) => (
              <div
                key={getEntityId(entry)}
                className="grid gap-3 p-4 text-sm md:grid-cols-[1fr_1fr_0.6fr_0.8fr_1fr] md:items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {entry.reason}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-200">
                  {entry.product?.name || entry.sku || "-"}
                </p>
                <p
                  className={`font-semibold ${
                    Number(entry.delta) >= 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {Number(entry.delta) >= 0 ? "+" : ""}
                  {entry.delta}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {entry.location?.name || "-"} / {entry.batchNo || "-"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {entry.byName || "-"} {entry.note ? `- ${entry.note}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderActiveTab = () => {
    if (loading) return <LoadingRows />;
    if (activeTab === "dashboard") return renderDashboard();
    if (activeTab === "warehouses") return renderWarehouses();
    if (activeTab === "products") return renderProducts();
    if (activeTab === "stock") return renderStock();
    if (activeTab === "orders") return renderOrders();
    if (activeTab === "transfers") return renderTransfers();
    if (activeTab === "returns") return renderReturns();
    return renderLedger();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-indigo-600 dark:text-indigo-300">
              Inventory operations
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <FiArchive aria-hidden="true" /> Inventory
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              Manage warehouses, catalog, FEFO stock, orders, transfers, and
              the audit ledger from one operational console.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadInventory({ quiet: true })}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <Icon aria-hidden="true" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">{renderActiveTab()}</div>
      </main>
    </div>
  );
};

export default Inventory;
