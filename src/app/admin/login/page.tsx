"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "סיסמה שגויה");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#075e54] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-2xl">
            🔒
          </div>
          <h1 className="text-lg font-bold text-gray-800">כניסת ניהול</h1>
          <p className="text-xs text-gray-500">הזינו את סיסמת הניהול כדי להיכנס</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          autoFocus
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366]"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#25d366] py-2.5 font-semibold text-white shadow-md transition disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "כניסה"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          סיסמת ברירת מחדל: admin123 (ניתן לשנות בהגדרות לאחר הכניסה)
        </p>
      </form>
    </div>
  );
}
