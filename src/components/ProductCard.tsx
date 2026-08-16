"use client";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  imageEmoji: string;
  inStock: boolean;
};

export default function ProductCard({
  product,
  quantity,
  onAdd,
  onRemove,
}: {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#dcf8c6] text-3xl">
        {product.imageEmoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[15px] text-gray-900">{product.name}</p>
        <p className="truncate text-xs text-gray-500">{product.description}</p>
        <p className="mt-0.5 text-sm font-bold text-[#075e54]">
          ₪{product.price.toFixed(2)}
          <span className="ms-1 text-xs font-normal text-gray-400">/{product.unit}</span>
        </p>
      </div>
      {!product.inStock ? (
        <span className="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-500">
          אזל המלאי
        </span>
      ) : quantity === 0 ? (
        <button
          onClick={onAdd}
          className="shrink-0 rounded-full bg-[#25d366] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition active:scale-95"
        >
          הוסף +
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#25d366] px-1 py-1 text-white shadow-sm">
          <button
            onClick={onAdd}
            className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold transition active:scale-90"
          >
            +
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-bold">{quantity}</span>
          <button
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold transition active:scale-90"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
}
