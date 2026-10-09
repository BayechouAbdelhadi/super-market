import { describe, it, expect } from "vitest";
import { calculatePaginationMeta, paginateArray } from "@/lib/loyalty/pagination";

describe("Pagination logic (calculatePaginationMeta & paginateArray)", () => {
  const dummyItems = Array.from({ length: 27 }, (_, i) => ({ id: `item-${i + 1}`, value: i + 1 }));

  it("calculates initial pagination metadata correctly", () => {
    const meta = calculatePaginationMeta(27, 1, 10);

    expect(meta.page).toBe(1);
    expect(meta.pageSize).toBe(10);
    expect(meta.totalItems).toBe(27);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(false);
    expect(meta.startIndex).toBe(0);
    expect(meta.endIndex).toBe(10);
  });

  it("slices array for page 1", () => {
    const result = paginateArray(dummyItems, 1, 10);

    expect(result.items.length).toBe(10);
    expect(result.items[0].id).toBe("item-1");
    expect(result.items[9].id).toBe("item-10");
  });

  it("slices array for page 2", () => {
    const result = paginateArray(dummyItems, 2, 10);

    expect(result.meta.page).toBe(2);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPrevPage).toBe(true);
    expect(result.items.length).toBe(10);
    expect(result.items[0].id).toBe("item-11");
    expect(result.items[9].id).toBe("item-20");
  });

  it("slices array for remainder on last page", () => {
    const result = paginateArray(dummyItems, 3, 10);

    expect(result.meta.page).toBe(3);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPrevPage).toBe(true);
    expect(result.items.length).toBe(7);
    expect(result.items[0].id).toBe("item-21");
    expect(result.items[6].id).toBe("item-27");
  });

  it("clamps page when navigating out of upper bounds", () => {
    const result = paginateArray(dummyItems, 99, 10);

    expect(result.meta.page).toBe(3);
    expect(result.items.length).toBe(7);
  });

  it("clamps page when navigating below 1", () => {
    const result = paginateArray(dummyItems, -5, 10);

    expect(result.meta.page).toBe(1);
    expect(result.items.length).toBe(10);
    expect(result.items[0].id).toBe("item-1");
  });

  it("handles empty items array gracefully", () => {
    const result = paginateArray([], 1, 10);

    expect(result.meta.page).toBe(1);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPrevPage).toBe(false);
    expect(result.items).toEqual([]);
  });

  it("recalculates totalPages when page size changes", () => {
    const meta5 = calculatePaginationMeta(27, 1, 5);
    expect(meta5.totalPages).toBe(6);

    const meta20 = calculatePaginationMeta(27, 1, 20);
    expect(meta20.totalPages).toBe(2);

    const meta50 = calculatePaginationMeta(27, 1, 50);
    expect(meta50.totalPages).toBe(1);
  });
});
