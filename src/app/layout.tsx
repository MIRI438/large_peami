import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "יבוא חד פעמי | הזמנה דרך וואטסאפ",
  description: "קטלוג מוצרים חד פעמיים - הזמינו בקלות ישירות לוואטסאפ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
