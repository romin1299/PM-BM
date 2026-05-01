// import React, {
//   useState,
//   useMemo,
//   useRef,
//   useEffect,
//   useCallback,
// } from "react";
// import Loading from "../../components/Loading/Loading";
// import { axiosGetOrDelete } from "../Utils/axiosUtils";

// const tableHeaders = [
//   "Request No",
//   "Product",
//   "Line",
//   "Machine No",
//   "Machine Name",
// ];

// const MAX_ROWS = 200;
// const SCROLL_THRESHOLD = 150;

// const SpareSheetCustomTable = ({
//   flagForTogglingFilter,
//   selectedValue,
//   selectedYear,
//   otherHeaders = [],
//   OtherComp,
// }) => {
//   const [cursor, setCursor] = useState(null);
//   const [data, setData] = useState({
//     isLoading: false,
//     hasMore: true,
//     tableData: [],
//   });

//   const containerRef = useRef(null);
//   const isFetchingRef = useRef(false);

//   const allHeaders = useMemo(
//     () => [...tableHeaders, ...otherHeaders],
//     [otherHeaders],
//   );

//   const fetchData = useCallback(async () => {
//     if (isFetchingRef.current || !data.hasMore) return;

//     isFetchingRef.current = true;

//     setData((prev) => ({ ...prev, isLoading: true }));

//     try {
//       const {
//         isError,
//         tableData = [],
//         hasMore,
//         nextCursor,
//       } = await axiosGetOrDelete({
//         url: `/v1/spare/spareRequestSheet/logs`,
//         axiosProps: {
//           params: {
//             flagForTogglingFilter,
//             selectedValue,
//             selectedYear,
//             cursor,
//           },
//         },
//       });

//       if (!isError) {
//         setData((prev) => ({
//           tableData: [...prev.tableData, ...tableData].slice(-MAX_ROWS),
//           hasMore,
//           isLoading: false,
//         }));

//         setCursor(nextCursor);
//       } else {
//         setData((prev) => ({ ...prev, isLoading: false }));
//       }
//     } catch (e) {
//       setData((prev) => ({ ...prev, isLoading: false }));
//     } finally {
//       isFetchingRef.current = false;
//     }
//   }, [
//     cursor,
//     data.hasMore,
//     flagForTogglingFilter,
//     selectedValue,
//     selectedYear,
//   ]);

//   useEffect(() => {
//     setCursor(null);
//     setData({
//       isLoading: false,
//       hasMore: true,
//       tableData: [],
//     });
//     isFetchingRef.current = false;

//     fetchData();
//   }, [flagForTogglingFilter, selectedValue, selectedYear]);

//   const handleScroll = useCallback(() => {
//     const el = containerRef.current;
//     if (!el || isFetchingRef.current || !data.hasMore) return;

//     const { scrollTop, scrollHeight, clientHeight } = el;

//     if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
//       fetchData();
//     }
//   }, [fetchData, data.hasMore]);

//   useEffect(() => {
//     const el = containerRef.current;
//     if (!el) return;

//     let ticking = false;

//     const onScroll = () => {
//       if (!ticking) {
//         window.requestAnimationFrame(() => {
//           handleScroll();
//           ticking = false;
//         });
//         ticking = true;
//       }
//     };

//     el.addEventListener("scroll", onScroll);

//     return () => el.removeEventListener("scroll", onScroll);
//   }, [handleScroll]);

//   return (
//     <>
//       <div ref={containerRef} style={{ maxHeight: "500px", overflowY: "auto" }}>
//         <table className="ar-table pmSheetApprovalTableCol">
//           <thead>
//             <tr className="bg-button">
//               {allHeaders.map((header, index) => (
//                 <th
//                   key={index}
//                   className="ar-table-thead-header5 td-padding text-white"
//                 >
//                   {header}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {data.tableData.map((row, index) => {
//               const {
//                 requestSheetNo = "",
//                 cell_name = "",
//                 line_name = "",
//                 machine_code = "",
//                 machine_name = "",
//                 ...otherData
//               } = row;

//               return (
//                 <tr
//                   key={requestSheetNo || index}
//                   className="ar-table-thead-header4 tableRowColor"
//                 >
//                   <td className="td-padding">{requestSheetNo}</td>
//                   <td className="td-padding">{cell_name}</td>
//                   <td className="td-padding">{line_name}</td>
//                   <td className="td-padding">{machine_code}</td>
//                   <td className="td-padding">{machine_name}</td>

//                   {OtherComp && <OtherComp otherData={otherData} />}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {data.isLoading && <Loading />}
//     </>
//   );
// };

// export default React.memo(SpareSheetCustomTable);

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

const SpareSheetCustomTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  otherHeaders = [],
  OtherComp = null,
  url = `/v1/spare/spareRequestSheet/logs`,
  otherParentProps = {},
}) => {
  const [cursor, setCursor] = useState(null);

  const [data, setData] = useState({
    isLoading: false,
    hasMore: true,
    tableData: [],
  });

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const allHeaders = useMemo(
    () => tableHeaders.concat(otherHeaders),
    [otherHeaders],
  );

  const fetchData = useCallback(async () => {
    if (data.isLoading || !data.hasMore) return;

    setData((prev) => ({ ...prev, isLoading: true }));

    const { isError, tableData, hasMore, nextCursor } = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: {
          flagForTogglingFilter,
          selectedValue,
          selectedYear,
          cursor,
        },
      },
    });

    if (!isError) {
      setData((prev) => ({
        tableData: cursor
          ? [...prev.tableData, ...tableData].slice(-200)
          : tableData,
        hasMore,
        isLoading: false,
      }));

      setCursor(nextCursor);
    } else {
      setData((prev) => ({ ...prev, isLoading: false, hasMore: false }));
    }
  }, [
    url,
    cursor,
    data.hasMore,
    data.isLoading,
    flagForTogglingFilter,
    selectedValue,
    selectedYear,
  ]);

  useEffect(() => {
    setCursor(null);
    setData({
      isLoading: false,
      hasMore: true,
      tableData: [],
    });
    fetchData();
  }, [flagForTogglingFilter, selectedValue, selectedYear]);

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

  const updateRow = useCallback((propData) => {
    setData((prev) => ({
      ...prev,
      tableData: prev.tableData.map((row) =>
        row._id === propData?._id ? propData : row,
      ),
    }));
  }, []);

  const removeRow = useCallback((_id) => {
    setData((prev) => ({
      ...prev,
      tableData: prev.tableData.filter((row) => row._id !== _id),
    }));
  }, []);

  return (
    <div style={{ maxHeight: "75vh", overflowY: "auto" }} ref={containerRef}>
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
