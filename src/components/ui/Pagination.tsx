"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  page,
  totalPages,
  hasPrev,
  hasNext,
  total,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - delta && i <= page + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Total: <span className="font-medium">{total}</span> items
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Prev
        </button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};
