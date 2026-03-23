import React, { useState, useEffect, useContext } from "react";
import MaterialTable from "@material-table/core";
// import { ExportCsv, ExportPdf } from "@material-table/exporters";
import { jsPDF } from "jspdf";
import { CSVLink, CSVDownload } from "react-csv";
import { Row, Col, Container } from "react-bootstrap";

import ClipLoader from "react-spinners/ClipLoader";

import { fontStyle } from "@mui/system";
import { Button } from "@mui/material";

import RoutingContext from "../../../context/routing/RoutingContext";
import LineWIsePmMonthlyGraph from "./Graph/LineWIsePmMonthlyGraph";
import LineWiseMachineDetailDashboard from "./ReportPopups/LineWiseMachineDetailDashboard";

import currentMonth from "../../Dashboard/DashboardComponent/currentMonth";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import MonthDropDown from "../../Dashboard/DashboardComponent/MonthDropDown";

import LoadingAnimation from "./LoadingAnimation";
import NotFound from "./NotFound";
import Footer from "../../../components/Footer/Footer";

const LineWisePmMonthlyReport = () => {
  const context = useContext(RoutingContext);

  const [machineDetailPage, setMachineDetailPage] = useState("");

  const [tableData, setTableData] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [lineDropdown, setLineDropdown] = useState([]);

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

  const [statusSum, setStatusSum] = useState({
    totalPmSchedule: 0,
    lastMonthPendingStatusSum: 0,
    completedStatusSum: 0,
    pendingStatusSum: 0,
  });

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedLine, setSelectedLine] = useState("");

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

  const closePopup = () => {
    setMachineDetailPage("");
    document.querySelector(".lineWisePmMonthlyReport").style.pointerEvents =
      "auto";
  };

  const tableColumn = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      // width: "10%",
    },
    {
      title: "Line",
      field: "line_names.line_name",
      editable: "false",
      align: "center",
    },
    {
      title: "PM Schedule",
      // field: "total_current",
      editable: "false",
      align: "center",
      render: (rowData) => {
        // console.log(rowData);
        return (
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#0A58CA",
              textDecoration: "underline",
            }}
            // className="box-shadow"
            onClick={() => {
              let data = [];
              rowData.machine?.map((item) => {
                if (item.machineStatus !== "") {
                  data?.push(item);
                }
              });
              setMachineDetailPage(
                <LineWiseMachineDetailDashboard
                  machineData={data}
                  close={closePopup}
                />
              );
              document.querySelector(
                ".lineWisePmMonthlyReport"
              ).style.pointerEvents = "none";

              // machineDetails(rowData.machine);
            }}
          >
            {rowData.total_pmSchedule}
          </button>
        );
      },
    },
    {
      title: "Last Month Pending",
      field: "total_Previous",
      editable: "false",
      align: "center",
      render: (rowData) => {
        // console.log(rowData);
        return (
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#0A58CA",
              textDecoration: "underline",
            }}
            onClick={() => {
              let data = [];
              rowData.machine?.map((item) => {
                if (item.previousStatus === "CarriedPM") {
                  data?.push(item);
                }
              });
              setMachineDetailPage(
                <LineWiseMachineDetailDashboard
                  machineData={data}
                  close={closePopup}
                />
              );
              document.querySelector(
                ".lineWisePmMonthlyReport"
              ).style.pointerEvents = "none";

              // machineDetails(rowData.machine);
            }}
          >
            {rowData.total_Previous}
          </button>
        );
      },
    },
    {
      title: "Completed",
      // field: "total_completed",
      editable: "false",
      align: "center",
      render: (rowData) => {
        // console.log(rowData);
        return (
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#0A58CA",
              textDecoration: "underline",
            }}
            onClick={() => {
              let data = [];
              rowData.machine?.map((item) => {
                if (item.machineStatus === "Completed") {
                  data?.push(item);
                }
              });
              // console.log(data);
              setMachineDetailPage(
                <LineWiseMachineDetailDashboard
                  machineData={data}
                  close={closePopup}
                />
              );
              document.querySelector(
                ".lineWisePmMonthlyReport"
              ).style.pointerEvents = "none";

              // machineDetails(rowData.machine);
            }}
          >
            {rowData.total_completed}
          </button>
        );
      },
    },
    {
      title: "Pending",
      //   field: "",
      editable: "false",
      align: "center",
      render: (rowData) => {
        // console.log(rowData);
        return (
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#0A58CA",
              textDecoration: "underline",
            }}
            onClick={async () => {
              let data = [];
              rowData.machine?.map((item) =>
                // item.machineStatus !== "Completed" ? item.machineStatus !== "" ? item : undefined : undefined
                {
                  if (item.machineStatus !== "Completed") {
                    if (item.machineStatus !== "") {
                      data?.push(item);
                    }
                  }
                }
              );
              setMachineDetailPage(
                <LineWiseMachineDetailDashboard
                  machineData={data}
                  close={closePopup}
                />
              );
              document.querySelector(
                ".lineWisePmMonthlyReport"
              ).style.pointerEvents = "none";

              // machineDetails(rowData.machine);
            }}
          >
            {rowData.total_pmSchedule - rowData.total_completed}
          </button>
        );
      },
    },
  ];

  // console.log(tableData);
  const postSectionToGetAllDataForReport = async (
    selectedSection,
    lineData
  ) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          selectedYear,
          month: selectedMonth,
          selectedLine: lineData,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        // console.log(data.lineDataWithCounter);
        setTableData(data.lineDataWithCounter);
        setLineDropdown(data.lineData);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPlantToGetSectionDataBasedOnDashboardLevel = async () => {
    // setSubSection(undefined);
    // setSelectedLine("")
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

        postSectionToGetAllDataForReport(
          sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection] ||
            data?.sectionDataArray?.[0]
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };

  const actions = [
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => <button className="downloadPDF">PDF</button>,

      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event, rowData) => {
        pdfDownload(tableData);
      },
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => (
        <CSVLink
          data={csvData}
          filename={`${selectedMonth}_PM_Status(Machine)${timeStamp()}`}
          className="downloadCSV text-decoration-none"
          target="_blank"
        >
          CSV
        </CSVLink>
      ),

      tooltip: "CSV",
      isFreeAction: true,
      onClick: (event, rowData) => {},
    },
  ];

  const pdfDownload = () => {
    const doc = new jsPDF();
    doc.text(`${selectedMonth}. PM Status(Line)`, 15, 10);
    const columns = tableColumn.map((index) => index.title);
    const rows = [];
    tableData.map((item, index) =>
      rows.push([
        index + 1,
        item.line_names.line_name,
        item.total_current,
        item.total_Previous,
        item.total_completed,
        item.total_pmSchedule - item.total_completed,
        // item.PMStatus?.[selectedMonth] === "Completed" ? "0" : "X",
      ])
    );

    // let finalTable = [];

    // finalTable.push(rows);
    // console.log(rows);

    doc.autoTable(columns, rows);
    doc.save(`${selectedMonth}_PM_Status(Line)${timeStamp()}`);
  };

  const filterCSVDataToDownloadCSV = () => {
    const columns = tableColumn.map((index) => index.title);
    let totalPmSchedule = 0;
    let lastMonthPending = 0;
    let completed = 0;
    let pending = 0;
    const rows = [];
    rows.push(columns);

    tableData.map((item, index) => {
      totalPmSchedule = totalPmSchedule + item.total_pmSchedule;
      completed = completed + item.total_completed + item.total_done_with_delay;
      lastMonthPending = lastMonthPending + item.total_Previous;
      setStatusSum({
        ...statusSum,
        totalPmSchedule: totalPmSchedule,
        completedStatusSum: completed,
        lastMonthPendingStatusSum: lastMonthPending,
      });
      // setCurrentPlanSum(currentPlan);
      return rows.push([
        index + 1,
        item.line_names.line_name,
        item.total_current,
        item.total_Previous,
        item.total_completed,
        item.total_pmSchedule - item.total_completed,
      ]);
    });
    setCsvData(rows);
  };
  // console.log(statusSum);

  // const [refKey, setRefKey] = useState(0);

  // console.log(refKey);
  useEffect(() => {
    if (context.user_type === "Plant-Admin") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    } else {
      postSectionToGetAllDataForReport(context.section_data);
    }
    // setRefKey((refKey) => refKey + 1);
    // console.log(refKey);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // setTimeout(() => {
    if (tableData.length > 0) {
      filterCSVDataToDownloadCSV();
    }
    // }, 1000);
  }, [selectedMonth, tableData]);

  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [selectedYear]);

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
    setStatusSum({
      ...statusSum,
      totalPmSchedule: 0,
      completedStatusSum: 0,
      lastMonthPendingStatusSum: 0,
    });
    setTimeout(() => {
      setLoadingAnimationState(<NotFound />);
    }, 3000);
  }, [selectedYear, selectedMonth, selectedLine]);

  return (
    <>
      <div>
        {machineDetailPage}
        <div className="lineWisePmMonthlyReport">
          <Container fluid>
            <Row className="p-2 mt-3">
              <Col sm={12} lg={2} md={6} className="mb-2">
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col sm={12} lg={2} md={6} className="mb-2">
                <MonthDropDown
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                />
              </Col>
              {context?.user_type === "Plant-Admin" &&
              context?.tm_grade === "HOD" ? (
                <Col sm={12} lg={3} md={6} className="mb-2">
                  <span>
                    <b>Section:&nbsp; &nbsp;</b>
                  </span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "50%" }}
                    id="standard-select-currency"
                    name="selectedSectionOrSubSection"
                    className="textField"
                    value={selectedSectionOrSubSection}
                    onChange={(e) => {
                      setSelectedLine("");
                      setStatusSum({
                        ...statusSum,
                        totalPmSchedule: 0,
                        lastMonthPendingStatusSum: 0,
                        completedStatusSum: 0,
                        pendingStatusSum: 0,
                      });
                      setSelectedSectionOrSubSection(e.target.value);
                      postSectionToGetAllDataForReport(
                        sectionOrSubSectionDropdownList?.[e.target.value]
                      );
                      setLoadingAnimationState(<LoadingAnimation />);
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
                      return (
                        <option value={index}>{option?.section_name}</option>
                      );
                    })}
                  </select>
                </Col>
              ) : (
                ""
              )}
              <Col sm={12} lg={3} md={6} className="mb-2">
                <span>
                  <b>Line:&nbsp;&nbsp;</b>
                </span>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "50%" }}
                  id="standard-select-currency"
                  name="selectedPlant"
                  value={selectedLine}
                  className="textField"
                  onChange={async (e) => {
                    await setSelectedLine(e.target.value);
                    setStatusSum({
                      ...statusSum,
                      totalPmSchedule: 0,
                      lastMonthPendingStatusSum: 0,
                      completedStatusSum: 0,
                      pendingStatusSum: 0,
                    });
                    // postLineToGetMachineList(e.target.value);
                    postSectionToGetAllDataForReport(
                      sectionOrSubSectionDropdownList?.[
                        selectedSectionOrSubSection
                      ] || context.section_data,
                      e.target.value
                    );
                  }}
                  // fullWidth
                  select // label="Select"
                  autoComplete="off"
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {lineDropdown?.map((option) => {
                    return (
                      <option value={option._id}>{option.line_name}</option>
                    );
                  })}
                </select>
              </Col>
              <Col sm={12} lg={2} md={6}>
                <button
                  class="btn-primary1"
                  onClick={() => window.location.reload()}
                >
                  Reset
                </button>
              </Col>
            </Row>
          </Container>

          <div style={{ padding: "1rem" }}>
            <Container fluid>
              <Row>
                {tableData?.length > 0 ? (
                  <Col>
                    <MaterialTable
                      localization={{}}
                      actions={actions}
                      //   icons={tableIcons}
                      columns={tableColumn}
                      data={tableData}
                      // title="User Management"

                      editable={{}}
                      options={{
                        showTitle: false,
                        paging: false,
                        sorting: true,
                        search: true,
                        filtering: false,
                        exportButton: true,
                        exportAllData: true,
                        draggable: false,
                        actionsColumnIndex: -1,
                        pageSize: 10,
                        pageSizeOptions: false,
                        paginationType: "stepped",
                        addRowPosition: "first",
                        headerStyle: {
                          position: "sticky",
                          top: "0",
                          fontWeight: "bold",
                        },
                        maxBodyHeight: "70vh",
                        rowStyle: {
                          // fontStyle:'bold'

                          // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                          // color:"rgba(255,255,255,0.8)",
                          borderRadius: "5px",
                          border: "1px solid black",
                          WebkitBackdropFilter: "blur( 2px )",
                          borderBottom: "black !important",
                          background: "rgba(255,255,255,0.1)",
                          // backdropFilter: "blur(5px)",
                          // fontSize: "12px",
                        },

                        cellStyle: {
                          border: "1px solid black",
                        },
                        headerStyle: {
                          border: "1px solid black",
                          fontSize: "13px",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </Col>
                ) : (
                  <Col className="d-flex justify-content-around align-items-center pt-5">
                    {loadingAnimationState}
                  </Col>
                )}

                {statusSum?.totalPmSchedule ? (
                  <Col
                    lg={3}
                    className="cell m-2"
                    style={{
                      minHeight: "15rem",
                    }}
                  >
                    <LineWIsePmMonthlyGraph
                      selectedMonth={selectedMonth}
                      statusSum={statusSum}
                    />
                    {/* <Row className="pt-2 ">
                    <Col></Col>
                  </Row> */}
                  </Col>
                ) : (
                  <Col className="d-flex justify-content-around align-items-center pt-5">
                    {loadingAnimationState}
                  </Col>
                )}
              </Row>
            </Container>
          </div>
        </div>
        <br />
        <br />
        <br />
        <Footer />
      </div>
    </>
  );
};

export default LineWisePmMonthlyReport;
