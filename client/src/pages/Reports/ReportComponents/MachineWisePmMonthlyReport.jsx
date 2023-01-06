import React, { useState, useEffect, useContext } from "react";
import MaterialTable from "@material-table/core";
// import { ExportCsv, ExportPdf } from "@material-table/exporters";
import { jsPDF } from "jspdf";

import { CSVLink, CSVDownload } from "react-csv";
import { Row, Col, Container } from "react-bootstrap";

import { fontStyle } from "@mui/system";
import { Button } from "@mui/material";

import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import CloseIcon from "@mui/icons-material/Close";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import ClipLoader from "react-spinners/ClipLoader";

import RoutingContext from "../../../context/routing/RoutingContext";

import currentMonth from "../../Dashboard/DashboardComponent/currentMonth";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import MonthDropDown from "../../Dashboard/DashboardComponent/MonthDropDown";
import LoadingAnimation from "./LoadingAnimation";
import NotFound from "./NotFound";
import WorkOnSkipPM from "../../../Popups/WorkOnSkipPM";
import { Navigate, useNavigate } from "react-router-dom";
require("jspdf-autotable");

const MachineWisePmMonthlyReport = () => {
  const context = useContext(RoutingContext);

  const [tableData1, setTableData1] = useState();
  const navigate = useNavigate();

  // console.log(currentYear);

  const [csvDataForCurrentMonth, setCsvDataForCurrentMonth] = useState([]);
  const [csvDataForPreviousMonth, setCsvDataForPreviousMonth] = useState([]);

  const [statusCounter, setStatusCounter] = useState({
    schedulePm: 0,
    completed: 0,
    pending: 0,
    onGoing: 0,
  });

  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  let previousMonth =
    monthKeyArray[monthKeyArray.indexOf(selectedMonth) - 1] === undefined
      ? monthKeyArray.splice(-1)[0]
      : monthKeyArray[monthKeyArray.indexOf(selectedMonth) - 1];

  // console.log(selectedMonth, previousMonth);
  const tableColumn1 = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      // width: "10%",
    },
    {
      title: "Cell",
      render: (rowData) => rowData?.line_names.cell_names.cell_name,
      // field: "line_names.line_name",
      editable: "false",
      align: "center",
    },
    {
      title: "Line",
      // field: "line_names.line_name",
      render: (rowData) => rowData?.line_names.line_name,
      editable: "false",
      align: "center",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
    },

    {
      title: "PM Status",
      align: "center",
      field: "rowData.PMStatus?.[monthForCompareSystemMonth]",
      // width: "10%",
      render: (rowData) =>
        rowData?.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed" ? (
          <PanoramaFishEyeIcon fontSize="small" />
        ) : // : rowData?.checkSheet_data?.PMStatus?.[selectedMonth] === "Current Plan" ? (
        //   <PanoramaFishEyeIcon fontSize="small" />
        // )
        rowData?.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing" ? (
          <ArrowDropUpIcon />
        ) : (
          <CloseIcon />
        ),
      // console.log(rowData?.checkSheet_data?.PMStatus),
    },
  ];

  const tableColumn2 = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      // width: "10%",
    },
    {
      title: "Schedule Month",
      field: "schedule_month",
      align: "center",
    },
    {
      title: "Cell",
      // render: (rowData) => rowData?.line_names.cell_names.cell_name,
      field: "cell_name",
      editable: "false",
      align: "center",
    },
    {
      title: "Line",
      // render: (rowData) => rowData?.line_names.line_name,
      field: "line_name",
      editable: "false",
      align: "center",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
    },
    {
      title: "Completion Target Date",
      field: "completionTargetDate",
      align: "center",
    },

    {
      title: "PM Status",
      align: "center",
      field: "PMStatus",
      // width: "10%",
      // render: (rowData) =>
      //   rowData?.checkSheet_data?.PMStatus?.[previousMonth]
      //  === "Done with delay" ? (
      //   <PanoramaFishEyeIcon fontSize="small" />
      // ) : // : rowData?.checkSheet_data?.PMStatus?.[previousMonth] === "Current Plan" ? (
      // //   <PanoramaFishEyeIcon fontSize="small" />
      // // )
      // rowData?.checkSheet_data?.PMStatus?.[previousMonth] === "Ongoing" ? (
      //   <ArrowDropUpIcon />
      // ) : (
      //   // <CloseIcon />
      //   <CloseIcon />
      // ),
      // console.log(
      //   rowData.PMStatus ? rowData.PMStatus.monthForCompareSystemMonth : "ACD"
      // ),
    },
  ];

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

  const actionsForCurrentMonth = [
    {
      icon: () => <button className="btn">Details</button>,
      // (
      //   <a href="" style={{ fontWeight: "normal", fontSize: "16px" }}>
      //     Details
      //   </a>
      // ),
      tooltip: "click here for details",
      onClick: (event, selectedRow) => {
        navigate("/viewCheckSheet", {
          state: { selectedRowForViewForm: selectedRow },
        });
        // console.log(employeePassword)
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => <button className="downloadPDF">PDF</button>,

      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event, rowData) => {
        pdfDownloadForCurrentMonth();
      },
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => (
        <CSVLink
          data={csvDataForCurrentMonth}
          filename={`${selectedMonth}_PM_Status(Machine)${timeStamp()}`}
          className="downloadCSV"
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

  const actionsForPreviousMonth = [
    (rowData) => {
      return {
        hidden: rowData.PMStatus !== "PM Skip",

        icon: () => <button className="btn">Edit</button>,
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {
          // navigate("/viewCheckSheet", {
          //   state: { selectedRowForViewForm: selectedRow },
          // });
          // console.log(employeePassword)
        },
        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },
    (rowData) => {
      return {
        hidden: rowData.PMStatus === "PM Skip",

        icon: () => <button className="btn">Details</button>,
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {
          navigate("/viewCheckSheet", {
            state: { selectedRowForViewForm: selectedRow },
          });
          // console.log(employeePassword)
        },
        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => <button className="downloadPDF">PDF</button>,

      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event, rowData) => {
        pdfDownloadForPreviousMonth();
      },
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => (
        <CSVLink
          data={csvDataForPreviousMonth}
          filename={`${previousMonth}_PM_Status(Machine)${timeStamp()}`}
          className="downloadCSV"
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

  const pdfDownloadForCurrentMonth = () => {
    const doc = new jsPDF();
    doc.text(`${selectedMonth}. PM Status(Machine)`, 15, 10);
    const columns = tableColumn1.map((index) => index.title);
    const rows = [];
    tableData1?.machineDataForCurrentMonth.map((item, index) =>
      rows.push([
        index + 1,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing"
          ? "^"
          : "X",
      ])
    );

    // let finalTable = [];

    // finalTable.push(rows);
    console.log(rows);

    doc.autoTable(columns, rows);
    doc.save(`${selectedMonth}_PM_Status(Machine)${timeStamp()}`);
  };
  const pdfDownloadForPreviousMonth = () => {
    const doc = new jsPDF();
    doc.text(`${previousMonth}. PM Status(Machine)`, 15, 10);
    const columns = tableColumn2.map((index) => index.title);
    const rows = [];
    tableData1?.machineDataForPreviousMonth.map((item, index) =>
      rows.push([
        index + 1,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[previousMonth] === "Done with delay"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[previousMonth] === "Ongoing"
          ? "^"
          : // : item.checkSheet_data?.PMStatus?.[previousMonth],
            "X",
      ])
    );

    doc.autoTable(columns, rows);
    doc.save(`${previousMonth}_PM_Status(Machine)${timeStamp()}`);
  };

  const filterCSVDataToDownloadCSV = () => {
    const columns = tableColumn1.map((index) => index.title);
    let completedStatusCounter = 0;
    let schedulePM = 0;
    let onGoingPM = 0;
    const currentMonthRows = [];
    const previousMonthRows = [];
    currentMonthRows.push(columns);

    tableData1?.machineDataForCurrentMonth.map((item, index) => {
      // console.log(item.PMStatus);
      // console.log(item.checkSheet_data?.PMStatus?.[selectedMonth]);

      if (item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed") {
        completedStatusCounter++;
      } else if (
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing"
      ) {
        // console.log("kjhgcfgh");
        onGoingPM++;
      }
      // else {
      //   pendingStatusCounter++;
      // }

      if (item.checkSheet_data?.PMStatus?.[selectedMonth] !== "") {
        // console.log("kjhgcfgh");
        schedulePM++;
      }

      // let pendingStatusCounter = schedulePM;

      setStatusCounter({
        ...statusCounter,
        completed: completedStatusCounter,
        schedulePm: schedulePM,
        onGoing: onGoingPM,
        // pending: pendingStatusCounter,
      });

      return currentMonthRows.push([
        index + 1,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing"
          ? "^"
          : "X",
      ]);
    });

    tableData1?.machineDataForPreviousMonth.map((item, index) => {
      return previousMonthRows.push([
        index + 1,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[previousMonth] === "Completed"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[previousMonth] === "Ongoing"
          ? "^"
          : "X",
      ]);
    });
    setCsvDataForCurrentMonth(currentMonthRows);
    setCsvDataForPreviousMonth(previousMonthRows);
  };

  const postSectionAndMonthToGetAllDataForReport = async () => {
    // console.log(previousMonthForCompareSystemMonth);
    try {
      const res = await fetch("/postSectionAndMonthToGetAllDataForReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          currentMonth: selectedMonth,
          previousMonth: previousMonth,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log(data);
        setTableData1(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionAndMonthToGetAllDataForReport();
  }, [selectedYear, selectedMonth]);

  // console.log(statusCounter);
  useEffect(() => {
    // setTimeout(() => {
    if (
      tableData1?.machineDataForCurrentMonth.length > 0 ||
      tableData1?.machineDataForPreviousMonth.length > 0
    ) {
      filterCSVDataToDownloadCSV();
    }
    // }, 1000);
  }, [selectedMonth, tableData1]);

  // console.log(statusCounter);
  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [selectedYear]);

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);

    setTimeout(() => {
      setLoadingAnimationState(<NotFound />);
    }, 3000);
  }, [selectedYear, selectedMonth]);

  return (
    <>
      <div>
        <div>
          <Container fluid>
            <Row className="p-2">
              <Col sm={12} lg={3}>
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col sm={12} lg={3}>
                <MonthDropDown
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                />
              </Col>
            </Row>
          </Container>

          <div style={{ padding: "1rem" }}>
            <Container fluid>
              <Row>
                {tableData1?.machineDataForCurrentMonth?.length > 0 ? (
                  <Col lg={10}>
                    <MaterialTable
                      localization={
                        {
                          // toolbar: {
                          //   exportCSVName: "Export some Excel format",
                          //   exportPDFName: "Export as pdf!!"
                          // }
                        }
                      }
                      actions={actionsForCurrentMonth}
                      //   icons={tableIcons}
                      columns={tableColumn1}
                      data={tableData1?.machineDataForCurrentMonth}
                      title={selectedMonth}
                      // tableRef={this.tableRef.current.onQueryChange()}

                      editable={
                        {
                          // isDeleteHidden: (rowData) => rowData.user_type === 0,
                          // onRowUpdate: (updatedRow, oldRow) =>
                          //   new Promise((resolve, reject) => {
                          //     const index = oldRow.tableData.id;
                          //     const updatedRows = [...tableData];
                          //     updatedRows[index] = updatedRow;
                          //     //call the update user function and pass the user data
                          //     updateUserInfo(updatedRow);
                          //     setTimeout(() => {
                          //       setTableData(updatedRows);
                          //       resolve();
                          //     }, 500);
                          //     //refreshPage();
                          //   }),
                        }
                      }
                      options={{
                        // exportMenu: [
                        //   {
                        //     label: "Export PDF",
                        //     //// You can do whatever you wish in this function. We provide the
                        //     //// raw table columns and table data for you to modify, if needed.
                        //     // exportFunc: (cols, datas) => console.log({ cols, datas })
                        //     exportFunc: (cols, datas) => console.log(cols, tableData),
                        //     // ExportPdf(cols, datas, "myPdfFileName"),
                        //   },
                        //   {
                        //     label: "Export CSV",
                        //     exportFunc: (cols, datas) =>
                        //       ExportCsv(cols, datas, "myCsvFileName"),
                        //   },
                        // ],
                        showTitle: true,
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
                        maxBodyHeight: "40vh",
                        rowStyle: {
                          // fontStyle:'bold'

                          // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                          // color:"rgba(255,255,255,0.8)",
                          borderRadius: "5px",
                          border: "2px solid black",
                          WebkitBackdropFilter: "blur( 2px )",
                          background: "rgba(255,255,255,0.1)",
                          // backdropFilter: "blur(5px)",
                        },
                        cellStyle: {
                          border: "2px solid black",
                        },
                        headerStyle: {
                          border: "2px solid black",
                        },
                      }}
                    />
                  </Col>
                ) : (
                  <Col className="d-flex justify-content-around align-items-center pt-5">
                    {loadingAnimationState}
                  </Col>
                )}

                {statusCounter.schedulePm ? (
                  <Col
                    lg={2}

                    // className="profileImg"
                  >
                    <Row className="pt-2 ">
                      <Col style={{ backgroundColor: "white" }}>
                        <div style={{ textAlign: "center" }}>Month Status</div>
                        <br />
                        Schedule PM :{statusCounter.schedulePm}
                        <br />
                        Completed : {statusCounter.completed}
                        <br />
                        Pending :{" "}
                        {statusCounter.schedulePm -
                          statusCounter.completed -
                          statusCounter.onGoing}
                        {/* Pending : {statusCounter.pending} */}
                        <br />
                        Ongoing :{statusCounter.onGoing}
                        <br />
                      </Col>
                    </Row>
                    <Row className="pt-5 ">
                      <Col style={{ backgroundColor: "white" }}>
                        <PanoramaFishEyeIcon fontSize="small" /> Completed
                        <br />
                        <CloseIcon /> Pending
                        <br />
                        <ArrowDropUpIcon /> Ongoing
                      </Col>
                    </Row>
                    {/* <Container>
                    <Row>
                      <Col style={{ backgroundColor: "white" }}>ABCD</Col>
                      <Col style={{ backgroundColor: "white" }}>ABCD</Col>
                    </Row>{" "}
                    <Row>
                      <Col></Col>
                      <Col style={{ backgroundColor: "white" }}>ABCD</Col>
                    </Row>
                  </Container> */}
                  </Col>
                ) : (
                  <Col className="d-flex justify-content-around align-items-center pt-5">
                    {loadingAnimationState}
                  </Col>
                )}
              </Row>
              <Row>
                {tableData1?.skipMachineDataWithEveryMonth?.length > 0 ? (
                  <Col lg={10}>
                    <MaterialTable
                      localization={{}}
                      actions={actionsForPreviousMonth}
                      columns={tableColumn2}
                      data={tableData1?.skipMachineDataWithEveryMonth}
                      title={"Pending Machine"}
                      editable={{}}
                      options={{
                        showTitle: true,
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
                        maxBodyHeight: "40vh",

                        rowStyle: {
                          // fontStyle:'bold'

                          // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                          // color:"rgba(255,255,255,0.8)",
                          borderRadius: "5px",
                          border: "2px solid black",
                          WebkitBackdropFilter: "blur( 2px )",
                          background: "rgba(255,255,255,0.1)",
                          // backdropFilter: "blur(5px)",
                        },
                        cellStyle: {
                          border: "2px solid black",
                        },
                        headerStyle: {
                          border: "2px solid black",
                        },
                      }}
                    />
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
        {/* <CSVLink
          data={csvData}
          filename={`Monthly_PM_Status(Machine)${timeStamp()}`}
          className="btn btn-primary"
          target="_blank"
        >
          CSV
        </CSVLink> */}
        {/* <Button onClick={pdfDownload}>PDF</Button> */}
        {/* <div id="pdfStage">
          <table className="ar-table pmSheetApprovalTableCol">
            <thead className="mt-5">
              <tr className="ar-table-thead-header4">
                {columns.map((tColumn) => (
                  <th className={"ar-table-thead-header4 td-padding"}>
                    {tColumn.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((index, rowId) => (
                <tr className="ar-table-thead-header4 tableRowColor">
                  <td className="td-padding">{rowId + 1}</td>
                  <td className="td-padding">{index.line_names.line_name}</td>
                  <td className="td-padding">{index.machine_name}</td>
                  <td className="td-padding">{index.machine_code}</td>
                  <td className="td-padding">
                    {index.PMStatus?.[monthForCompareSystemMonth] ===
                    "Completed"
                      ? "0"
                      : "X"}
                  </td>
                  <td className="td-padding">
                    <a href="">click here for details</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}
        {/* <MaterialTable
          localization={
            {
              // toolbar: {
              //   exportCSVName: "Export some Excel format",
              //   exportPDFName: "Export as pdf!!"
              // }
            }
          }
          actions={actions}
          //   icons={tableIcons}
          columns={tableColumn}
          data={tableData}
          // title="User Management"
          // tableRef={this.tableRef.current.onQueryChange()}

          editable={
            {
              // isDeleteHidden: (rowData) => rowData.user_type === 0,
              // onRowUpdate: (updatedRow, oldRow) =>
              //   new Promise((resolve, reject) => {
              //     const index = oldRow.tableData.id;
              //     const updatedRows = [...tableData];
              //     updatedRows[index] = updatedRow;
              //     //call the update user function and pass the user data
              //     updateUserInfo(updatedRow);
              //     setTimeout(() => {
              //       setTableData(updatedRows);
              //       resolve();
              //     }, 500);
              //     //refreshPage();
              //   }),
            }
          }
          options={{
            // exportMenu: [
            //   {
            //     label: "Export PDF",
            //     //// You can do whatever you wish in this function. We provide the
            //     //// raw table columns and table data for you to modify, if needed.
            //     // exportFunc: (cols, datas) => console.log({ cols, datas })
            //     exportFunc: (cols, datas) => console.log(cols, tableData),
            //     // ExportPdf(cols, datas, "myPdfFileName"),
            //   },
            //   {
            //     label: "Export CSV",
            //     exportFunc: (cols, datas) =>
            //       ExportCsv(cols, datas, "myCsvFileName"),
            //   },
            // ],
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

              boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
              // color:"rgba(255,255,255,0.8)",
              borderRadius: "5px",
              border: "1px solid rgba(255,255,255)",
              WebkitBackdropFilter: "blur( 2px )",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(5px)",
            },
          }}
        /> */}
      </div>
    </>
  );
};

export default MachineWisePmMonthlyReport;
