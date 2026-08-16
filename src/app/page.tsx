"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import CheckoutModal, { CheckoutInfo } from "@/components/CheckoutModal";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  imageEmoji: string;
  inStock: boolean;
};

type Category = {
  id: string;
  name: string;
  emoji: string;
  products: Product[];
};

type Settings = {
  storeName: string;
  whatsappPhone: string;
  welcomeText: string;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([productsData, settingsData]) => {
      setCategories(productsData.categories ?? []);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  const allProducts = useMemo(
    () => categories.flatMap((c) => c.products),
    [categories]
  );

  const cartEntries = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = allProducts.find((p) => p.id === productId);
        return product ? { product, qty } : null;
      })
      .filter((e): e is { product: Product; qty: number } => e !== null);
  }, [cart, allProducts]);

  const total = cartEntries.reduce((sum, e) => sum + e.product.price * e.qty, 0);
  const itemCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);

  function addToCart(productId: string) {
    setCart((c) => ({ ...c, [productId]: (c[productId] ?? 0) + 1 }));
  }

  function removeFromCart(productId: string) {
    setCart((c) => {
      const next = { ...c };
      const current = next[productId] ?? 0;
      if (current <= 1) {
        delete next[productId];
      } else {
        next[productId] = current - 1;
      }
      return next;
    });
  }

  async function handleSubmitOrder(info: CheckoutInfo) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...info,
          items: cartEntries.map((e) => ({ productId: e.product.id, quantity: e.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "משהו השתבש, נסו שוב");
        setSubmitting(false);
        return;
      }
      window.open(data.waLink, "_blank");
      setSuccess({ orderNumber: data.orderNumber });
      setCart({});
      setCheckoutOpen(false);
    } catch {
      setError("בעיית תקשורת, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#075e54] text-white">
        <div className="text-4xl">💬</div>
        <div className="flex gap-1">
          <span className="typing-dot text-2xl" style={{ animationDelay: "0s" }}>•</span>
          <span className="typing-dot text-2xl" style={{ animationDelay: "0.2s" }}>•</span>
          <span className="typing-dot text-2xl" style={{ animationDelay: "0.4s" }}>•</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-white shadow-xl">
      {/* Header */}
      <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white shadow-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366] text-xl">
          🛍️
        </div>
        <div className="flex-1">
          <p className="font-semibold">{settings?.storeName ?? "החנות שלי"}</p>
          <p className="text-xs text-white/70">מקוון · מגיב מיד</p>
        </div>
        <a
          href="/admin"
          className="rounded-full p-2 text-lg opacity-70 transition hover:bg-white/10 hover:opacity-100"
          title="ניהול"
        >
          ⚙️
        </a>
      </header>

      {/* Chat body */}
      <main className="chat-bg flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div className="bubble-in mx-auto max-w-[90%] rounded-xl rounded-tl-sm bg-white p-3 text-sm shadow-sm">
          {settings?.welcomeText}
        </div>

        {categories.map((cat, idx) => (
          <div key={cat.id} className="space-y-2" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="bubble-in max-w-[80%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-sm font-semibold text-[#075e54] shadow-sm">
              {cat.emoji} {cat.name}
            </div>
            <div className="bubble-in space-y-2 rounded-xl rounded-tl-sm bg-[#f7f4ef]/60 p-2">
              {cat.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  quantity={cart[p.id] ?? 0}
                  onAdd={() => addToCart(p.id)}
                  onRemove={() => removeFromCart(p.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {success && (
          <div className="bubble-in mx-auto max-w-[90%] rounded-xl rounded-tl-sm bg-[#dcf8c6] p-3 text-sm shadow-sm">
            ✅ ההזמנה מספר <strong>#{success.orderNumber}</strong> נשמרה ונשלחה לוואטסאפ! אם החלון לא
            נפתח אוטומטית, בדקו את חוסם הפופ-אפים בדפדפן.
          </div>
        )}

        {error && (
          <div className="bubble-in mx-auto max-w-[90%] rounded-xl bg-red-100 p-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}
      </main>

      {/* Bottom bar */}
      {itemCount > 0 && (
        <div className="flex items-center gap-3 border-t border-black/5 bg-[#f0f0f0] px-4 py-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">{itemCount} פריטים בעגלה</p>
            <p className="text-lg font-bold text-[#075e54]">₪{total.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-semibold text-white shadow-lg transition active:scale-95"
          >
            להזמנה
            <span className="text-lg">📤</span>
          </button>
        </div>
      )}

      {checkoutOpen && (
        <CheckoutModal
          total={total}
          itemCount={itemCount}
          submitting={submitting}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </div>
  );
}
