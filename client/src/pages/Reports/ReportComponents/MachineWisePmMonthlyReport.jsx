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
import moment from "moment";
import MachineWisePmMonthlyGraph from "./Graph/MachineWIsePmMonthlyGraph";
import Footer from "../../../components/Footer/Footer";
import { ButtonGroup } from "@mui/material";

require("jspdf-autotable");

const MachineWisePmMonthlyReport = () => {
  const context = useContext(RoutingContext);

  const navigate = useNavigate();

  const [tableData1, setTableData1] = useState();

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

  const [defaultSectionData, setDefaultSectionData] = useState({});

  // console.log(currentYear);

  const [csvDataForCurrentMonth, setCsvDataForCurrentMonth] = useState([]);
  const [csvDataForPendingMachine, setCsvDataForPendingMachine] = useState([]);

  // const [csvDataForPreviousMonth, setCsvDataForPreviousMonth] = useState([]);

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
  const [filter, setFilter] = useState("Counts");

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
      title: "Sr. No.",
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
      width: "15%",
    },
    {
      title: "Line",
      // field: "line_names.line_name",
      render: (rowData) => rowData?.line_names.line_name,
      editable: "false",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
      width: "15%",
    },

    {
      title: "PM Status",
      align: "center",
      field: "rowData.PMStatus?.[monthForCompareSystemMonth]",
      width: "5%",
      render: (rowData) =>
        rowData?.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed" ||
        rowData?.checkSheet_data?.PMStatus?.[selectedMonth] ===
          "Done with delay" ? (
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
    {
      title: "Completed Date",
      align: "center",
      render: (rowData) =>
        rowData?.checkSheet_data?.implemetation_completed_date?.[selectedMonth]
          ?.length > 0 &&
        moment(
          rowData?.checkSheet_data?.implemetation_completed_date?.[
            selectedMonth
          ],
          "D/M/YYYY - hh:mm A"
        ).format("DD-MM-YYYY THH:mm"),
    },
    {
      title: "Due Date",
      align: "center",
      width: "15%",
      render: (rowData) =>
        rowData?.checkSheet_data?.implementation_due_date?.[selectedMonth]
          ?.length > 0 &&
        moment(
          rowData?.checkSheet_data?.implementation_due_date?.[selectedMonth],
          "D/M/YYYY - hh:mm A"
        ).format("DD-MM-YYYY THH:mm"),
    },
  ];

  const tableColumn2 = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "6%",
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
      render: (rowData) => rowData?.line_names.cell_names.cell_name,
      // field: "cell_name",
      editable: "false",
      align: "center",
      width: "15%",
    },
    {
      title: "Line",
      render: (rowData) => rowData?.line_names.line_name,
      // field: "line_name",
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
      width: "5%",
      // render: (rowData) =>
      //   rowData?.PMStatus === "Done with delay" ? (
      //     <PanoramaFishEyeIcon fontSize="small" />
      //   ) : rowData?.PMStatus === "Ongoing" ? (
      //     <ArrowDropUpIcon />
      //   ) : (
      //     <CloseIcon />
      //   ),
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
          state: {
            selectedRowForViewForm: selectedRow,
            dashboardID: "FromMachineWisePMReportDashboard",
          },
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
      onClick: (event, rowData) => {},
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

        icon: () => <button className="btn-primary1">PM Edit</button>,
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {
          navigate("/pm/skipedPMWorkData", {
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
        hidden: !rowData.flagForPreviousMonthData,

        icon: () => <button className="btn-reset">Details</button>,
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {
          navigate("/viewCheckSheet", {
            state: {
              selectedRowForViewForm: selectedRow,
              dashboardID: "FromMachineWisePMReportDashboard",
            },
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
        pdfDownloadForPendingMachine();
      },
    },
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () => (
        <CSVLink
          data={csvDataForPendingMachine}
          filename={`${selectedMonth}_Pending_PM_Machine_${timeStamp()}`}
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
    // {
    //   // icon: () => <button className="addbutton">Add</button>,
    //   icon: () => <button className="downloadPDF">PDF</button>,

    //   tooltip: "PDF",
    //   isFreeAction: true,
    //   onClick: (event, rowData) => {
    //     pdfDownloadForPreviousMonth();
    //   },
    // },
    // {
    //   // icon: () => <button className="addbutton">Add</button>,
    //   icon: () => (
    //     <CSVLink
    //       data={csvDataForPreviousMonth}
    //       filename={`${previousMonth}_PM_Status(Machine)${timeStamp()}`}
    //       className="downloadCSV text-decoration-none"
    //       target="_blank"
    //     >
    //       CSV
    //     </CSVLink>
    //   ),

    //   tooltip: "CSV",
    //   isFreeAction: true,
    //   onClick: (event, rowData) => {},
    // },
  ];

  const pdfDownloadForCurrentMonth = () => {
    const doc = new jsPDF();
    doc.text(`${selectedMonth}. PM Status(Machine)`, 15, 10);
    const columns = tableColumn1.map((index) => index.title);
    const rows = [];
    tableData1?.machineDataForCurrentMonth.map((item, index) =>
      rows.push([
        index + 1,
        item?.line_names.cell_names.cell_name,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed" ||
        item?.checkSheet_data?.PMStatus?.[selectedMonth] === "Done with delay"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing"
          ? "^"
          : "X",
      ])
    );

    // let finalTable = [];

    // finalTable.push(rows);
    // console.log(rows);

    doc.autoTable(columns, rows);
    doc.save(`${selectedMonth}_PM_Status(Machine)${timeStamp()}`);
  };

  const pdfDownloadForPendingMachine = () => {
    const doc = new jsPDF();
    doc.text(`${selectedMonth}. Pending PM Machine`, 15, 10);
    const columns = tableColumn2.map((index) => index.title);
    const rows = [];
    tableData1?.skipMachineDataWithEveryMonth.map((item, index) =>
      rows.push([
        index + 1,
        item?.schedule_month,
        item?.line_names.cell_names.cell_name,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item?.completionTargetDate,
        item?.PMStatus === "Done with delay"
          ? "O"
          : item?.PMStatus === "Ongoing"
          ? "^"
          : "X",
      ])
    );

    // let finalTable = [];

    // finalTable.push(rows);
    // console.log(rows);

    doc.autoTable(columns, rows);
    doc.save(`${selectedMonth}_Pending_PM_Machine_${timeStamp()}`);
  };

  const filterCSVDataToDownloadCSV = () => {
    const columns = tableColumn1.map((index) => index.title);
    let completedStatusCounter = 0;
    let schedulePM = 0;
    let onGoingPM = 0;
    const currentMonthRows = [];
    // const previousMonthRows = [];
    currentMonthRows.push(columns);

    tableData1?.machineDataForCurrentMonth.map((item, index) => {
      // console.log(item.PMStatus);
      // console.log(item.checkSheet_data?.PMStatus?.[selectedMonth]);

      if (
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed" ||
        item?.checkSheet_data?.PMStatus?.[selectedMonth] === "Done with delay"
      ) {
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
      setLoadingAnimationState(<NotFound />);

      return currentMonthRows.push([
        index + 1,
        item?.line_names.cell_names.cell_name,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.checkSheet_data?.PMStatus?.[selectedMonth] === "Completed" ||
        item?.checkSheet_data?.PMStatus?.[selectedMonth] === "Done with delay"
          ? "O"
          : item.checkSheet_data?.PMStatus?.[selectedMonth] === "Ongoing"
          ? "^"
          : "X",
      ]);
    });

    // tableData1?.skipMachineDataWithEveryMonth.map((item, index) => {
    //   return previousMonthRows.push([
    //     index + 1,
    //     item.line_name,
    //     item.machine_name,
    //     item.machine_code,
    //     item.checkSheet_data?.PMStatus?.[previousMonth] === "Done with delay"
    //       ? "O"
    //       : item.checkSheet_data?.PMStatus?.[previousMonth] === "Ongoing"
    //       ? "^"
    //       : "X",
    //   ]);
    // });
    setCsvDataForCurrentMonth(currentMonthRows);
    // setCsvDataForPreviousMonth(previousMonthRows);
  };

  const filterCSVDataToDownloadCSVOfPendingMachine = () => {
    const columns = tableColumn2.map((index) => index.title);
    const pendingMachineRows = [];
    // const previousMonthRows = [];
    pendingMachineRows.push(columns);

    tableData1?.skipMachineDataWithEveryMonth.map((item, index) => {
      return pendingMachineRows.push([
        index + 1,
        item?.schedule_month,
        item?.line_names.cell_names.cell_name,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item?.completionTargetDate,
        item?.PMStatus === "Done with delay"
          ? "O"
          : item?.PMStatus === "Ongoing"
          ? "^"
          : "X",
      ]);
    });

    setCsvDataForPendingMachine(pendingMachineRows);
    // setCsvDataForPreviousMonth(previousMonthRows);
  };

  const postSectionAndMonthToGetAllDataForReport = async (sectionData) => {
    setTableData1();
    setLoadingAnimationState(<LoadingAnimation />);

    // console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
    try {
      const res = await fetch(
        `/postSectionAndMonthToGetAllDataForReport/?filter=${filter}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            currentMonth: selectedMonth,
            previousMonth: previousMonth,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("===================>", data);
        setTableData1(data);
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

  // console.log(context);
  const formik1 = useFormik({
    initialValues: {
      mtd_hod_list: "",
      mtd_hos_list: "",
      prd_hod_list: "",
      prd_hos_list: "",
      reasonForDelayOfTL: "",
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
          skipApprovalStatusData,
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

        window?.location?.reload();

        // closeCheckSheet();
        // navigate("/");
        // clearState();
      }
    },
  });

  // console.log("<<<<<<<<<<>>>>>>>>>>", skipApprovalStatusData);

  // const getDataOfSkippedApprovalStatus = async (sectionOrSubSectionData) => {
  //   try {
  //     const res = await fetch(
  //       `/getDataOfSkippedApprovalStatus/${sectionOrSubSectionData}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       }
  //     );

  //     const data = await res.json();
  //     // console.log(data);

  //     setSkipApprovalStatusData(data.getApprovalDataOfSkipPM);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const getDataOfSkippedApprovalStatus = async (sectionOrSubSectionData) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/getDataOfSkippedApprovalStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionOrSubSectionData,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("--------------->", data);

        setSkipApprovalStatusData(data.getApprovalDataOfSkipPM);
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

        getDataOfSkippedApprovalStatus(data?.sectionDataArray?.[0]);

        postSectionAndMonthToGetAllDataForReport(data?.sectionDataArray?.[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postAssignSubSectionToGetAllDataOfSubSection = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postAssignSubSectionToGetAllDataOfSubSection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("<<<<<<<<<<--------------->", data?.subSectionsData?.[0]);
        setSectionOrSubSectionDropdownList(data?.subSectionsData);

        getDataOfSkippedApprovalStatus(data?.subSectionsData?.[0]);

        postSectionAndMonthToGetAllDataForReport(data?.subSectionsData?.[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(
  //   "!!!!!!!!!!!!!!!!!!!!!!!",
  //   sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
  // );

  const postSectionToGetSectionInfo = async (sectionName) => {
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   493", sectionName);
    try {
      const res = await fetch("/postSectionToGetSectionInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: sectionName,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("-------------->", data?.sectionInfo);

        if (data?.sectionInfo?.dashboardLevel === "Yes") {
          // console.log("***************************", data?.sectionInfo);
          setDefaultSectionData(data?.sectionInfo);
          postSectionAndMonthToGetAllDataForReport(data?.sectionInfo);
          getDataOfSkippedApprovalStatus(data?.sectionInfo);
        } else {
          // console.log(
          //   "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
          //   context?.subSection_data?.[0]
          // );
          // postSectionAndMonthToGetAllDataForReport(data?.sectionInfo);
          // getDataOfSkippedApprovalStatus(data?.sectionInfo);

          postAssignSubSectionToGetAllDataOfSubSection();
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(context);

  useEffect(() => {
    if (
      context?.user_type !== "Plant-Admin" &&
      context?.tm_grade !== "HOD"
      // ||
      // (context?.user_type !== "Section-Admin" && context?.tm_grade !== "HOS")
    ) {
      postSectionToGetSectionInfo(context?.section_data);
    }
  }, [context?.section_data]);

  useEffect(() => {
    if (context?.user_type === "Plant-Admin" && context?.tm_grade === "HOD") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    } else if (
      context?.user_type === "Section-Admin" &&
      context?.tm_grade === "HOS"
    ) {
      postAssignSubSectionToGetAllDataOfSubSection();
    }
  }, []);

  useEffect(() => {
    postSectionAndMonthToGetAllDataForReport(
      sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection] ||
        context.section_data
    );
  }, [
    selectedSectionOrSubSection,
    selectedYear,
    selectedMonth,
    refKey,
    filter,
  ]);

  useEffect(() => {
    getListForApproval();
    getDataOfSkippedApprovalStatus();
  }, [refKey2]);

  // console.log(statusCounter);
  useEffect(() => {
    setStatusCounter({
      ...statusCounter,
      completed: 0,
      schedulePm: 0,
      onGoing: 0,
      // pending: pendingStatusCounter,
    });
    // setTimeout(() => {
    if (
      tableData1?.machineDataForCurrentMonth?.length > 0 ||
      tableData1?.skipMachineDataWithEveryMonth?.length > 0
    ) {
      filterCSVDataToDownloadCSV();
      filterCSVDataToDownloadCSVOfPendingMachine();
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
      <Container fluid>
        <Row className="p-2 mt-3">
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

          {context?.user_type === "Plant-Admin" &&
          context?.tm_grade === "HOD" ? (
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
                  setStatusCounter({
                    ...statusCounter,
                    schedulePm: 0,
                    completed: 0,
                    pending: 0,
                    onGoing: 0,
                  });
                  setSelectedSectionOrSubSection(e.target.value);

                  getDataOfSkippedApprovalStatus(
                    sectionOrSubSectionDropdownList?.[e.target.value]
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
                {sectionOrSubSectionDropdownList?.map((option, index) => {
                  return <option value={index}>{option?.section_name}</option>;
                })}
              </select>
            </Col>
          ) : (
            ""
          )}

          {/* {console.log(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@",
            sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              ?.dashboardLevel,
            selectedSectionOrSubSection
          )} */}

          {context?.user_type === "Section-Admin" &&
          context?.tm_grade === "HOS" &&
          sectionOrSubSectionDropdownList?.length > 0 ? (
            // (!sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
            //   ?.dashboardLevel ||
            //   !sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
            //     ?.dashboardLevel === "No")
            <Col sm={12} lg={3}>
              <span>
                <b>Sub Section:&nbsp; &nbsp;</b>
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
                  setStatusCounter({
                    ...statusCounter,
                    schedulePm: 0,
                    completed: 0,
                    pending: 0,
                    onGoing: 0,
                  });
                  setSelectedSectionOrSubSection(e.target.value);

                  getDataOfSkippedApprovalStatus(
                    sectionOrSubSectionDropdownList?.[e.target.value]
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
                {sectionOrSubSectionDropdownList?.map((option, index) => {
                  return (
                    <option value={index}>{option?.subSection_name}</option>
                  );
                })}
              </select>
            </Col>
          ) : (
            ""
          )}
        </Row>
      </Container>

      <div>
        <Container fluid>
          <Row
            className="gy-2 mt-2 cell"
            style={{
              marginRight: "0.2rem",
              marginLeft: "0.2rem",
              paddingBottom: "1rem",
            }}
          >
            <h5>
              <b>Month Status</b>
            </h5>
            <Col sm>
              {" "}
              <PanoramaFishEyeIcon fontSize="small" /> <b>Completed :</b>{" "}
              {statusCounter.completed}
            </Col>
            <Col sm>
              {" "}
              <b>Schedule PM :&nbsp;</b>
              {statusCounter.schedulePm}
            </Col>
            <Col sm>
              <CloseIcon />
              <b> Remaining ( Current Month ) : </b>{" "}
              {statusCounter.schedulePm -
                statusCounter.completed -
                statusCounter.onGoing}
              {/* Pending : {statusCounter.pending} */}
            </Col>
            <Col sm>
              <ArrowDropUpIcon />
              <b> Ongoing : &nbsp;</b>
              {statusCounter.onGoing}
            </Col>
          </Row>
          <Row className="d-flex">
            {tableData1?.machineDataForCurrentMonth?.length > 0 ? (
              <Col lg={8} md={12}>
                <MaterialTable
                  style={{ padding: "10px", marginTop: "10px" }}
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
                    maxBodyHeight: "45vh",
                    rowStyle: {
                      // fontStyle:'bold'

                      // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                      // color:"rgba(255,255,255,0.8)",
                      borderRadius: "5px",
                      border: "1px solid black",
                      WebkitBackdropFilter: "blur( 2px )",
                      background: "rgba(255,255,255,0.1)",
                      // backdropFilter: "blur(5px)",
                      // fontSize: "13px",
                    },
                    cellStyle: {
                      border: "1px solid black",
                    },
                    headerStyle: {
                      fontSize: "13px",
                      fontWeight: "bold",
                      border: "1px solid black",
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
                lg={4}
                md={12}

                // className="profileImg"
              >
                <Row
                  className="mt-2 cell"
                  style={{ marginRight: "0.2rem", marginLeft: "0.2rem" }}
                >
                  <Col className="d-flex p-1">
                    <div>
                      <b>Plan vs Actual</b>
                    </div>
                    <Col className="d-flex justify-content-end">
                      <ButtonGroup
                        size="small"
                        disableElevation
                        variant="outlined"
                        aria-label="outlined button group"
                      >
                        {["Counts", "Hours"]?.map((item, index) => (
                          <Button
                            key={index}
                            variant={filter === item ? "contained" : "outlined"}
                            value={item}
                            onClick={(event) => {
                              setFilter(event.target.value);
                            }}
                          >
                            {item}
                          </Button>
                        ))}
                      </ButtonGroup>
                    </Col>
                  </Col>
                  <MachineWisePmMonthlyGraph
                    statusCounter={
                      filter === "Hours"
                        ? tableData1?.GetAllPlanAndCompletedHours
                        : statusCounter
                    }
                    selectedMonth={selectedMonth}
                    filter={filter}
                  />
                </Row>

                {/* <Row style={{ padding: "10px" }}>
                      <Col style={{ backgroundColor: "white" }}>
                        <PanoramaFishEyeIcon fontSize="small" /> Completed
                        <br />
                        <CloseIcon /> Pending
                        <br />
                        <ArrowDropUpIcon /> Ongoing
                      </Col>
                    </Row>{" "} */}
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
                <Col lg={12}>
                  <MaterialTable
                    style={{ padding: "10px", marginTop: "35px" }}
                    localization={{}}
                    actions={actionsForPreviousMonthForOpratorAndTL}
                    columns={tableColumn2}
                    data={tableData1?.skipMachineDataWithEveryMonth}
                    title={"Pending Machine"}
                    editable={{
                      isEditHidden: (rowData) =>
                        rowData?.PMStatus !== "PM Skip" &&
                        (context?.user_type === "Section-Admin" ||
                          context?.user_type === "Plant-Admin" ||
                          context?.user_type === "Operator" ||
                          (context?.user_type === "TL/HOSS" &&
                            context?.tm_department === "PRD") ||
                          rowData?.flagForPreviousMonthData === true),
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
              </Row>
              {(skipApprovalStatusData?.approvalStatusOfMTDHOS === undefined ||
                skipApprovalStatusData?.approvalStatusOfMTDHOS === "Rejected" ||
                skipApprovalStatusData?.approvalStatusOfMTDHOD === "Rejected" ||
                skipApprovalStatusData?.approvalStatusOfPRDHOS === "Rejected" ||
                skipApprovalStatusData?.approvalStatusOfPRDHOD === "Rejected" ||
                skipApprovalStatusData?.approvalStatusOfPRDHOD ===
                  "Accepted") &&
              context.user_type === "TL/HOSS" &&
              context.tm_department === "MTD" ? (
                <div>
                  <form
                    className="d-flex mt-2 p-3 border bg-white rounded"
                    onSubmit={formik1.handleSubmit}
                    style={{ margin: "0px" }}
                  >
                    <Row className="w-100">
                      <Col lg={2} md={6} sm={12} className="mb-3">
                        <span>
                          <b>MTD HOS :</b>
                        </span>
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
                      <Col lg={2} md={6} sm={12} className="mb-3">
                        <span>
                          <b>MTD HOD :</b>
                        </span>
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

                      <Col lg={2} md={6} sm={12} className="mb-3">
                        <span>
                          <b>PRD HOS :</b>
                        </span>
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
                      <Col lg={2} md={6} sm={12} className="mb-3">
                        <span>
                          <b>PRD HOD :</b>
                        </span>
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
                      <Col lg={2} md={6} sm={12}>
                        <span>
                          <b>Reason for delay :</b>
                        </span>
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
                      <Col
                        lg={2}
                        md={6}
                        sm={12}
                        className="d-flex justify-content-start align-items-center"
                      >
                        <button className="btn-approval" type="submit">
                          Send for Approval
                        </button>
                      </Col>
                    </Row>
                  </form>

                  <Row
                    className="d-flex mt-2 p-3 border bg-white rounded"
                    style={{ margin: "0px" }}
                  >
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>MTD HOS :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
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
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>MTD HOD :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedMTDHODlist
                              ?.assignMTDHODname
                          }
                        </div>
                        <div>
                          Status : &nbsp;
                          {skipApprovalStatusData?.approvalStatusOfMTDHOD}
                        </div>
                      </div>
                    </Col>

                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>PRD HOS :</b>
                      </span>
                      <div>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedPRDHOSlist
                              ?.assignPRDHOSname
                          }
                        </div>
                        <div>
                          Status :
                          {skipApprovalStatusData?.approvalStatusOfPRDHOS}
                        </div>
                      </div>
                    </Col>
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>PRD HOD :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedPRDHODlist
                              ?.assignPRDHODname
                          }
                        </div>
                        <div>
                          Status : &nbsp;
                          {skipApprovalStatusData?.approvalStatusOfPRDHOD}
                        </div>
                      </div>
                    </Col>
                    <Col lg={2} md={6} sm={12}>
                      <div style={{ marginTop: "0.5rem" }}>
                        <span>
                          {" "}
                          <b>Reason for delay :</b>{" "}
                        </span>
                        <TextField
                          fullWidth
                          id="reasonForDelayOfTL"
                          name="reasonForDelayOfTL"
                          value={skipApprovalStatusData?.reasonForDelayOfTL}
                        />
                      </div>

                      <div style={{ marginTop: "0.5rem" }}>
                        <span>
                          <b>Rejected remarks :</b>
                        </span>
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
                  <Row
                    className="d-flex mt-2 p-3 mb-3 border bg-white rounded"
                    style={{ padding: "10px", margin: "0px" }}
                  >
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>MTD HOS :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedHOSlist
                              ?.assignMTDHOSname
                          }
                        </div>
                        <div>
                          Status :&nbsp;
                          <b>
                            {skipApprovalStatusData?.approvalStatusOfMTDHOS}
                          </b>
                        </div>
                      </div>
                    </Col>
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>MTD HOD :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedMTDHODlist
                              ?.assignMTDHODname
                          }
                        </div>
                        <div>
                          Status :&nbsp;
                          <b>
                            {" "}
                            {skipApprovalStatusData?.approvalStatusOfMTDHOD}
                          </b>
                        </div>
                      </div>
                    </Col>

                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>PRD HOS :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedPRDHOSlist
                              ?.assignPRDHOSname
                          }
                        </div>
                        <div>
                          Status :&nbsp;
                          <b>
                            {skipApprovalStatusData?.approvalStatusOfPRDHOS}
                          </b>
                        </div>
                      </div>
                    </Col>
                    <Col lg={2} md={6} sm={12} className="mb-3">
                      <span>
                        <b>PRD HOD :</b>
                      </span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <div>
                          {
                            skipApprovalStatusData?.assignAndApprovedPRDHODlist
                              ?.assignPRDHODname
                          }
                        </div>
                        <div>
                          Status : &nbsp;
                          <b>
                            {skipApprovalStatusData?.approvalStatusOfPRDHOD}
                          </b>
                        </div>
                      </div>
                    </Col>
                    <Col lg={2} md={6} sm={12}>
                      <div>
                        <span>
                          <b>Reason for delay :</b>
                        </span>
                        <TextField
                          fullWidth
                          id="reasonForDelayOfTL"
                          name="reasonForDelayOfTL"
                          value={skipApprovalStatusData?.reasonForDelayOfTL}
                        />
                      </div>

                      <div>
                        <span>
                          <b>Rejected remarks :</b>
                        </span>
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

              {/* {console.log(
                "____________________>",
                sectionOrSubSectionDropdownList,
                sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              )} */}
              {context.email ===
                skipApprovalStatusData?.assignAndApprovedHOSlist
                  ?.assignMTDHOSemail &&
              skipApprovalStatusData?.approvalStatusOfMTDHOS === "Pending" ? (
                <SkipApprovalComponent
                  selectedSectionOrSubSection={
                    sectionOrSubSectionDropdownList?.[
                      selectedSectionOrSubSection
                    ]
                      ? sectionOrSubSectionDropdownList?.[
                          selectedSectionOrSubSection
                        ]
                      : defaultSectionData
                  }
                  skipApprovalStatusData={skipApprovalStatusData}
                  functionToSetRefKey={functionToSetRefKey}
                />
              ) : context.email ===
                  skipApprovalStatusData?.assignAndApprovedMTDHODlist
                    ?.assignMTDHODemail &&
                skipApprovalStatusData?.approvalStatusOfMTDHOS === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfMTDHOD === "Pending" ? (
                <SkipApprovalComponent
                  selectedSectionOrSubSection={
                    sectionOrSubSectionDropdownList?.[
                      selectedSectionOrSubSection
                    ]
                      ? sectionOrSubSectionDropdownList?.[
                          selectedSectionOrSubSection
                        ]
                      : defaultSectionData
                  }
                  skipApprovalStatusData={skipApprovalStatusData}
                  functionToSetRefKey={functionToSetRefKey}
                />
              ) : context.email ===
                  skipApprovalStatusData?.assignAndApprovedPRDHOSlist
                    ?.assignPRDHOSemail &&
                skipApprovalStatusData?.approvalStatusOfMTDHOS === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfMTDHOD === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfPRDHOS === "Pending" ? (
                <SkipApprovalComponent
                  selectedSectionOrSubSection={
                    sectionOrSubSectionDropdownList?.[
                      selectedSectionOrSubSection
                    ]
                      ? sectionOrSubSectionDropdownList?.[
                          selectedSectionOrSubSection
                        ]
                      : defaultSectionData
                  }
                  skipApprovalStatusData={skipApprovalStatusData}
                  functionToSetRefKey={functionToSetRefKey}
                />
              ) : context.email ===
                  skipApprovalStatusData?.assignAndApprovedPRDHODlist
                    ?.assignPRDHODemail &&
                skipApprovalStatusData?.approvalStatusOfMTDHOS === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfMTDHOD === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfPRDHOS === "Accepted" &&
                skipApprovalStatusData?.approvalStatusOfPRDHOD === "Pending" ? (
                <SkipApprovalComponent
                  selectedSectionOrSubSection={
                    sectionOrSubSectionDropdownList?.[
                      selectedSectionOrSubSection
                    ]
                      ? sectionOrSubSectionDropdownList?.[
                          selectedSectionOrSubSection
                        ]
                      : defaultSectionData
                  }
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
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default MachineWisePmMonthlyReport;
