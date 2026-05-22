"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export const ADMIN_TABLE_PAGE_SIZE = 10;

export function useAdminTablePagination<T>(
  items: T[],
  resetKeys: readonly unknown[] = [],
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, resetKeys);

  return useMemo(() => {
    const totalResults = items.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / ADMIN_TABLE_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * ADMIN_TABLE_PAGE_SIZE;
    const paginated = items.slice(pageStart, pageStart + ADMIN_TABLE_PAGE_SIZE);
    const showingFrom = totalResults === 0 ? 0 : pageStart + 1;
    const showingTo = Math.min(pageStart + ADMIN_TABLE_PAGE_SIZE, totalResults);

    return {
      paginated,
      pageStart,
      currentPage,
      totalPages,
      totalResults,
      showingFrom,
      showingTo,
      onPrevious: () => setPage((p) => Math.max(1, p - 1)),
      onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
    };
  }, [items, page]);
}

export function AdminTablePagination({
  showingFrom,
  showingTo,
  totalResults,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: {
  showingFrom: number;
  showingTo: number;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalResults === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)]/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[color:var(--text-muted)]">
        Showing <span className="font-semibold text-[color:var(--text)]">{showingFrom}</span> to{" "}
        <span className="font-semibold text-[color:var(--text)]">{showingTo}</span> of{" "}
        <span className="font-semibold text-[color:var(--text)]">{totalResults}</span> results
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={onPrevious}
          className="min-w-[5.5rem] border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] disabled:opacity-50"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className="min-w-[5.5rem] border-[color:var(--border)] bg-[color:var(--surface)] font-medium text-[color:var(--text)] disabled:opacity-50"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
