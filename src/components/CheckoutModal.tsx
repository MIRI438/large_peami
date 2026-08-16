"use client";

import { useState } from "react";

export type CheckoutInfo = {
  customerName: string;
  phone: string;
  deliveryType: "pickup" | "delivery";
  address: string;
  notes: string;
};

export default function CheckoutModal({
  total,
  itemCount,
  onClose,
  onSubmit,
  submitting,
}: {
  total: number;
  itemCount: number;
  onClose: () => void;
  onSubmit: (info: CheckoutInfo) => void;
  submitting: boolean;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = customerName.trim().length > 1 && phone.trim().length >= 9;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="bubble-in flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[#ece5dd] sm:rounded-2xl">
        <div className="flex items-center gap-2 bg-[#075e54] px-4 py-3 text-white">
          <span className="text-xl">📦</span>
          <div className="flex-1">
            <p className="font-semibold">סגירת הזמנה</p>
            <p className="text-xs text-white/80">
              {itemCount} פריטים · ₪{total.toFixed(2)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-2xl leading-none hover:bg-white/10">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-white p-3 text-sm shadow-sm">
            כמעט סיימנו! רק כמה פרטים ואשלח לך את ההזמנה ישר לוואטסאפ 💬
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">שם מלא</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="לדוגמה: דנה כהן"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">טלפון</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              inputMode="tel"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366]"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">איך תרצו לקבל?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDeliveryType("pickup")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  deliveryType === "pickup"
                    ? "border-[#25d366] bg-[#dcf8c6] text-[#075e54]"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                🏪 איסוף עצמי
              </button>
              <button
                onClick={() => setDeliveryType("delivery")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  deliveryType === "delivery"
                    ? "border-[#25d366] bg-[#dcf8c6] text-[#075e54]"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                🚚 משלוח
              </button>
            </div>
          </div>

          {deliveryType === "delivery" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">כתובת למשלוח</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="רחוב, מספר, עיר"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366]"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">הערות (אופציונלי)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="בקשות מיוחדות..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366]"
            />
          </label>
        </div>

        <div className="border-t border-black/5 bg-[#f0f0f0] p-3">
          <button
            disabled={!canSubmit || submitting}
            onClick={() =>
              onSubmit({ customerName, phone, deliveryType, address, notes })
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 font-semibold text-white shadow-md transition disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              "שולח..."
            ) : (
              <>
                שליחת הזמנה בוואטסאפ
                <span className="text-lg">📤</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
