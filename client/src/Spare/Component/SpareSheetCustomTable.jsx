import _ from "lodash";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import Loading from "../../components/Loading/Loading";

import { axiosGetOrDelete } from "../Utils/axiosUtils";

/**
 * How many rows before the foot of the list the next page is requested.
 * Requesting only once the last row had scrolled into view left the table
 * looking finished for a moment, with nothing to tell the reader more was
 * coming; the page now lands while there are still rows left to scroll past.
 */
const PREFETCH_ROWS = 5;
// Used until a row has rendered to measure — the sentinel row's own height.
const FALLBACK_ROW_HEIGHT = 34;

export const UptoMachineHeaders = ({
  otherData,
  needToIncludeMaker = true,
}) => (
  <>
    <td className="td-padding">{otherData?.requestSheetNo}</td>
    <td className="td-padding">{otherData?.cell?.cell_name}</td>
    {needToIncludeMaker && (
      <td className="td-padding">{otherData?.changeParts?.maker}</td>
    )}
    <td className="td-padding">{otherData?.line?.line_name}</td>
    <td className="td-padding">{otherData?.machine?.machine_code}</td>
    {/* <td className="td-padding">{otherData?.machine?.machine_name}</td> */}
  </>
);

export const PartDetailsHeaders = ({ otherData }) => (
  <>
    <td className="td-padding ">{otherData?.changeParts?.partName}</td>
    <td className="td-padding ">{otherData?.changeParts?.partModel}</td>
  </>
);

const SpareSheetCustomTable = ({
  tableHeaders = [],
  OtherComp = null,
  url = `/v1/spare/spareRequestSheet/logs`,
  otherParentProps = {},
  apiReferencePropsBasedOnFilters = {
    params: {},
    referenceArrayForUseEffect: [],
  },
  showOnlySelected = false,
  selectedRows = new Map(),
  isNormalRowActions = false,
  /**
   * Identifies a row. Defaults to the request-sheet part id, which is what every
   * sheet-based caller keys on; a caller listing something else (the master
   * catalogue, say) supplies its own.
   */
  rowKey = (row) => row?.changeParts?._id,
  /**
   * Receives each raw page as it arrives, so a caller can read values that sit
   * alongside the rows — a total count, for instance — without a second request.
   */
  onPageLoaded,
}) => {
  const cursorRef = useRef(null);

  /**
   * The paging guards are refs, not state.
   *
   * As state they had to be dependencies of fetchData, which rebuilt the
   * callback — and with it the IntersectionObserver — twice per page as
   * isLoading went true and false. A fresh observer fires immediately on an
   * element already in view, so every page re-armed the request for the next
   * one whether or not the reader had scrolled.
   */
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  /**
   * Which list the table is currently loading. A filter change (or the second
   * mount that StrictMode performs in development) restarts the list while a
   * request for the previous one can still be in flight; when that older
   * response lands it must be dropped, not appended. Appending it put the same
   * rows in twice, and duplicate keys left React unable to reconcile the rows —
   * ticks landed on the wrong rows and the L2 sheet showed a half-updated list.
   */
  const listVersionRef = useRef(0);

  // Read through a ref so a caller passing an inline rowKey does not rebuild
  // fetchData — and with it the observer — on every render.
  const rowKeyRef = useRef(rowKey);
  rowKeyRef.current = rowKey;

  const [data, setData] = useState({
    isLoading: false,
    hasMore: true,
    tableData: [],
  });

  const visibleRows = useMemo(() => {
    if (showOnlySelected) {
      const filteredData = data.tableData.filter((row) =>
        selectedRows.has(row?.changeParts._id),
      );

      return _.orderBy(
        filteredData,
        [(item) => item?.changeParts?.maker, (item) => item?.cell?.cell_name],
        ["asc", "asc"],
      );
    }
    return data.tableData;
  }, [showOnlySelected, selectedRows, data.tableData]);

  const hasRows = data.tableData.length > 0;

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;

    isFetchingRef.current = true;
    setData((prev) => ({ ...prev, isLoading: true }));

    const listVersion = listVersionRef.current;

    const response = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: {
          cursor: cursorRef.current,
          ...apiReferencePropsBasedOnFilters?.params,
        },
      },
    });

    // The list was restarted while this request was out: its guards and cursor
    // now belong to the newer request, so touch nothing.
    if (listVersion !== listVersionRef.current) return;

    const { isError, tableData, hasMore, nextCursor } = response;

    if (isError) {
      hasMoreRef.current = false;
      isFetchingRef.current = false;
      return setData((prev) => ({ ...prev, isLoading: false, hasMore: false }));
    }

    if (onPageLoaded) onPageLoaded(response);

    const rows = tableData ?? [];

    /**
     * A further page is only possible when the server hands back a cursor to
     * continue from. Taking hasMore on its own left the observer requesting for
     * ever against a response that kept saying "more" while returning the first
     * page again — which is what it did while nextCursor was coming back
     * undefined.
     */
    const canContinue = Boolean(hasMore) && Boolean(nextCursor) && rows.length > 0;

    setData((prev) => {
      if (!cursorRef.current)
        return { tableData: rows, hasMore: canContinue, isLoading: false };

      // Appended in full: capping the list dropped rows off the top, which held
      // the sentinel at the foot of an unchanged scroll height and started the
      // whole cycle again. Rows already listed are skipped — a row must appear
      // once whatever the server paged back.
      const listed = new Set(prev.tableData.map(rowKeyRef.current));
      return {
        tableData: [
          ...prev.tableData,
          ...rows.filter((row) => !listed.has(rowKeyRef.current(row))),
        ],
        hasMore: canContinue,
        isLoading: false,
      };
    });

    if (canContinue) cursorRef.current = nextCursor;
    hasMoreRef.current = canContinue;
    isFetchingRef.current = false;
  }, [url, apiReferencePropsBasedOnFilters?.params, onPageLoaded]);

  useEffect(() => {
    listVersionRef.current += 1;
    cursorRef.current = null;
    isFetchingRef.current = false;
    hasMoreRef.current = true;
    setData({
      isLoading: false,
      hasMore: true,
      tableData: [],
    });
    fetchData();
  }, apiReferencePropsBasedOnFilters?.referenceArrayForUseEffect);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    /**
     * No paging while only the selected rows are shown: the short list leaves
     * the sentinel permanently in view, and the L2 sheet can only ever contain
     * rows the reader has already selected, so there is nothing to page for.
     */
    if (showOnlySelected) return undefined;

    // Measured from a rendered row, since row height depends on the columns a
    // caller shows and how their text wraps.
    const rowHeight =
      containerRef.current?.querySelector("tbody tr")?.getBoundingClientRect()
        .height || FALLBACK_ROW_HEIGHT;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && data?.hasMore) {
          fetchData();
        }
      },
      {
        root: containerRef.current,
        // Extends the container's detection box below its visible edge, so the
        // sentinel counts as in view while PREFETCH_ROWS rows still separate it
        // from the reader.
        rootMargin: `0px 0px ${Math.round(rowHeight * PREFETCH_ROWS)}px 0px`,
      },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
    // hasRows re-arms the observer once real rows exist to measure; it does
    // not change again from page to page.
  }, [data?.hasMore, fetchData, showOnlySelected, hasRows]);

  const updateRow = useCallback((spareParts = []) => {
    if (!spareParts.length) return;

    if (isNormalRowActions)
      return setData((prev) => ({
        ...prev,
        tableData: prev.tableData?.map((item) =>
          item?._id === spareParts?.[0]?._id ? spareParts?.[0] : item,
        ),
      }));

    setData((prev) => {
      /**
       * Built inside the updater because the updater consumes it: React may run
       * an updater more than once, and a map emptied by the first run made the
       * second run see every part as new and append the whole batch again.
       */
      const partsMap = new Map(
        spareParts.map((item) => [item?.changeParts?._id, item]),
      );
      let hasChange = false;

      const nextTableData = prev.tableData.map((row) => {
        const updated = partsMap.get(row?.changeParts?._id);
        if (updated) {
          hasChange = true;
          partsMap.delete(row?.changeParts?._id);
          return updated;
        }
        return row;
      });

      const newRows = [...partsMap.values()];
      if (newRows.length) hasChange = true;

      if (!hasChange) return prev;

      return { ...prev, tableData: [...nextTableData, ...newRows] };
    });
  }, []);

  const removeRow = useCallback(({ partId }) => {
    setData((prev) => ({
      ...prev,
      tableData: prev.tableData.filter(
        (row) => row.changeParts?._id !== partId,
      ),
    }));
  }, []);

  return (
    <div className="cell spare-scroll-table" ref={containerRef}>
      <table className="ar-table pmSheetApprovalTableCol">
        <thead className="mt-5">
          <tr className="bg-button">
            {tableHeaders?.map((tColumn) => (
              <th
                className={"ar-table-thead-header5 td-padding text-white"}
                key={tColumn}
              >
                {tColumn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows?.map((otherData, index) => (
            <tr
              className="ar-table-thead-header4 tableRowColor"
              key={rowKey(otherData)}
            >
              {OtherComp && (
                <OtherComp
                  otherData={otherData}
                  // 1-based position in the list as shown, for a serial column.
                  rowIndex={index + 1}
                  {...otherParentProps}
                  removeRow={removeRow}
                  updateRow={updateRow}
                />
              )}
            </tr>
          ))}

          <tr className="ar-table-thead-header4 tableRowColor">
            {/*
              In a cell of its own: a bare div under a tr is laid out through an
              anonymous table-cell box, and the sentinel's position is what the
              observer measures.

              Its height stays the same whether or not a page is in flight, so
              loading the next page cannot move the sentinel and ask for another.
            */}
            <td colSpan={tableHeaders?.length || 1} className="border-0 p-0">
              <div
                ref={sentinelRef}
                style={{
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {data?.isLoading && !showOnlySelected && visibleRows?.length > 0 && (
                  <small className="text-muted">Loading more…</small>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {/*
        The full panel belongs to the first page only. Between pages it added and
        removed 300px at the foot of the scroll area, which read as a flashing
        loading screen while the reader was scrolling.
      */}
      {data?.isLoading && visibleRows?.length === 0 && <Loading />}
    </div>
  );
};

export default SpareSheetCustomTable;
