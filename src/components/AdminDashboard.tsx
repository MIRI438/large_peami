"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Order = {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  deliveryType: string;
  address: string;
  notes: string;
  createdAt: string;
  customer: { name: string; phone: string };
  items: { quantity: number; price: number; product: { name: string; unit: string } }[];
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
  orders: { total: number }[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  stockQty: number;
  inStock: boolean;
  category: { name: string };
};

type Settings = {
  storeName: string;
  whatsappPhone: string;
  welcomeText: string;
  adminPassword: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 חדשה",
  confirmed: "✅ אושרה",
  packed: "📦 ארוזה",
  delivered: "🚚 נמסרה",
  cancelled: "❌ בוטלה",
};

const TABS = [
  { key: "orders", label: "הזמנות" },
  { key: "customers", label: "לקוחות" },
  { key: "products", label: "מלאי" },
  { key: "settings", label: "הגדרות" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [o, c, p, s] = await Promise.all([
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setOrders(o.orders ?? []);
    setCustomers(c.customers ?? []);
    setProducts(p.products ?? []);
    setSettings(s.settings ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    void loadAll();
  }, []);

  async function updateOrderStatus(orderId: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
  }

  async function updateProduct(productId: string, data: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...data } : p)));
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...data }),
    });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaveMsg("ההגדרות נשמרו ✅");
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <p className="font-semibold">ניהול החנות</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full px-3 py-1.5 text-xs opacity-80 hover:bg-white/10">
            לחנות
          </Link>
          <button
            onClick={logout}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
          >
            יציאה
          </button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b bg-white px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-[#25d366] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-3xl p-4">
        {loading ? (
          <p className="py-10 text-center text-gray-400">טוען...</p>
        ) : (
          <>
            {tab === "orders" && (
              <div className="space-y-3">
                {orders.length === 0 && (
                  <p className="py-10 text-center text-gray-400">עדיין אין הזמנות</p>
                )}
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold text-gray-800">
                        הזמנה #{o.orderNumber} · ₪{o.total.toFixed(2)}
                      </p>
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-600">
                      👤 {o.customer.name} · {o.customer.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      {o.deliveryType === "delivery" ? `🚚 משלוח: ${o.address}` : "🏪 איסוף עצמי"}
                    </p>
                    <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs text-gray-500">
                      {o.items.map((it, i) => (
                        <li key={i}>
                          • {it.product.name} × {it.quantity} {it.product.unit}
                        </li>
                      ))}
                    </ul>
                    {o.notes && <p className="mt-1 text-xs italic text-gray-400">הערה: {o.notes}</p>}
                    <p className="mt-2 text-[10px] text-gray-300">
                      {new Date(o.createdAt).toLocaleString("he-IL")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {tab === "customers" && (
              <div className="space-y-2">
                {customers.length === 0 && (
                  <p className="py-10 text-center text-gray-400">עדיין אין לקוחות</p>
                )}
                {customers.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                    {c.address && <p className="text-xs text-gray-400">{c.address}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {c.orders.length} הזמנות · סה״כ ₪
                      {c.orders.reduce((s, o) => s + o.total, 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {tab === "products" && (
              <div className="space-y-2">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category.name}</p>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={p.price}
                      onChange={(e) => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={p.stockQty}
                      onChange={(e) =>
                        updateProduct(p.id, { stockQty: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      title="כמות במלאי"
                    />
                    <button
                      onClick={() => updateProduct(p.id, { inStock: !p.inStock })}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        p.inStock ? "bg-[#dcf8c6] text-[#075e54]" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {p.inStock ? "זמין" : "אזל"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === "settings" && settings && (
              <form onSubmit={saveSettings} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">שם החנות</span>
                  <input
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    מספר וואטסאפ עסקי (כולל קידומת מדינה, ללא + או 0 מוביל, למשל 972501234567)
                  </span>
                  <input
                    value={settings.whatsappPhone}
                    onChange={(e) => setSettings({ ...settings, whatsappPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">הודעת פתיחה</span>
                  <textarea
                    value={settings.welcomeText}
                    onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">סיסמת ניהול</span>
                  <input
                    value={settings.adminPassword}
                    onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#25d366] py-2.5 font-semibold text-white shadow-md"
                >
                  שמירת הגדרות
                </button>
                {saveMsg && <p className="text-center text-sm text-green-600">{saveMsg}</p>}
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
