import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../../context/routing/RoutingContext";
import "./index.css";
import { Tooltip, Switch } from "@mui/material";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";
import Footer from "../../../components/Footer/Footer";
import { Row, Col } from "react-bootstrap";
import { postLineToGetAllMachineData } from "../../../Integration/APIExports";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";
// import "./tableColor.scss"
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import DisplayTotalAcceptedAndApproveOnApprovalLog from "../../../Popups/DisplayTotalAcceptedAndApproveOnApprovalLog";

function PMSheetApproval() {
  const context = useContext(RoutingContext);

  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [displayPendingOrNot, setDisplayPendingOrNot] = useState(false);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [tableData, setTableData] = useState([]);

  const [allLineData, setAllLineData] = useState([]);

  const [acceptedAndApproveTotalCount, setAcceptedAndApproveTotalCount] =
    useState([]);

  const [displayAndCloseCountModal, setDisplayAndCloseCountModal] =
    useState(false);

  const [selectedLine, setSelectedLine] = useState();
  const [selectedMachine, setSelectedMachine] = useState();
  const [allMachineDataBasedOnLine, setAllMachineDataBasedOnLine] = useState(
    []
  );

  let columns = [
    {
      header: "Line",
      sort: "true",
    },
    {
      header: "Machine Code",
      sort: "true",
    },
    {
      header: "Machine Name",
      sort: "true",
    },
    {
      header: "Preparation",
      sort: "true",
    },
    {
      header: "Planning",
      sort: "true",
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

        setTableData(data.machineDataOfPrepAndPlanApproval);
        setAllLineData(data?.lineData);
        setStateForAnimationAndNotFound(<NotFound />);
      }
    } catch (error) {
      console.log(error);
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

        postSectionToGetPMSheetApprovalData(
          sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection] ||
            data?.sectionDataArray?.[0]
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetPMSheetApprovalData = async (sectionData) => {
    setStateForAnimationAndNotFound(<LoadingAnimation />);
    try {
      const res = await fetch(
        `/postSectionToGetPMSheetApprovalData/preparationAndPlanningPhaseApprovalLog/?lineId=${selectedLine}&&machine_code=${selectedMachine}&&pendingFilterValue=${displayPendingOrNot}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTableData(data.approvalLogOfPM);
        setAllLineData(data?.lineData);
        setAcceptedAndApproveTotalCount(
          data?.countOfAcceptedAndTotalApprovalOfUsers
        );
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
  // }, [selectedYear]);

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
    displayPendingOrNot,
  ]);

  const handleDisplayAcceptedAndApproveCount = () =>
    setDisplayAndCloseCountModal(
      (displayAndCloseCountModal) => !displayAndCloseCountModal
    );

  return (
    <>
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
          <Col sm={12} md={6} lg={3}>
            <span>
              <b>Section:&nbsp; &nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "63%" }}
              id="standard-select-currency"
              name="selectedSectionOrSubSection"
              className="textField mb-3"
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
          <Col sm={6} md={6} lg={2} className="mb-3">
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
          <Col sm={6} md={3} lg={3}>
            <button
              class="btn-primary1"
              onClick={() => window.location.reload()}
            >
              Reset
            </button>
          </Col>
        </Row>
      ) : (
        <Row className="p-2 d-flex justify-content-center align-items-center">
          <Col sm={12} md={6} lg={2} className="mb-3">
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} md={6} lg={3} className="mb-3">
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

          <Col sm={12} md={6} lg={3} className="mb-3">
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
          <Col sm={6} md={6} lg={2} className="mb-3">
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
          <Col sm={6} md={6} lg={2} className="mb-3 d-flex">
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
              <h4>PM Sheet Approval</h4>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDisplayAcceptedAndApproveCount}
              >
                Show Approved / Pending
              </button>
            </div>
          </div>

          <table className="ar-table pmSheetApprovalTableCol">
            <thead className="mt-5">
              <tr className="bg-button">
                {columns.map((tColumn) => (
                  <th
                    className={"ar-table-thead-header5 td-padding text-white"}
                    colSpan={
                      tColumn.header === "Preparation"
                        ? 3
                        : tColumn.header === "Planning"
                        ? 2
                        : 0
                    }
                  >
                    {tColumn.header}
                  </th>
                ))}
              </tr>
              <tr className="ar-table-thead-header4">
                <th></th>
                <th></th>
                <th></th>
                {columns1.map((tColumn) => (
                  <th
                    className={
                      "ar-table-thead-header4 td-padding bg-light-button text-dark font-weight-normal"
                    }
                  >
                    {tColumn.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData?.map((index) => (
                <tr className="ar-table-thead-header4 tableRowColor">
                  <td className="td-padding">{index.line_names.line_name}</td>
                  <td className="td-padding">{index.machine_code}</td>
                  <td className="td-padding">{index.machine_name}</td>
                  <td className="td-padding">
                    {/* {index.sender_tm_name[idx]}
                  <br />
                  {index.preparation_TL_date[idx]
                    } */}
                    {index?.checkSheet_data?.sender_tm_name?.map(
                      (value, idx) => (
                        <p>
                          {value}-
                          {index?.checkSheet_data?.preparation_TL_date?.[idx]}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.tl_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_TL_name?.[idx]}-
                          {
                            index?.checkSheet_data?.preparation_TL_HOSS_date[
                              idx
                            ]
                          }
                          ,{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks?.[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.hos_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_HOS_name?.[idx]}-
                          {index?.checkSheet_data?.preparation_HOS_date?.[idx]},{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks?.[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.plan_prepared_tm_name?.map(
                      (value, idx) => (
                        <p>
                          {value}-
                          {index?.checkSheet_data?.planning_TL_date?.[idx]}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.prd_tl_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_PRD_TL_name?.[idx]}-
                          {index?.checkSheet_data?.planning_PRD_TL_date?.[idx]},{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks?.[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                </tr>
              ))}
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
          acceptedAndApproveTotalCount={acceptedAndApproveTotalCount}
          modelProp={{
            show: displayAndCloseCountModal,
            onHide: handleDisplayAcceptedAndApproveCount,
          }}
        />
      )}
    </>
  );
}

export default PMSheetApproval;
