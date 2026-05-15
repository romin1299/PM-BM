import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Loading from "../../components/Loading/Loading";

import { axiosGetOrDelete } from "../Utils/axiosUtils";

const tableHeaders = [
  "Request No",
  "Product",
  "Line",
  "Machine No",
  "Machine Name",
];

const partColumns = ["Part name", "Part model"];

const SpareSheetCustomTable = ({
  otherHeaders = [],
  OtherComp = null,
  url = `/v1/spare/spareRequestSheet/logs`,
  otherParentProps = {},
  apiReferencePropsBasedOnFilters = {
    params: {},
    referenceArrayForUseEffect: [],
  },
  isPartWiseTable = true,
}) => {
  const cursorRef = useRef(null);

  const [data, setData] = useState({
    isLoading: false,
    hasMore: true,
    tableData: [],
  });

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const allHeaders = useMemo(
    () =>
      isPartWiseTable
        ? [...tableHeaders, ...partColumns].concat(otherHeaders)
        : tableHeaders.concat(otherHeaders),
    [otherHeaders, isPartWiseTable],
  );

  const fetchData = useCallback(async () => {
    if (data.isLoading || !data.hasMore) return;

    setData((prev) => ({ ...prev, isLoading: true }));

    const { isError, tableData, hasMore, nextCursor } = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: {
          cursor: cursorRef.current,
          ...apiReferencePropsBasedOnFilters?.params,
        },
      },
    });

    if (!isError) {
      setData((prev) => ({
        tableData: cursorRef.current
          ? [...prev.tableData, ...tableData].slice(-200)
          : tableData,
        hasMore,
        isLoading: false,
      }));

      cursorRef.current = nextCursor;
    } else {
      setData((prev) => ({ ...prev, isLoading: false, hasMore: false }));
    }
  }, [
    url,
    data.hasMore,
    data.isLoading,
    apiReferencePropsBasedOnFilters?.params,
  ]);

  useEffect(() => {
    cursorRef.current = null;
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

    const partsMap = new Map(
      spareParts.map((item) => [item?.changeParts?._id, item]),
    );

    setData((prev) => {
      let hasChange = false;

      const nextTableData = prev.tableData.map((row) => {
        const updated = partsMap.get(row?.changeParts?._id);
        if (updated) {
          hasChange = true;
          return updated;
        }
        return row;
      });

      if (!hasChange) return prev;

      return { ...prev, tableData: nextTableData };
    });
  }, []);

  const removeRow = useCallback((_id) => {
    setData((prev) => ({
      ...prev,
      tableData: prev.tableData.filter((row) => row._id !== _id),
    }));
  }, []);

  return (
    <div
      style={{ maxHeight: "75vh", overflowY: "auto" }}
      className="cell"
      ref={containerRef}
    >
      <table className="ar-table pmSheetApprovalTableCol">
        <thead className="mt-5">
          <tr className="bg-button">
            {allHeaders?.map((tColumn) => (
              <th className={"ar-table-thead-header5 td-padding text-white"}>
                {tColumn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.tableData?.map(
            ({
              requestSheetNo = "",
              cell = { cell_name: "" },
              line = { line_name: "" },
              machine = { machine_code: "", machine_name: "" },
              ...otherData
            }) => (
              <tr className="ar-table-thead-header4 tableRowColor">
                <td className="td-padding">{requestSheetNo}</td>
                <td className="td-padding">{cell?.cell_name}</td>
                <td className="td-padding">{line?.line_name}</td>
                <td className="td-padding">{machine?.machine_code}</td>
                <td className="td-padding">{machine?.machine_name}</td>
                {isPartWiseTable && (
                  <>
                    <td className="td-padding ">
                      {otherData?.changeParts?.partName}
                    </td>
                    <td className="td-padding ">
                      {otherData?.changeParts?.partModel}
                    </td>
                  </>
                )}
                {OtherComp && (
                  <OtherComp
                    otherData={otherData}
                    {...otherParentProps}
                    removeRow={removeRow}
                    updateRow={updateRow}
                  />
                )}
              </tr>
            ),
          )}

          <tr className="ar-table-thead-header4 tableRowColor">
            <div ref={sentinelRef} style={{ height: "10px" }} />
          </tr>
        </tbody>
      </table>
      {data?.isLoading && <Loading />}
    </div>
  );
};

export default SpareSheetCustomTable;
