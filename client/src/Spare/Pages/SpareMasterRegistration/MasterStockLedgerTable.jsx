import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

/**
 * Stock-Ledger table for a spare-part master with FIFO cursor-based pagination.
 *
 * Automatically fetches the next page as the user scrolls, keeping header fixed
 * and appending rows smoothly.
 *
 * Columns:
 *   Processing date | Stock out qty. | Stock in qty. | Adjusted qty. |
 *   Stock qty. | Section | Machine | Order qty. | Order No.
 *
 * Only the "new" quantity is shown: the new/used split the ledger schema still
 * carries is no longer surfaced here, so each movement gets one quantity column
 * instead of a New/Used pair. Section and Machine are filled on STOCK_OUT rows
 * from the issuance sheet that consumed the stock.
 */

const PAGE_SIZE = 20;
const PREFETCH_ROWS = 3;
const FALLBACK_ROW_HEIGHT = 32;

const fmt = (val) => {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "number") return val.toFixed(1);
  return val;
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

/** Header cell styled with teal background matching the reference image. */
const Th = ({ children, rowSpan = 1, colSpan = 1, style = {} }) => (
  <th
    rowSpan={rowSpan}
    colSpan={colSpan}
    style={{
      background: "#009bb3",
      color: "#ffffff",
      textAlign: "center",
      border: "1px solid #000000",
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: 600,
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      ...style,
    }}
  >
    {children}
  </th>
);

/** Data cell styled with black borders matching the reference image. */
const Td = ({ children, bg = "#d7f4f8", align = "center" }) => (
  <td
    style={{
      background: bg,
      border: "1px solid #000000",
      textAlign: align,
      padding: "4px 8px",
      fontSize: "12px",
      whiteSpace: "nowrap",
    }}
  >
    {fmt(children)}
  </td>
);

const MasterStockLedgerTable = ({ masterId }) => {
  const cursorRef = useRef(null);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const listVersionRef = useRef(0);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const [data, setData] = useState({
    isLoading: true,
    isInitialLoading: true,
    hasMore: true,
    tableData: [],
    isError: false,
  });

  const fetchData = useCallback(async () => {
    if (!masterId || isFetchingRef.current || !hasMoreRef.current) return;

    isFetchingRef.current = true;
    setData((prev) => ({ ...prev, isLoading: true }));

    const listVersion = listVersionRef.current;

    const response = await axiosGetOrDelete({
      url: "/v1/spare/master/stockLedger",
      axiosProps: {
        params: {
          masterId,
          cursor: cursorRef.current,
          limit: PAGE_SIZE,
        },
      },
    });

    if (listVersion !== listVersionRef.current) return;

    const { isError, tableData, hasMore, nextCursor } = response;

    if (isError) {
      hasMoreRef.current = false;
      isFetchingRef.current = false;
      return setData((prev) => ({
        ...prev,
        isLoading: false,
        isInitialLoading: false,
        hasMore: false,
        isError: true,
      }));
    }

    const rows = tableData ?? [];
    const canContinue = Boolean(hasMore) && Boolean(nextCursor) && rows.length > 0;

    setData((prev) => {
      if (!cursorRef.current) {
        return {
          tableData: rows,
          hasMore: canContinue,
          isLoading: false,
          isInitialLoading: false,
          isError: false,
        };
      }

      const existingIds = new Set(prev.tableData.map((r) => r._id));
      return {
        tableData: [
          ...prev.tableData,
          ...rows.filter((r) => !existingIds.has(r._id)),
        ],
        hasMore: canContinue,
        isLoading: false,
        isInitialLoading: false,
        isError: false,
      };
    });

    if (canContinue) cursorRef.current = nextCursor;
    hasMoreRef.current = canContinue;
    isFetchingRef.current = false;
  }, [masterId]);

  // Restart list when masterId changes
  useEffect(() => {
    listVersionRef.current += 1;
    cursorRef.current = null;
    isFetchingRef.current = false;
    hasMoreRef.current = true;
    setData({
      isLoading: true,
      isInitialLoading: true,
      hasMore: true,
      tableData: [],
      isError: false,
    });
    fetchData();
  }, [masterId, fetchData]);

  // IntersectionObserver for continuous scroll loading
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const rowHeight =
      containerRef.current?.querySelector("tbody tr")?.getBoundingClientRect()
        .height || FALLBACK_ROW_HEIGHT;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && data?.hasMore && !isFetchingRef.current) {
          fetchData();
        }
      },
      {
        root: containerRef.current,
        rootMargin: `0px 0px ${Math.round(rowHeight * PREFETCH_ROWS)}px 0px`,
      },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [data?.hasMore, fetchData]);

  return (
    <div className="w-100 my-2">
      {/* ── Error state ──────────────────────────────────────────────── */}
      {data.isError && (
        <p style={{ fontSize: "12px", padding: "8px", color: "red" }}>
          Failed to load stock ledger.
        </p>
      )}

      {/* ── Initial Loading state ────────────────────────────────────── */}
      {data.isInitialLoading && (
        <p style={{ fontSize: "12px", padding: "8px" }}>Loading stock ledger…</p>
      )}

      {/* ── Scrollable Table Container ───────────────────────────────── */}
      {!data.isInitialLoading && !data.isError && (
        <div
          ref={containerRef}
          style={{
            maxHeight: "360px",
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid #000000",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "auto",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              {/* One row: the new quantity only, plus where the stock went. */}
              <tr>
                <Th>Processing date</Th>
                <Th>Stock out qty.</Th>
                <Th>Stock in qty.</Th>
                <Th>Adjusted qty.</Th>
                <Th>Stock qty.</Th>
                <Th>Section</Th>
                <Th>Machine</Th>
                <Th>Order qty.</Th>
                <Th>Order No.</Th>
              </tr>
            </thead>

            <tbody>
              {data.tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      padding: "14px",
                      color: "#555",
                      background: "#eefbfc",
                      border: "1px solid #000000",
                    }}
                  >
                    No ledger entries yet.
                  </td>
                </tr>
              ) : (
                data.tableData.map((row, i) => {
                  const bg = i % 2 === 0 ? "#d7f4f8" : "#ffffff";
                  return (
                    <tr key={row._id}>
                      <Td bg={bg}>{fmtDate(row.processingDate)}</Td>
                      <Td bg={bg} align="right">{row.stockOutQtyNew}</Td>
                      <Td bg={bg} align="right">{row.stockInQtyNew}</Td>
                      <Td bg={bg} align="right">{row.adjustedQtyNew}</Td>
                      <Td bg={bg} align="right">{row.stockQtyNew}</Td>
                      <Td bg={bg}>{row.section?.section_name}</Td>
                      <Td bg={bg}>
                        {[row.machine?.machine_code, row.machine?.machine_name]
                          .filter(Boolean)
                          .join(" - ")}
                      </Td>
                      <Td bg={bg} align="right">{row.orderQty}</Td>
                      <Td bg={bg}>
                        {row.entryType === "STOCK_OUT" ? row.orderNo : ""}
                      </Td>
                    </tr>
                  );
                })
              )}

              {/* Sentinel row for cursor-based infinite scrolling */}
              {data.tableData.length > 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 0, border: "none" }}>
                    <div
                      ref={sentinelRef}
                      style={{
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {data.isLoading && data.hasMore && (
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Loading more entries…
                        </small>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MasterStockLedgerTable;
