import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../../context/routing/RoutingContext";
import "./index.css";
import SortIcon from "@mui/icons-material/Sort";
// import "./tableColor.scss"

import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";

function PMSheetApprovalOfImplementationPhase() {
  const context = useContext(RoutingContext);

  const [tableData, setTableData] = useState([]);

  const [sortingType, setSortingType] = useState("ascending");
  const [refKey, setRefKey] = useState(0);

  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);

  const monthKeyArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

  const financialYearWiseMonthKeyArray = [
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  let columns = [
    {
      header: "Line",
      sortKey: "line_names.line_name",
    },
    {
      header: "Machine Code",
      sortKey: "machine_code",
    },
    {
      header: "Machine Name",
      sortKey: "machine_name",
    },
    {
      header: "Plan Month",
      sortKey: "true",
    },
    {
      header: "TM Name",
      sortKey: "true",
    },
    {
      header: "PRD-TL",
      sortKey: "true",
    },
    {
      header: "MTD-TL",
      sortKey: "true",
    },
    {
      header: "MTD-HOS",
      sortKey: "true",
    },
    {
      header: "MTD-HOD : 1/6M",
      sortKey: "true",
    },
  ];

  let columns1 = [
    {
      header: "TL Preparation",
      sort: "true",
    },
    {
      header: "TL/HOSS Checked",
      sort: "true",
    },
    {
      header: "HOS Approval",
      sort: "true",
    },
    {
      header: "MTD-TL Prepared",
      sort: "true",
    },
    {
      header: "PRD-TL Approval",
      sort: "true",
    },
  ];

  // console.log(context.section_data);
  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setTableData(data.machineDataOfImplementationApproval);
        setStateForAnimationAndNotFound(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(tableData);

  const sortData = (sortKey) => {
    if (sortingType === "ascending") {
      console.log(sortKey, "ascending ");
      tableData?.sort(function (a, b) {
        const name1 = a[sortKey].toUpperCase();
        const name2 = b[sortKey].toUpperCase();

        let comparison = 0;

        if (name1 > name2) {
          comparison = 1;
        } else if (name1 < name2) {
          comparison = -1;
        }
        return comparison;
      });
      setSortingType("descending");
    } else if (sortingType === "descending") {
      // console.log(sortKey, "descending ");
      tableData?.sort(function (a, b) {
        const name1 = a[sortKey].toUpperCase();
        const name2 = b[sortKey].toUpperCase();

        let comparison = 0;

        if (name1 < name2) {
          comparison = 1;
        } else if (name1 > name2) {
          comparison = -1;
        }
        return comparison;
      });
      setSortingType("normal");
    } else if (sortingType === "normal") {
      // console.log(sortKey, "normal ");
      setRefKey((refKey) => refKey + 1);
      setSortingType("ascending");
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard();
  }, [refKey]);
  return (
    <>
      {tableData?.length > 0 ? (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <h4 style={{ padding: "1rem 0 0 0" }}>PM Plan vs Actual Approval</h4>

          <table className="ar-table PMSheetApprovalOfImplementationPhaseTableCol container-fluid">
            <thead className="mt-5">
              <tr className="bg-button">
                {columns.map((tColumn) => (
                  <th
                    className={"ar-table-thead-header5 td-padding text-white"}
                    // colSpan={
                    //   tColumn.header === "Preparation"
                    //     ? 3
                    //     : tColumn.header === "Planning"
                    //     ? 2
                    //     : 0
                    // }
                  >
                    {tColumn.header}
                    {tColumn.header === "Machine Code" ||
                    tColumn.header === "Machine Name" ? (
                      <span
                        onClick={() => sortData(tColumn.sortKey)}
                        style={{ cursor: "pointer" }}
                      >
                        &nbsp;
                        <SortIcon />
                      </span>
                    ) : (
                      ""
                    )}
                  </th>
                ))}
              </tr>
              {/* <tr className="ar-table-thead-header4">
              <th></th>
              <th></th>
              <th></th>
              {columns1.map((tColumn) => (
                <th className={"ar-table-thead-header4 td-padding"}>
                  {tColumn.header}
                </th>
              ))}
            </tr> */}
            </thead>
            <tbody>
              {financialYearWiseMonthKeyArray?.map((monthKey) =>
                tableData?.map((index) =>
                  index?.checkSheet_data?.implementation_assign_PRD_TL?.[
                    monthKey
                  ].length > 0 ||
                  index?.checkSheet_data
                    ?.implemetation_mtd_hod_approval_status?.[monthKey]
                    ?.length > 0 ? (
                    <tr className="ar-table-thead-header4 tableRowColor">
                      <td className="td-padding">
                        {index.line_names.line_name}
                      </td>
                      <td className="td-padding">{index.machine_code}</td>
                      <td className="td-padding">{index.machine_name}</td>
                      <td className="td-padding">{monthKey}</td>

                      <td className="td-padding">
                        {/* {index.sender_tm_name[idx]}
                    <br />
                    {index.preparation_TL_date[idx]
                      } */}
                        {index?.checkSheet_data?.implemetation_completed_tm_name?.[
                          monthKey
                        ]?.map((value, idx) => (
                          <p>
                            {value}-
                            {
                              index?.checkSheet_data
                                ?.implemetation_completed_date?.[monthKey]?.[idx]
                            }
                          </p>
                        ))}
                      </td>
                      {/* PRD Approval */}
                      <td className="td-padding">
                        {index?.checkSheet_data?.implemetation_prd_tl_approval_status?.[
                          monthKey
                        ]?.map((value, idx) => (
                          <p>
                            <b>{value}</b>-
                            {
                              index?.checkSheet_data
                                ?.implementation_assign_PRD_TL_name?.[monthKey]?.[
                                idx
                              ]
                            }
                            -
                            {
                              index?.checkSheet_data
                                ?.implementation_approved_PRD_TL_date?.[monthKey]?.[
                                idx
                              ]
                            }
                          </p>
                        ))}
                      </td>
                      {/* MTD TL approval */}
                      <td className="td-padding">
                        {index?.checkSheet_data?.implemetation_mtd_tl_approval_status?.[
                          monthKey
                        ]?.map((value, idx) => (
                          <p>
                            <b>{value}</b>-
                            {
                              index?.checkSheet_data
                                ?.implementation_assign_MTD_TL_name?.[monthKey]?.[
                                idx
                              ]
                            }
                            -
                            {
                              index?.checkSheet_data
                                ?.implementation_approved_MTD_TL_date?.[monthKey]?.[
                                idx
                              ]
                            }{" "}
                            -{" "}
                            {value === "Rejected"
                              ? `Remarks: ${index?.checkSheet_data?.implementation_rejected_remarks?.[monthKey]?.[idx]}`
                              : ""}
                          </p>
                        ))}
                      </td>
                      {/* MTD HOS approval */}
                      <td className="td-padding">
                        {index?.checkSheet_data?.implemetation_mtd_hos_approval_status?.[
                          monthKey
                        ]?.map((value, idx) => (
                          <p>
                            <b>{value}</b>-
                            {
                              index?.checkSheet_data
                                ?.implementation_assign_MTD_HOS_name?.[
                                monthKey
                              ]?.[idx]
                            }
                            -
                            {
                              index?.checkSheet_data
                                ?.implementation_approved_MTD_HOS_date?.[
                                monthKey
                              ]?.[idx]
                            }
                            -{" "}
                            {value === "Rejected"
                              ? `Remarks: ${index?.checkSheet_data?.implementation_rejected_remarks?.[monthKey]?.[idx]}`
                              : ""}
                          </p>
                        ))}
                      </td>
                      {/* {console.log(index?.checkSheet_data)}
                      
                      */}

                      {index?.checkSheet_data
                        ?.implemetation_mtd_hod_approval_status?.[monthKey]
                        ?.length > 0 ? (
                        <td className="td-padding">
                          {" "}
                          <p>
                            <b>
                              {index?.checkSheet_data?.implemetation_mtd_hod_approval_status?.[
                                monthKey
                              ]?.at(-1)}
                            </b>
                            -
                            {index?.checkSheet_data?.implementation_approved_MTD_HOD_date?.[
                              monthKey
                            ]?.at(-1)}
                            -
                            {index?.checkSheet_data?.implementation_approved_by_MTD_HOD?.[
                              monthKey
                            ]?.at(-1)}
                          </p>
                        </td>
                      ) : (
                        <td className="td-padding"></td>
                      )}
                    </tr>
                  ) : (
                    ""
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="container-fluid d-flex justify-content-center align-items-center p-5"
          // style={{ height: "100vh" }}
        >
          {stateForAnimationAndNotFound}
          {/* <LoadingAnimation /> */}
        </div>
      )}
    </>
  );
}

export default PMSheetApprovalOfImplementationPhase;
