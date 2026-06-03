import React, { useState, useCallback, useRef, useEffect } from "react";
import Loading from "../../components/Loading/Loading";

import { axiosGetOrDelete } from "../Utils/axiosUtils";

export const UptoMachineHeaders = ({ otherData }) => (
  <>
    <td className="td-padding">{otherData?.requestSheetNo}</td>
    <td className="td-padding">{otherData?.cell?.cell_name}</td>
    <td className="td-padding">{otherData?.line?.line_name}</td>
    <td className="td-padding">{otherData?.machine?.machine_code}</td>
    <td className="td-padding">{otherData?.machine?.machine_name}</td>
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

      if (hasMore) cursorRef.current = nextCursor;
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
            {tableHeaders?.map((tColumn) => (
              <th className={"ar-table-thead-header5 td-padding text-white"}>
                {tColumn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.tableData?.map((otherData) => (
            <tr className="ar-table-thead-header4 tableRowColor">
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
            <div ref={sentinelRef} style={{ height: "10px" }} />
          </tr>
        </tbody>
      </table>
      {data?.isLoading && <Loading />}
    </div>
  );
};

export default SpareSheetCustomTable;
