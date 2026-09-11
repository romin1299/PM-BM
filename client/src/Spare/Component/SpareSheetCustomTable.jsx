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

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;

    isFetchingRef.current = true;
    setData((prev) => ({ ...prev, isLoading: true }));

    const response = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: {
          cursor: cursorRef.current,
          ...apiReferencePropsBasedOnFilters?.params,
        },
      },
    });

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

    setData((prev) => ({
      // Appended in full: capping the list dropped rows off the top, which held
      // the sentinel at the foot of an unchanged scroll height and started the
      // whole cycle again.
      tableData: cursorRef.current ? [...prev.tableData, ...rows] : rows,
      hasMore: canContinue,
      isLoading: false,
    }));

    if (canContinue) cursorRef.current = nextCursor;
    hasMoreRef.current = canContinue;
    isFetchingRef.current = false;
  }, [url, apiReferencePropsBasedOnFilters?.params, onPageLoaded]);

  useEffect(() => {
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

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && data?.hasMore) {
          fetchData();
        }
      },
      {
        root: containerRef.current,
      },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [data?.hasMore, fetchData]);

  const updateRow = useCallback((spareParts = []) => {
    if (!spareParts.length) return;

    if (isNormalRowActions)
      return setData((prev) => ({
        ...prev,
        tableData: prev.tableData?.map((item) =>
          item?._id === spareParts?.[0]?._id ? spareParts?.[0] : item,
        ),
      }));

    const partsMap = new Map(
      spareParts.map((item) => [item?.changeParts?._id, item]),
    );

    setData((prev) => {
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
          {visibleRows?.map((otherData) => (
            <tr
              className="ar-table-thead-header4 tableRowColor"
              key={rowKey(otherData)}
            >
              {OtherComp && (
                <OtherComp
                  otherData={otherData}
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
                {data?.isLoading && visibleRows?.length > 0 && (
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
