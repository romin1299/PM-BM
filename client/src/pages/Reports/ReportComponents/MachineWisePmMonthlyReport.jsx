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
import TextField from "@material-ui/core/TextField";
import SkipApprovalComponent from "../SkipApprovalComponent";
import SkipPMWorkData from "../SkipPMWorkData";
import WorkOnSkipPM from "../../../Popups/WorkOnSkipPM";
import { Navigate, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";

import MachineWisePmMonthlyGraph from "./Graph/MachineWIsePmMonthlyGraph";

require("jspdf-autotable");

const MachineWisePmMonthlyReport = () => {
  const context = useContext(RoutingContext);

  const [tableData1, setTableData1] = useState();
  const navigate = useNavigate();

  // console.log(currentYear);

  const [csvDataForCurrentMonth, setCsvDataForCurrentMonth] = useState([]);
  const [csvDataForPreviousMonth, setCsvDataForPreviousMonth] = useState([]);

  const [skipApprovalStatusData, setSkipApprovalStatusData] = useState([]);

  //for approval
  const [HOSList, setHOSList] = useState([]);
  const [PRDHOSlist, setPRDHOSlist] = useState([]);
  const [MTDHODlist, setMTDHODlist] = useState([]);
  const [PRDHODlist, setPRDHODlist] = useState([]);

  const [statusCounter, setStatusCounter] = useState({
    schedulePm: 0,
    completed: 0,
    pending: 0,
    onGoing: 0,
  });

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const functionToSetRefKey = () => {
    setRefKey2((refKey2) => refKey2 + 1);
  };

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
      title: "Sr. no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
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
      title: "Sr. no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
      editable: "false",
    },
    {
      title: "Schedule Month",
      field: "schedule_month",
      align: "center",
      editable: "false",
      width: "5%",
    },
    {
      title: "Cell",
      // render: (rowData) => rowData?.line_names.cell_names.cell_name,
      field: "cell_name",
      editable: "false",
      align: "center",
      width: "15%",
    },
    {
      title: "Line",
      // render: (rowData) => rowData?.line_names.line_name,
      field: "line_name",
      editable: "false",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
      editable: "false",
      width: "15%",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
      editable: "false",
      // width: "15%",
    },
    {
      title: "Completion Target Date",
      field: "completionTargetDate",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="completionTargetDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
    },

    {
      title: "PM Status",
      align: "center",
      field: "PMStatus",
      editable: "false",
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
      icon: () => <button className="btn-reset">Details</button>,
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
          className="downloadCSV text-decoration-none"
          target="_blank"
        >
          CSV
        </CSVLink>
      ),

      tooltip: "CSV",
      isFreeAction: true,
      onClick: (event, rowData) => { },
    },
  ];

  const actionsForPreviousMonthForOpratorAndTL = [
    (rowData) => {
      return {
        hidden:
          rowData.PMStatus !== "PM Skip" ||
          context.user_type === "Section-Admin" ||
          rowData?.completionTargetDate === undefined ||
          (context.user_type === "TL/HOSS" && context.tm_department === "PRD"),

        icon: () => <button className="btn-reset">PM Edit</button>,
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {
          navigate("/skipedPMWorkData", {
            state: { selectedRowForSkipData: selectedRow },
          });
          // console.log(employeePassword)
        },
        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },
    (rowData) => {
      return {
        hidden: rowData.PMStatus === "PM Skip",

        icon: () => <button className="btn-reset">Details</button>,
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
          className="downloadCSV text-decoration-none"
          target="_blank"
        >
          CSV
        </CSVLink>
      ),

      tooltip: "CSV",
      isFreeAction: true,
      onClick: (event, rowData) => { },
    },
  ];

  const actionsForPreviousMonthForOtherUser = [
    (rowData) => {
      return {
        hidden: rowData.PMStatus === "PM Skip",

        icon: () => <button className="btn-reset">Details</button>,
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
          className="downloadCSV text-decoration-none"
          target="_blank"
        >
          CSV
        </CSVLink>
      ),

      tooltip: "CSV",
      isFreeAction: true,
      onClick: (event, rowData) => { },
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
    tableData1?.skipMachineDataWithEveryMonth.map((item, index) =>
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

    tableData1?.skipMachineDataWithEveryMonth.map((item, index) => {
      return previousMonthRows.push([
        index + 1,
        item.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[previousMonth] === "Done with delay"
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
    setLoadingAnimationState(<LoadingAnimation />);

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
        // console.log(data);
        setTableData1(data);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //add and update completion target date of skip data
  const updateCompletionTargetDateForSkipPM = async (updatedRow) => {
    // console.log(previousMonthForCompareSystemMonth);
    try {
      const res = await fetch("/updateCompletionTargetDateForSkipPM", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updatedRow,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setTableData1(data);
        setRefKey((refKey) => refKey + 1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getListForApproval = async () => {
    try {
      const res = await fetch("/getListForApproval", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data);
      setHOSList(data.HOSlist);
      setPRDHOSlist(data.PRDHOSlist);
      setMTDHODlist(data.MTDHODlist);
      setPRDHODlist(data.PRDHODlist);

      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  const validationSchema1 = yup.object({
    mtd_hod_list: yup.string().required("Please select MTD HOD"),
    mtd_hos_list: yup.string().required("Please select MTD HOS"),
    prd_hod_list: yup.string().required("Please select PRD HOD"),
    prd_hos_list: yup.string().required("Please select PRD HOS"),
    reasonForDelayOfTL: yup.string().required("Please enter reason for delay"),
  });

  const formik1 = useFormik({
    initialValues: {
      mtd_hod_list: {},
      mtd_hos_list: {},
      prd_hod_list: {},
      prd_hos_list: {},
      reasonForDelayOfTL: {},
    },
    validationSchema: validationSchema1,
    onSubmit: async (values) => {
      const res = await fetch("/sendRequestForApprovalOfSkipPMDataWork", {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mtd_hod_list: MTDHODlist[values.mtd_hod_list],
          mtd_hos_list: HOSList[values.mtd_hos_list],
          prd_hod_list: PRDHODlist[values.prd_hod_list],
          prd_hos_list: PRDHOSlist[values.prd_hos_list],
          reasonForDelayOfTL: values.reasonForDelayOfTL,
        }),
      });
      const data = await res.json();
      // console.log(data.getApprovalDataOfSkipPM);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else if (res.status === 409) {
        console.log("Machine code already exists!");
      } else {
        console.log("PM worked data save sucessfully...");
        setRefKey2((refKey2) => refKey2 + 1);
        // closeCheckSheet();
        // navigate("/");
        // clearState();
      }
    },
  });

  const getDataOfSkippedApprovalStatus = async () => {
    try {
      const res = await fetch("/getDataOfSkippedApprovalStatus", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data);

      setSkipApprovalStatusData(data.getApprovalDataOfSkipPM);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionAndMonthToGetAllDataForReport();
  }, [selectedYear, selectedMonth, refKey]);

  useEffect(() => {
    getListForApproval();
    getDataOfSkippedApprovalStatus();
  }, [refKey2]);

  // console.log(statusCounter);
  useEffect(() => {
    // setTimeout(() => {
    if (
      tableData1?.machineDataForCurrentMonth?.length > 0 ||
      tableData1?.skipMachineDataWithEveryMonth?.length > 0
    ) {
      filterCSVDataToDownloadCSV();
    }
    // }, 1000);
  }, [selectedMonth, tableData1]);

  // console.log(statusCounter);
  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [selectedYear]);

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
              <Row >
                {tableData1?.machineDataForCurrentMonth?.length > 0 ? (
                  <Col lg={10} >
                    <MaterialTable style={{ padding: "10px", marginTop: "10px" }}
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
                          border: "1px solid black",
                          WebkitBackdropFilter: "blur( 2px )",
                          background: "rgba(255,255,255,0.1)",
                          // backdropFilter: "blur(5px)",
                          fontSize: "13px",
                        },
                        cellStyle: {
                          border: "1px solid black",
                        },
                        headerStyle: {
                          fontSize: "13px",
                          fontWeight: "bold",
                          border: "1px solid black",
                        }

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
                    <Row style={{ padding: "10px" }} >
                      <Col style={{ backgroundColor: "white" }}>
                        <div style={{ textAlign: "center" }}><b>Month Status</b></div>
                        <br />
                        &nbsp; &nbsp; &nbsp; Schedule PM :
                        {statusCounter.schedulePm}
                        <br />
                        <PanoramaFishEyeIcon fontSize="small" /> Completed :{" "}
                        {statusCounter.completed}
                        <br />
                        <CloseIcon /> Pending :{" "}
                        {statusCounter.schedulePm -
                          statusCounter.completed -
                          statusCounter.onGoing}
                        {/* Pending : {statusCounter.pending} */}
                        <br />
                        <ArrowDropUpIcon /> Ongoing :{statusCounter.onGoing}
                        <br />
                      </Col>
                    </Row>

                    <Row style={{ padding: "10px" }} >
                      <Col style={{ backgroundColor: "white" }}>
                        <PanoramaFishEyeIcon fontSize="small" /> Completed
                        <br />
                        <CloseIcon /> Pending
                        <br />
                        <ArrowDropUpIcon /> Ongoing
                      </Col>
                    </Row> */}
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
              {tableData1?.skipMachineDataWithEveryMonth?.length > 0 ? (
                <div>
                  <Row>
                    <Col lg={10}>
                      <MaterialTable style={{ padding: "10px", marginTop: "10px" }}
                        localization={{}}
                        actions={actionsForPreviousMonthForOpratorAndTL}
                        columns={tableColumn2}
                        data={tableData1?.skipMachineDataWithEveryMonth}
                        title={"Pending Machine"}
                        editable={{
                          isEditHidden: (rowData) =>
                            rowData.PMStatus !== "PM Skip" ||
                            context.user_type === "Section-Admin" ||
                            context.user_type === "Plant-Admin" ||
                            context.user_type === "Operator" ||
                            (context.user_type === "TL/HOSS" &&
                              context.tm_department === "PRD"),
                          onRowUpdate: (updatedRow, oldRow) =>
                            new Promise((resolve, reject) => {
                              //call the update user function and pass the user data
                              updateCompletionTargetDateForSkipPM(updatedRow);
                              setTimeout(() => {
                                resolve();
                              }, 500);
                              //refreshPage();
                            }),
                        }}
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
                            border: "1px solid black",
                            WebkitBackdropFilter: "blur( 2px )",
                            borderBottom: "black !important",
                            background: "rgba(255,255,255,0.1)",
                            // backdropFilter: "blur(5px)",
                            fontSize: "12px"
                          },
                          cellStyle: {
                            border: "1px solid black",
                          },
                          headerStyle: {
                            border: "1px solid black",
                            fontSize: "13px",
                            fontWeight: "bold"
                          },

                        }}
                      />
                    </Col>
                  </Row>
                  {(skipApprovalStatusData.approvalStatusOfMTDHOS ===
                    undefined ||
                    skipApprovalStatusData.approvalStatusOfMTDHOS ===
                    "Rejected" ||
                    skipApprovalStatusData.approvalStatusOfMTDHOD ===
                    "Rejected" ||
                    skipApprovalStatusData.approvalStatusOfPRDHOS ===
                    "Rejected" ||
                    skipApprovalStatusData.approvalStatusOfPRDHOD ===
                    "Rejected" ||
                    skipApprovalStatusData.approvalStatusOfPRDHOD ===
                    "Accepted") &&
                    context.user_type === "TL/HOSS" &&
                    context.tm_department === "MTD" ? (
                    <div>
                      <Row>
                        <form
                          className="d-flex mt-2 p-3 border bg-white rounded"
                          onSubmit={formik1.handleSubmit} style={{margin:"0px"}}
                        >
                          <Col sm className="mb-3">
                            <span><b>MTD HOS :</b></span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="mtd_hos_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik1.values.mtd_hos_list?.tm_name}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  // console.log(e.target.value);
                                  formik1.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {HOSList?.map((index, idx) => {
                                  return (
                                    <option value={idx}>{index.tm_name}</option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    // float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik1.touched.mtd_hos_list &&
                                    formik1.errors.mtd_hos_list}
                                </p>
                              </div>
                            </div>
                          </Col>
                          <Col sm className="mb-3">
                            <span><b>MTD HOD :</b></span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="mtd_hod_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik1.values.mtd_hod_list?.tm_name}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik1.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {MTDHODlist?.map((index, idx) => {
                                  return (
                                    <option value={idx}>{index.tm_name}</option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    // float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik1.touched.mtd_hod_list &&
                                    formik1.errors.mtd_hod_list}
                                </p>
                              </div>
                            </div>
                          </Col>

                          <Col sm className="mb-3">
                            <span><b>PRD HOS :</b></span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="prd_hos_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik1.values.prd_hos_list?.tm_name}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik1.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {PRDHOSlist?.map((index, idx) => {
                                  return (
                                    <option value={idx}>{index.tm_name}</option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    // float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik1.touched.prd_hos_list &&
                                    formik1.errors.prd_hos_list}
                                </p>
                              </div>
                            </div>
                          </Col>
                          <Col sm className="mb-3">
                            <span><b>PRD HOD :</b></span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="prd_hod_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik1.values.prd_hod_list?.tm_name}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik1.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {PRDHODlist?.map((index, idx) => {
                                  return (
                                    <option value={idx}>{index.tm_name}</option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    // float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik1.touched.prd_hod_list &&
                                    formik1.errors.prd_hod_list}
                                </p>
                              </div>
                            </div>
                          </Col>
                          <Col>
                            <span><b>Reason for delay :</b></span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <TextField
                                fullWidth
                                id="reasonForDelayOfTL"
                                name="reasonForDelayOfTL"
                                onChange={(e) => {
                                  formik1.handleChange(e);
                                }}
                              />
                            </div>
                            <div>
                              <p
                                style={{
                                  color: "#F44336",
                                  fontWeight: "normal",
                                  fontSize: "0.80rem",
                                  // float: "left",
                                  paddingTop: "0.5rem",
                                }}
                              >
                                {formik1.touched.reasonForDelayOfTL &&
                                  formik1.errors.reasonForDelayOfTL}
                              </p>
                            </div>
                          </Col>
                          <Col className="d-flex justify-content-center align-items-center">
                            <button className="btn-approval" type="submit">
                              Send for Approval
                            </button>
                          </Col>
                        </form>
                      </Row>
                      <Row className="d-flex mt-2 p-3 border bg-white rounded" style={{margin:"0px"}}  >
                        <Col sm className="mb-3">
                          <span><b>MTD HOS :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData?.assignAndApprovedHOSlist
                                  ?.assignMTDHOSname
                              }
                            </div>
                            <div>
                              Status : &nbsp;
                              {skipApprovalStatusData?.approvalStatusOfMTDHOS}
                            </div>
                          </div>
                        </Col>
                        <Col sm className="mb-3">
                          <span><b>MTD HOD :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedMTDHODlist
                                  ?.assignMTDHODname
                              }
                            </div>
                            <div>
                              Status : &nbsp;
                              {skipApprovalStatusData?.approvalStatusOfMTDHOD}
                            </div>
                          </div>
                        </Col>

                        <Col sm className="mb-3">
                          <span><b>PRD HOS :</b></span>
                          <div>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedPRDHOSlist
                                  ?.assignPRDHOSname
                              }
                            </div>
                            <div>
                              Status :
                              {skipApprovalStatusData?.approvalStatusOfPRDHOS}
                            </div>
                          </div>
                        </Col>
                        <Col sm className="mb-3">
                          <span><b>PRD HOD :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedPRDHODlist
                                  ?.assignPRDHODname
                              }
                            </div>
                            <div>
                              Status : &nbsp;
                              {skipApprovalStatusData?.approvalStatusOfPRDHOD}
                            </div>
                          </div>
                        </Col>
                        <Col>
                          <div style={{ marginTop: "0.5rem" }}>
                            <span>Reason for delay :</span>
                            <TextField
                              fullWidth
                              id="reasonForDelayOfTL"
                              name="reasonForDelayOfTL"
                              value={skipApprovalStatusData?.reasonForDelayOfTL}
                            />
                          </div>

                          <div style={{ marginTop: "0.5rem" }}>
                            <span><b>Rejected remarks :</b></span>
                            <TextField
                              fullWidth
                              id="rejectedRemarksOfSkipPM"
                              name="rejectedRemarksOfSkipPM"
                              value={
                                skipApprovalStatusData?.rejectedRemarksOfSkipPMMachines
                              }
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <div>
                      <Row className="d-flex mt-2 p-3 border bg-white rounded" style={{ padding: "10px", margin: "0px" }} >
                        <Col sm className="mb-3">
                          <span><b>MTD HOS :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData?.assignAndApprovedHOSlist
                                  ?.assignMTDHOSname
                              }
                            </div>
                            <div>
                              Status :&nbsp;

                              <b>{skipApprovalStatusData?.approvalStatusOfMTDHOS}</b>
                            </div>
                          </div>
                        </Col>
                        <Col sm className="mb-3" >
                          <span ><b>MTD HOD :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedMTDHODlist?.assignMTDHODname
                              }
                            </div>
                            <div>
                              Status :&nbsp;
                              <b> {skipApprovalStatusData?.approvalStatusOfMTDHOD}</b>


                            </div>
                          </div>
                        </Col>

                        <Col sm className="mb-3">
                          <span><b>PRD HOS :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedPRDHOSlist?.assignPRDHOSname
                              }
                            </div>
                            <div>
                              Status :&nbsp;<b>{skipApprovalStatusData?.approvalStatusOfPRDHOS}</b>
                            </div>
                          </div>
                        </Col>
                        <Col sm className="mb-3">
                          <span><b>PRD HOD :</b></span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <div className="tablefont">
                              {
                                skipApprovalStatusData
                                  ?.assignAndApprovedPRDHODlist?.assignPRDHODname
                              }
                            </div>
                            <div >
                              Status : &nbsp;<b>{skipApprovalStatusData?.approvalStatusOfPRDHOD}</b>

                            </div>
                          </div>
                        </Col>
                        <Col>
                          <div>
                            <span><b>Reason for delay :</b></span>
                            <TextField
                              fullWidth
                              id="reasonForDelayOfTL"
                              name="reasonForDelayOfTL"
                              value={skipApprovalStatusData?.reasonForDelayOfTL}
                            />
                          </div>

                          <div>
                            <span><b>Rejected remarks :</b></span>
                            <TextField
                              fullWidth
                              id="rejectedRemarksOfSkipPM"
                              name="rejectedRemarksOfSkipPM"
                              value={
                                skipApprovalStatusData?.rejectedRemarksOfSkipPMMachines
                              }
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>

                  )}
                  {context.email ===
                    skipApprovalStatusData?.assignAndApprovedHOSlist
                      ?.assignMTDHOSemail &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOS ===
                    "Pending" ? (
                    <SkipApprovalComponent
                      skipApprovalStatusData={skipApprovalStatusData}
                      functionToSetRefKey={functionToSetRefKey}
                    />
                  ) : context.email ===
                    skipApprovalStatusData?.assignAndApprovedMTDHODlist
                      ?.assignMTDHODemail &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOS ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOD ===
                    "Pending" ? (
                    <SkipApprovalComponent
                      skipApprovalStatusData={skipApprovalStatusData}
                      functionToSetRefKey={functionToSetRefKey}
                    />
                  ) : context.email ===
                    skipApprovalStatusData?.assignAndApprovedPRDHOSlist
                      ?.assignPRDHOSemail &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOS ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOD ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfPRDHOS ===
                    "Pending" ? (
                    <SkipApprovalComponent
                      skipApprovalStatusData={skipApprovalStatusData}
                      functionToSetRefKey={functionToSetRefKey}
                    />
                  ) : context.email ===
                    skipApprovalStatusData?.assignAndApprovedPRDHODlist
                      ?.assignPRDHODemail &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOS ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfMTDHOD ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfPRDHOS ===
                    "Accepted" &&
                    skipApprovalStatusData?.approvalStatusOfPRDHOD ===
                    "Pending" ? (
                    <SkipApprovalComponent
                      skipApprovalStatusData={skipApprovalStatusData}
                      functionToSetRefKey={functionToSetRefKey}
                    />
                  ) : (
                    ""
                  )}
                </div>
              ) : (
                <Col className="d-flex justify-content-around align-items-center pt-5">
                  {loadingAnimationState}
                </Col>
              )}
            </Container>
          </div>
        </div>
      </div>
    </>
  );
};

export default MachineWisePmMonthlyReport;
