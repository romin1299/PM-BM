import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../../context/routing/RoutingContext";
import "./index.css";
import SortIcon from "@mui/icons-material/Sort";
// import "./tableColor.scss"
import { Tooltip, Switch } from "@mui/material";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";
import Footer from "../../../components/Footer/Footer";
import { Row, Col } from "react-bootstrap";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";
import { postLineToGetAllMachineData } from "../../../Integration/APIExports";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import DisplayTotalAcceptedAndApproveOnApprovalLog from "../../../Popups/DisplayTotalAcceptedAndApproveOnApprovalLog";

function PMSheetApprovalOfImplementationPhase() {
  const context = useContext(RoutingContext);

  const [tableData, setTableData] = useState([]);
  const [displayPendingOrNot, setDisplayPendingOrNot] = useState(false);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [sortingType, setSortingType] = useState("ascending");
  const [refKey, setRefKey] = useState(0);

  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);
  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

  const [allLineData, setAllLineData] = useState([]);

  const [
    acceptedAndApproveTotalCountOfImplementation,
    setAcceptedAndApproveTotalCountOfImplementation,
  ] = useState([]);

  const [displayAndCloseCountModal, setDisplayAndCloseCountModal] =
    useState(false);

  const [selectedLine, setSelectedLine] = useState();
  const [selectedMachine, setSelectedMachine] = useState();
  const [allMachineDataBasedOnLine, setAllMachineDataBasedOnLine] = useState(
    []
  );
  const [selectedMonth, setSelectedMonth] = useState();

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
    setTableData([]);
    setStateForAnimationAndNotFound(<LoadingAnimation />);

    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setTableData(data.machineDataOfImplementationApproval);
        setAllLineData(data?.lineData);
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

  const postPlantToGetSectionDataBasedOnDashboardLevel = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch(
        "/postPlantToGetSectionDataBasedOnDashboardLevel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plant: context.plant_data,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("-------------$$$$$$$$$$$$-->", data);
        setSectionOrSubSectionDropdownList(data?.sectionDataArray);

        // getDataOfSkippedApprovalStatus(data?.sectionDataArray?.[0]);

        postSectionToGetPMSheetApprovalData(data?.sectionDataArray?.[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetPMSheetApprovalData = async (sectionData) => {
    setTableData([]);
    setStateForAnimationAndNotFound(<LoadingAnimation />);
    try {
      const res = await fetch(
        `/postSectionToGetPMSheetApprovalData/implementationPhaseApprovalLog/?lineId=${selectedLine}&&machine_code=${selectedMachine}&&pendingFilterValue=${displayPendingOrNot}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            selectedYear,
            selectedMonth,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTableData(data.approvalLogOfPM);
        setAcceptedAndApproveTotalCountOfImplementation(
          data?.countOfAcceptedAndTotalApprovalOfUsers
        );
        setAllLineData(data?.lineData);
        setStateForAnimationAndNotFound(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   if (context?.user_type !== "Plant-Admin") {
  //     postSectionToGetAllDataForMainDashboard();
  //   }
  // }, [refKey, selectedYear]);

  useEffect(() => {
    if (context?.user_type === "Plant-Admin") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    }
  }, [selectedYear, displayPendingOrNot]);

  useEffect(() => {
    if (context?.user_type === "Plant-Admin" && selectedSectionOrSubSection) {
      postSectionToGetPMSheetApprovalData(
        sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
      );
    } else {
      postSectionToGetPMSheetApprovalData(context.section_data);
    }
  }, [
    selectedSectionOrSubSection,
    selectedYear,
    selectedLine,
    selectedMachine,
    selectedMonth,
    refKey,
    displayPendingOrNot,
  ]);

  const handleDisplayAcceptedAndApproveCount = () =>
    setDisplayAndCloseCountModal(
      (displayAndCloseCountModal) => !displayAndCloseCountModal
    );

  console.log(tableData);

  // const postSectionToGetAllDataForMainDashboard12 = async () => {
  //   // setSubSection(undefined);

  //   try {
  //     const res = await fetch("/postSectionToGetAllData12", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         section: context.section_data,
  //         selectedYear,
  //       }),
  //     });
  //     const data = await res.json();

  //     if (res.status === 400 || res.status === 422 || !data) {
  //       console.log("Invalid");
  //     } else {
  //       // console.log(data);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  return (
    <>
      {/* <button onClick={postSectionToGetAllDataForMainDashboard12}>
        Click me
      </button> */}
      {/* <Row className="p-2 mt-3">
        <Col sm={12} md={6} lg={3}>
          <YearDropDown
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </Col>
      </Row> */}
      {context?.user_type === "Plant-Admin" && context?.tm_grade === "HOD" ? (
        <Row className="p-2">
          <Col sm={12} md={6} lg={2}>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} lg={3}>
            <span>
              <b>Section:&nbsp; &nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "63%" }}
              id="standard-select-currency"
              name="selectedSectionOrSubSection"
              className="textField"
              value={selectedSectionOrSubSection}
              onChange={(e) => {
                setSelectedSectionOrSubSection(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {sectionOrSubSectionDropdownList?.map((option, index) => {
                return <option value={index}>{option?.section_name}</option>;
              })}
            </select>
          </Col>
          <Col sm={6} md={6} lg={2}>
            <span>
              <b>All/Pending:</b>
            </span>
            <Tooltip title="Show pending data">
              <Switch
                size="medium"
                checked={displayPendingOrNot}
                onClick={() =>
                  setDisplayPendingOrNot(
                    (displayPendingOrNot) => !displayPendingOrNot
                  )
                }
              />
            </Tooltip>
          </Col>
          <Col sm={12} lg={3}>
            <button
              class="btn-primary1"
              onClick={() => window.location.reload()}
            >
              Reset
            </button>
          </Col>
        </Row>
      ) : (
        <Row className="p-2">
          <Col sm={12} md={6} lg={2}>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Line:</b>
            </span>{" "}
            &nbsp;
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedLine"
              className="textField w-50"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={selectedLine}
              onChange={async (e) => {
                setSelectedMachine("");
                setSelectedMonth("");
                setSelectedLine(e.target.value);
                postLineToGetAllMachineData(e.target.value, selectedYear).then(
                  (result) => setAllMachineDataBasedOnLine(result?.machineInfo)
                );
              }}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {allLineData?.map((option) => {
                return <option value={option?._id}>{option?.line_name}</option>;
              })}
            </select>
            {/* <div>
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.selectedLine && formik.errors.selectedLine}
              </p>
            </div> */}
          </Col>

          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Machine:</b>
            </span>{" "}
            &nbsp;
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedMachine"
              className="textField w-50"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={
                // allMachineDataBasedOnLine?.[selectedMachine]?.machine_name || ""
                selectedMachine
              }
              onChange={(e) => {
                setSelectedMonth("");
                setSelectedMachine(e.target.value);
              }}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {allMachineDataBasedOnLine?.map((option, index) => {
                return (
                  <option value={option?.machine_code}>
                    {option?.machine_name}
                  </option>
                );
              })}
            </select>
            {/* <div>
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.selectedMachine &&
                  formik.errors.selectedMachine}
              </p>
            </div> */}
          </Col>
          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Month:</b>
            </span>
            &nbsp;
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              id="standard-select-currency"
              name="selectedPlant"
              className="textField w-50"
              w-75
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {financialYearWiseMonthKeyArray?.map((option) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>
          <Col sm={6} md={6} lg={2} className="mb-2">
            <span>
              <b>All/Pending:</b>
            </span>
            <Tooltip title="Show pending data">
              <Switch
                size="medium"
                checked={displayPendingOrNot}
                onClick={() =>
                  setDisplayPendingOrNot(
                    (displayPendingOrNot) => !displayPendingOrNot
                  )
                }
              />
            </Tooltip>
          </Col>
          <Col sm={12} md={6} lg={2} className="mb-2 d-flex">
            <button
              class="btn-primary1"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reset
            </button>
          </Col>
        </Row>
      )}
      {tableData?.length > 0 ? (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <div className="d-flex justify-content-between">
            <div>
              <h4>PM Plan vs Actual Approval</h4>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDisplayAcceptedAndApproveCount}
              >
                Show Approved / Total Approval
              </button>
            </div>
          </div>

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
                    (selectedMonth ? monthKey === selectedMonth : true) ? (
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
                                  ?.implemetation_completed_date?.[monthKey]?.[
                                  idx
                                ]
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
                                  ?.implementation_assign_PRD_TL_name?.[
                                  monthKey
                                ]?.[idx]
                              }
                              -
                              {
                                index?.checkSheet_data
                                  ?.implementation_approved_PRD_TL_date?.[
                                  monthKey
                                ]?.[idx]
                              }
                              -{" "}
                              {value === "Rejected"
                                ? `Remarks: ${index?.checkSheet_data?.implementation_rejected_remarks?.[monthKey]?.[idx]}`
                                : `Remarks: ${index?.checkSheet_data?.implemetation_quality_remarks?.[monthKey]?.[idx]}`}
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
                                  ?.implementation_assign_MTD_TL_name?.[
                                  monthKey
                                ]?.[idx]
                              }
                              -
                              {
                                index?.checkSheet_data
                                  ?.implementation_approved_MTD_TL_date?.[
                                  monthKey
                                ]?.[idx]
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
                                {
                                  index?.checkSheet_data
                                    ?.implemetation_mtd_hod_approval_status?.[
                                    monthKey
                                  ]?.[
                                    index?.checkSheet_data
                                      ?.implemetation_mtd_hod_approval_status?.[
                                      monthKey
                                    ] - 1
                                  ]
                                }
                              </b>
                              -
                              {
                                index?.checkSheet_data
                                  ?.implementation_approved_MTD_HOD_date?.[
                                  monthKey
                                ]?.[
                                  index?.checkSheet_data
                                    ?.implementation_approved_MTD_HOD_date?.[
                                    monthKey
                                  ] - 1
                                ]
                              }
                              -
                              {
                                index?.checkSheet_data
                                  ?.implementation_approved_by_MTD_HOD?.[
                                  monthKey
                                ]?.[
                                  index?.checkSheet_data
                                    ?.implementation_approved_by_MTD_HOD?.[
                                    monthKey
                                  ] - 1
                                ]
                              }
                            </p>
                          </td>
                        ) : (
                          <td className="td-padding"></td>
                        )}
                      </tr>
                    ) : (
                      ""
                    )
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
      <br />
      <br />
      <br />
      <Footer />

      {displayAndCloseCountModal && (
        <DisplayTotalAcceptedAndApproveOnApprovalLog
          acceptedAndApproveTotalCount={
            acceptedAndApproveTotalCountOfImplementation
          }
          modelProp={{
            show: displayAndCloseCountModal,
            onHide: handleDisplayAcceptedAndApproveCount,
          }}
        />
      )}
    </>
  );
}

export default PMSheetApprovalOfImplementationPhase;
