import { React, useEffect, useState } from "react";
import { useLocation } from "../../../modules/PageModules";
import { useFormik } from "formik";
import * as yup from "yup";
import Rows from "./row";
import "./index.css";
import {
  useContext,
  MaterialTable,
  tableIcons,
} from "../../../modules/PageModules";
import RoutingContext from "../../../context/routing/RoutingContext";
import TextField from "@material-ui/core/TextField";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SummeryPopups from "../../Operator/PopupsForChecksheet/SummeryPopups";
import axios from "axios";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import FileDownload from "js-file-download";

function CheckSheetForm() {
  const context = useContext(RoutingContext);

  const selectedMachineCheckSheetData = useLocation();

  const [newTableData, setNewTableData] = useState([]);
  const [refKey, setRefKey] = useState("");

  const [TLList, setTLList] = useState([]);
  const [HOSList, setHOSList] = useState([]);
  const [PRDTLlist, setPRDTLlist] = useState([]);
  const [stateForOpeningSummeryPopups, setStateForOpeningSummeryPopups] =
    useState("");

  const [dataSheetName, setDataSheetName] = useState([]);

  const navigate = useNavigate();

  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  console.log(selectedMachineCheckSheetData.state);

  const validationSchema = yup.object({
    request: yup.string().required("Please select one"),
    tl_list: yup.string().when(["request"], {
      is: () => formik.values.request === "Yes",
      then: yup.string().required("Please select one"),
    }),
    hos_list: yup.string().required("Please select one"),
  });
  const validationSchema1 = yup.object({
    prd_tl_list: yup.string().required("Please select one"),
  });

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
      // console.log(data)
      setTLList(data.MTDTLlist);
      setHOSList(data.HOSlist);
      setPRDTLlist(data.PRDTLlist);
      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  let machineAllData =
    selectedMachineCheckSheetData?.state?.selectedRowForViewForm;
  console.log(machineAllData);

  let phaseStatus =
    selectedMachineCheckSheetData?.state?.selectedRowForViewForm
      ?.checkSheet_data?.checksheet_status;

  let tableData =
    selectedMachineCheckSheetData?.state?.selectedRowForViewForm
      ?.checkSheet_data?.checkSheet;

  let varForConditionChecking =
    selectedMachineCheckSheetData?.state?.selectedRowForViewForm
      ?.checkSheet_data;

  let attempsOfMidYearChanges =
    selectedMachineCheckSheetData?.state?.displyingApprovalFormate;

  let columns = [
    {
      header: "SN",
      sort: "true",
    },
    {
      header: "C",
      sort: "true",
    },
    {
      header: "Inspection item",
      sort: "true",
    },
    {
      header: "Inspection point",
      sort: "true",
    },
    {
      header: "Judgement criteria",
      sort: "true",
    },
    {
      header: "Action",
      sort: "true",
    },
    {
      header: "Cycle",
      sort: "true",
    },
    {
      header: "Person in charge",
      sort: "true",
    },
    {
      header: "PM Time (min)",
      sort: "true",
    },
    {
      header: "",
      sort: "true",
    },
    {
      header: "Apr",
      sort: "true",
    },
    {
      header: "May",
      sort: "true",
    },
    {
      header: "June",
      sort: "true",
    },
    {
      header: "July",
      sort: "true",
    },
    {
      header: "Aug",
      sort: "true",
    },
    {
      header: "Sep",
      sort: "true",
    },
    {
      header: "Oct",
      sort: "true",
    },
    {
      header: "Nov",
      sort: "true",
    },
    {
      header: "Dec",
      sort: "true",
    },
    {
      header: "Jan",
      sort: "true",
    },
    {
      header: "Fab",
      sort: "true",
    },
    {
      header: "Mar",
      sort: "true",
    },
  ];

  const revisedColumns = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
      align: "center",
    },
    {
      title: "Revision contents",
      field: "revisionContent",
      filtering: false,
      align: "center",
    },
    {
      title: "Date",
      field: "revisionContentDate",
      filtering: false,
      align: "center",
    },
    {
      title: "Revised by",
      field: "revisedBy",
      filtering: false,
      align: "center",
      editable: "false",
    },
  ];

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

  let previousMonth =
    monthKeyArray[new Date().getMonth() - 1] === undefined
      ? monthKeyArray.splice(-1)[0]
      : monthKeyArray[new Date().getMonth() - 1];

  const PMCarryOnToNextMonth = async (tableRowId) => {
    // console.log(tableRowId);
    try {
      const res = await fetch("/PMCarryOnToNextMonth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_code: machineAllData.machine_code,
          monthForCompareSystemMonth,
          tableRowId,
          previousMonth,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || !data) {
        window.alert("Invalid");
      } else if (res.status === 422) {
        window.alert("Please fill all the details ");
        // refreshPage();
      } else {
        console.log("Data Added Successful");
        // functionToSetRefKey();
        // countCounter();
      }
    } catch (error) {
      console.log(error);
    }
  };

  function compareCycle(a, b) {
    // converting to uppercase to have case-insensitive comparison
    const name1 = a.cycle.toUpperCase();
    const name2 = b.cycle.toUpperCase();

    let comparison = 0;

    if (name1 > name2) {
      comparison = 1;
    } else if (name1 < name2) {
      comparison = -1;
    }
    return comparison;
  }

  let count = 0;
  // console.log(context);
  const getDataModelled = () => {
    let data = tableData?.sort(compareCycle);
    let newRowData = [];
    for (var i = 0; i < data?.length; i++) {
      let obj = data[i];
      // console.log(obj['planningTableAnimationArray2'])
      let newColData = [];
      for (let key in obj) {
        // console.log(key, "-", obj[key]);
        if (
          key === "_id" ||
          key === "planningTableAnimationArray" ||
          key === "planningTableAnimationArray2" ||
          key === "spareDetails" ||
          key === "abnormalityDetails" ||
          key === "start_month" ||
          key === "PMOkImage" ||
          key === "completionDateOfInspection" ||
          key === "reasonForDelayWhenSkip" ||
          key === "isAdded" ||
          key === "isEdited" ||
          key === "inspectionCompletionBy"
        ) {
          continue;
        }

        key === "tableRowId"
          ? newColData.push(
              new Object({
                key: key,
                value: obj[key],
                rowspan: 1,
                // colspan: 1,
                print: false,
              }),

              new Object({
                key: "rowId",
                value: i + 1,
                rowspan: 1,
                // colspan: 1,
                print: true,
              })
            )
          : key === "isDeleted"
          ? newColData.push(
              new Object({
                key: key,
                value: obj[key],
                rowspan: 1,
                // colspan: 1,
                print: false,
              })
            )
          : newColData.push(
              new Object({
                key: key,
                value: obj[key],
                rowspan: 1,
                // colspan: 1,
                print: true,
              })
            );
      }
      for (let key in obj) {
        // console.log(obj[key]);
        let tableRowId = obj["tableRowId"];
        let cycleOfPerticularRow = obj["cycle"];
        if (key === "planningTableAnimationArray2") {
          // if (obj["planningTableAnimationArray2"].Apr.length != 0) {
          // console.log("******checking")
          newColData.push(
            new Object({
              key: 1,
              value: "",
              rowspan: 1,
              // colspan: 1,
              print: true,
            })
          );
          // console.log(obj[key])
          for (let key1 in obj[key]) {
            // console.log(key1);

            if (key1 === "_id") {
              continue;
            }
            // if (
            //   key1 === monthKeyArray[new Date().getMonth() - 1] &&
            //   obj[key][key1].length < 2 &&
            //   obj[key][key1][0] === "1" &&
            //   cycleOfPerticularRow != "1/1M"
            // ) {
            //   PMCarryOnToNextMonth(tableRowId);
            // }
            // else if (
            //   key1 === monthKeyArray[new Date().getMonth() - 1] &&
            //   obj[key][key1].length < 2 &&
            //   obj[key][key1][0] === "1" &&
            //   cycleOfPerticularRow === "1/1M"
            // ) {
            //   PMCarryOnToNextMonth(tableRowId, cycleOfPerticularRow);
            // }
            // if (
            //   key1 === monthKeyArray[new Date().getMonth() - 1] &&
            //   obj[key][key1][0] === "2" &&
            //   obj[key][key1].length < 2 &&
            //   cycleOfPerticularRow != "1/1M"
            // ) {
            //   PMCarryOnToNextMonth(
            //     tableRowId,
            //     cycleOfPerticularRow,
            //     obj[key][key1][0]
            //   );
            // }
            // if (
            //   key1 === monthKeyArray[new Date().getMonth() - 1] &&
            //   (obj[key][key1][1] === "dummy" || obj[key][key1][1] === "delay")
            // ) {
            //   setDelayRemarks(1);
            // }
            newColData.push(
              new Object({
                key: key1,
                value: obj[key][key1],
                rowspan: 1,
                // colspan: 1,
                print: true,
              })
            );

            // console.log(obj[key][key1])

            // console.log(obj[key][0][key1])
          }
          // for (let i = 0; i < obj[key].length; i++) {
          //   // const element = obj[i];
          //   console.log(key);

          //   newColData.push(
          //     new Object({
          //       key: key,
          //       value: obj[key][i],
          //       rowspan: 1,
          //       colspan: 1,
          //       print: true,
          //     })
          //   );
          // }

          continue;
          // }
        }
      }

      newRowData.push(newColData);
    }
    // console.log(newRowData);
    getDataWithSpanCount(newRowData);
  };
  const getDataWithSpanCount = (myProps) => {
    console.log(myProps);
    for (let i = 1; i < myProps?.length; i++) {
      for (let j = 3; j < 4; j++) {
        for (
          let k = i - 1;
          k >= 0 && myProps?.[i][j].value == myProps?.[k][j].value;
          k--
        ) {
          myProps[k][j].rowspan = myProps?.[k][j].rowspan + 1;
          myProps[k + 1][j].print = false;
        }
      }
      for (let j = 10; j < 11; j++) {
        for (
          let k = i - 1;
          k >= 0 && myProps?.[i][j].value == myProps?.[k][j].value;
          k--
        ) {
          myProps[k][j].rowspan = myProps?.[k][j].rowspan + 1;
          myProps[k + 1][j].print = false;
        }
      }
    }
    // for (let i = 0; i < myProps.length; i++) {
    //   if (myProps[i][3].value === "") {
    //     myProps[i][2].colspan = myProps[i][2].colspan + 1;
    //     myProps[i][3].print = false;
    //   }
    //   // if (myProps[i][10].value === "") {
    //   //   myProps[i][10].rowspan = myProps[i][10].rowspan + 1;
    //   //   myProps[i][11].print = false;
    //   // }
    // }
    // console.log(myProps);
    setNewTableData(myProps);
  };

  // console.log(tableData);
  useEffect(() => {
    getDataModelled();
    // for (let i = 0; i < tableData.length; i++) {
    //   let output = "inspection_child_name" in tableData[i];

    //   // console.log(output);

    //   if (output === true) {
    //     setRefKey(true);
    //     break;
    //   }
    // }
  }, []);

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

  // console.log(
  //   selectedMachineCheckSheetData.state.selectedRowForViewForm?.line_names
  //     ?.line_name,
  //   selectedMachineCheckSheetData.state.selectedRowForViewForm?.line_names
  //     ?.cell_names?.cell_name
  // );

  // console.log(
  //   `Checksheet Preparation Approval (${selectedMachineCheckSheetData.state.selectedRowForViewForm?.line_names?.cell_names?.cell_name}/${selectedMachineCheckSheetData.state.selectedRowForViewForm?.line_names?.line_name}/${selectedMachineCheckSheetData.state.selectedRowForViewForm?.machine_code})`
  // );

  // console.log(context?.section_data);

  //for planning phase approval
  const formik1 = useFormik({
    initialValues: {
      prd_tl_list: "",
    },
    validationSchema: validationSchema1,
    onSubmit: async (values) => {
      const res = await fetch("/sendRequestForApproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phaseStatus,
          prd_tl_list: values.prd_tl_list,
          selected_machine_data:
            selectedMachineCheckSheetData.state.selectedRowForViewForm,
          planning_TL_date: timeStamp(),
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("Send request sucessfully...");
        navigate("/checkSheetDashboard");
        // if (values.email) {
        //   newPasswordLink(values.email);
        // }
      }
    },
  });

  //for preparation phase approval
  const formik = useFormik({
    initialValues: {
      request: "",
      tl_list: "",
      hos_list: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/sendRequestForApproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: values.request,
          tl_list: values.tl_list,
          hos_list: values.hos_list,
          selected_machine_data:
            selectedMachineCheckSheetData.state.selectedRowForViewForm,
          preparation_TL_date: timeStamp(),
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("Send request sucessfully...");
        navigate("/checkSheetDashboard");
        // refreshPage();
        // if (values.email) {
        //   newPasswordLink(values.email);
        // }
      }
    },
  });

  // console.log(formik.values.tl_list, formik.values.hos_list);
  const sendRequestForApprovalToPRDTL = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/sendRequestForApproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phaseStatus,
          prd_tl_list: formik.values.prd_tl_list,
          selected_machine_data:
            selectedMachineCheckSheetData.state.selectedRowForViewForm,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("Send request sucessfully...");
        navigate("/checkSheetDashboard");
        // if (values.email) {
        //   newPasswordLink(values.email);
        // }
      }
    } catch (error) {
      console.log(error);
    }
  };

  //upload tag name XLS and XLSX file
  const uploadDataSheet = async (e) => {
    e.preventDefault();

    // console.log(emp_name);
    const formData = new FormData();
    formData.append("data_sheet", dataSheetName);
    formData.append("machine_code", machineAllData.machine_code);
    formData.append(
      "yearOfCheckSheet",
      machineAllData?.checkSheet_data?.current_year
    );
    // console.log(formData);

    axios
      .post("/uploadDataSheetFile", formData)
      .then((res) => {
        if (res.status === 422) {
          window.alert("Please select file");
        }
        window.location.reload();
      })
      .catch((err) => {
        window.alert("Only .xls, .xlsx, .csv format allowed!");
        console.log(err);
      });
  };

  const downloadUploadedDataSheet = async () => {
    try {
      let selectedFileName = machineAllData?.checkSheet_data?.dataSheet;
      const res = await fetch("/postDataSheetFileName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFileName,
        }),
      });
      const data = await res.json();

      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("FileName Posted");
        // let fileName1 = selectedFileName.substring(14);
        // console.log(selectedFileName, "_________-", fileName1);
        axios({
          url: "/downloadDataSheetFile",
          method: "GET",
          responseType: "blob",
        }).then((res) => {
          FileDownload(res.data, selectedFileName);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListForApproval();
    // checkFieldExistsInPlanningPhase();
  }, []);

  const close = () => {
    setStateForOpeningSummeryPopups("");
    document.querySelector(
      ".checkSheetForImplementation1"
    ).style.pointerEvents = "auto";
  };

  const funForOpeningSummeryPopups = () => {
    setStateForOpeningSummeryPopups(
      <SummeryPopups close={close} tableData={tableData} />
    );
    document.querySelector(
      ".checkSheetForImplementation1"
    ).style.pointerEvents = "none";
  };

  // console.log(sendPlanningApproval)
  // console.log(
  //   selectedMachineCheckSheetData.state.selectedRowForViewForm
  //     .tl_approval_status
  // );
  return (
    <>
      {stateForOpeningSummeryPopups}
      <div className="checkSheetForImplementation1">
        <Container fluid>
          <Row>
            <Col lg={6} md={6} sm={6}>
              {/* <a style={{ color: "Black" }} href="/checkSheetDashboard"> */}
              <button
                className="mt-2"
                onClick={() => navigate("/checkSheetDashboard")}
                style={{
                  border: "none",
                  background: "white",
                  borderRadius: 5,
                }}
              >
                <ArrowBackIcon />
              </button>
              {/* </a> */}
            </Col>
            {tableData?.length > 0 ? (
              <Col lg={6} md={6} sm={6}>
                <Col>
                  <span style={{ fontWeight: "bold" }}>
                    Upload Data-sheet XLSx/CSV:
                  </span>
                  &nbsp;
                  <form
                    onSubmit={uploadDataSheet}
                    // method="post"
                    encType="multipart/form-data"
                  >
                    <input
                      type="file"
                      name="data_sheet"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      // value={userPhoto}
                      onChange={(e) => setDataSheetName(e.target.files[0])}
                    />
                    &nbsp;
                    <button type="submit" className="btn btn-primary1">
                      Upload
                    </button>
                  </form>
                </Col>
                <Col>
                  {machineAllData?.checkSheet_data?.dataSheet ? (
                    <div>
                      <button
                        className="btn-reset mt-4"
                        onClick={downloadUploadedDataSheet}
                      >
                        <SimCardDownloadIcon /> Download DATA-SHEET
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                </Col>
              </Col>
            ) : (
              ""
            )}
          </Row>
          {/* <div className="row">
            <div className=" mt-2 col-md-6 col-sm-6 col-lg-6"></div>
            <div className=" mt-2 col-md-6 col-sm-6 col-lg-6"></div>
          </div> */}
          <Row>
            <Col lg={6} md={6} sm={6}>
              {" "}
              <div>
                <div>
                  {tableData?.length > 0 ? (
                    phaseStatus === "Implementation" &&
                    attempsOfMidYearChanges === true ? (
                      <form onSubmit={formik.handleSubmit}>
                        <div className="row">
                          <div className="row mb-3 mt-3">
                            {" "}
                            <span>
                              Do you want to send request to TL/HOSS ? &nbsp;
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="Yes"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                Yes &nbsp;
                              </span>
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="No"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                No
                              </span>
                              <p
                                style={{
                                  color: "#F44336",
                                  fontWeight: "normal",
                                  fontSize: "0.80rem",
                                  float: "right",
                                  marginRight: "12rem",
                                  // paddingTop: "0.5rem",
                                }}
                              >
                                {formik.touched.request &&
                                  formik.errors.request}
                              </p>
                            </span>
                          </div>
                          <div className="col-4">
                            <span>MTD HOS List:</span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="hos_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik.values.hos_list}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {HOSList.map((index) => {
                                  return (
                                    <option value={index.email}>
                                      {index.tm_name}
                                    </option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik.touched.hos_list &&
                                    formik.errors.hos_list}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-4 ">
                            {formik.values.request === "Yes" ? (
                              <div>
                                <span>TL/HOSS List:</span>
                                <div style={{ marginTop: "0.5rem" }}>
                                  <select
                                    // class="form-select form-select-sm"
                                    // aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="tl_list"
                                    // className="textField"
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    value={formik.values.tl_list}
                                    onChange={(e) => {
                                      // setUsertype(e.target.value);
                                      formik.handleChange(e);
                                    }}
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {TLList.map((index) => {
                                      return (
                                        <option value={index.email}>
                                          {index.tm_name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <div>
                                    <p
                                      style={{
                                        color: "#F44336",
                                        fontWeight: "normal",
                                        fontSize: "0.80rem",
                                        float: "left",
                                        paddingTop: "0.5rem",
                                      }}
                                    >
                                      {formik.touched.tl_list &&
                                        formik.errors.tl_list}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>

                          <div className="col-4 d-flex align-items-center">
                            {selectedMachineCheckSheetData.state
                              ?.selectedRowForViewForm?.status === "Pending" ? (
                              ""
                            ) : (
                              <div>
                                <button type="submit" className="btn-primary1">
                                  Send Request
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </form>
                    ) : varForConditionChecking?.tl_approval_status[
                        varForConditionChecking?.tl_approval_status.length - 1
                      ] === "Pending" ||
                      varForConditionChecking.hos_approval_status[
                        varForConditionChecking.hos_approval_status.length - 1
                      ] === "Pending" ||
                      varForConditionChecking?.hos_approval_status[
                        varForConditionChecking?.hos_approval_status.length - 1
                      ] === "Accepted" ? (
                      ""
                    ) : varForConditionChecking?.tl_approval_status[
                        varForConditionChecking?.tl_approval_status.length - 1
                      ] === "Accepted" &&
                      varForConditionChecking?.hos_approval_status[
                        varForConditionChecking?.hos_approval_status.length - 1
                      ] === "Rejected" ? (
                      // varForConditionChecking.tl_approval_status[(varForConditionChecking.tl_approval_status).length - 1] === "Accepted" && varForConditionChecking.hos_approval_status[(varForConditionChecking.hos_approval_status).length - 1] === "Pending"
                      <form onSubmit={formik.handleSubmit}>
                        <div className="row">
                          <div className="row mb-3 mt-3">
                            {" "}
                            <span>
                              Do you want to send request to TL/HOSS ? &nbsp;
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="Yes"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                Yes &nbsp;
                              </span>
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="No"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                No
                              </span>
                              <p
                                style={{
                                  color: "#F44336",
                                  fontWeight: "normal",
                                  fontSize: "0.80rem",
                                  float: "right",
                                  marginRight: "12rem",
                                  // paddingTop: "0.5rem",
                                }}
                              >
                                {formik.touched.request &&
                                  formik.errors.request}
                              </p>
                            </span>
                          </div>
                          <div className="col-4">
                            <span>MTD HOS List:</span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="hos_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik.values.hos_list}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {HOSList.map((index) => {
                                  return (
                                    <option value={index.email}>
                                      {index.tm_name}
                                    </option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik.touched.hos_list &&
                                    formik.errors.hos_list}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-4 ">
                            {formik.values.request === "Yes" ? (
                              <div>
                                <span>TL/HOSS List:</span>
                                <div style={{ marginTop: "0.5rem" }}>
                                  <select
                                    // class="form-select form-select-sm"
                                    // aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="tl_list"
                                    // className="textField"
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    value={formik.values.tl_list}
                                    onChange={(e) => {
                                      // setUsertype(e.target.value);
                                      formik.handleChange(e);
                                    }}
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {TLList.map((index) => {
                                      return (
                                        <option value={index.email}>
                                          {index.tm_name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <div>
                                    <p
                                      style={{
                                        color: "#F44336",
                                        fontWeight: "normal",
                                        fontSize: "0.80rem",
                                        float: "left",
                                        paddingTop: "0.5rem",
                                      }}
                                    >
                                      {formik.touched.tl_list &&
                                        formik.errors.tl_list}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>

                          <div className="col-4 d-flex align-items-center">
                            {selectedMachineCheckSheetData.state
                              ?.selectedRowForViewForm?.status === "Pending" ? (
                              ""
                            ) : (
                              <div>
                                <button type="submit" className="btn">
                                  Send Request
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </form>
                    ) : varForConditionChecking?.tl_approval_status[
                        varForConditionChecking?.tl_approval_status.length - 1
                      ] === "Accepted" ? (
                      ""
                    ) : (
                      <form onSubmit={formik.handleSubmit}>
                        <div className="row">
                          <div className="row mb-3 mt-3">
                            {" "}
                            <span>
                              Do you want to send request to TL/HOSS ? &nbsp;
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="Yes"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                Yes &nbsp;
                              </span>
                              <input
                                type="radio"
                                name="request"
                                id="outlined-number"
                                value="No"
                                onChange={formik.handleChange}
                              />
                              <span
                                style={{
                                  paddingLeft: "0.5rem",
                                  fontWeight: "550",
                                  color: "black",
                                }}
                              >
                                No
                              </span>
                              <p
                                style={{
                                  color: "#F44336",
                                  fontWeight: "normal",
                                  fontSize: "0.80rem",
                                  float: "right",
                                  marginRight: "12rem",
                                  // paddingTop: "0.5rem",
                                }}
                              >
                                {formik.touched.request &&
                                  formik.errors.request}
                              </p>
                            </span>
                          </div>
                          <div className="col-4">
                            <span>MTD HOS List:</span>
                            <div style={{ marginTop: "0.5rem" }}>
                              <select
                                // class="form-select form-select-sm"
                                // aria-label=".form-select-sm example"
                                // style={{ width: "100%" }}
                                id="standard-select-currency"
                                name="hos_list"
                                // className="textField"
                                // fullWidth
                                select // label="Select"
                                autoComplete="off"
                                value={formik.values.hos_list}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik.handleChange(e);
                                }}
                                variant="standard"
                              >
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {HOSList.map((index) => {
                                  return (
                                    <option value={index.email}>
                                      {index.tm_name}
                                    </option>
                                  );
                                })}
                              </select>
                              <div>
                                <p
                                  style={{
                                    color: "#F44336",
                                    fontWeight: "normal",
                                    fontSize: "0.80rem",
                                    float: "left",
                                    paddingTop: "0.5rem",
                                  }}
                                >
                                  {formik.touched.hos_list &&
                                    formik.errors.hos_list}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-4 ">
                            {formik.values.request === "Yes" ? (
                              <div>
                                <span>TL/HOSS List:</span>
                                <div style={{ marginTop: "0.5rem" }}>
                                  <select
                                    // class="form-select form-select-sm"
                                    // aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="tl_list"
                                    // className="textField"
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    value={formik.values.tl_list}
                                    onChange={(e) => {
                                      // setUsertype(e.target.value);
                                      formik.handleChange(e);
                                    }}
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {TLList.map((index) => {
                                      return (
                                        <option value={index.email}>
                                          {index.tm_name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <div>
                                    <p
                                      style={{
                                        color: "#F44336",
                                        fontWeight: "normal",
                                        fontSize: "0.80rem",
                                        float: "left",
                                        paddingTop: "0.5rem",
                                      }}
                                    >
                                      {formik.touched.tl_list &&
                                        formik.errors.tl_list}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>

                          <div className="col-4 d-flex align-items-center">
                            {selectedMachineCheckSheetData.state
                              ?.selectedRowForViewForm?.status === "Pending" ? (
                              ""
                            ) : (
                              <div>
                                <button type="submit" className="btn-primary1">
                                  Send Request
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </form>
                    )
                  ) : (
                    ""
                  )}
                </div>

                {tableData?.length > 0 &&
                selectedMachineCheckSheetData.state?.planningApprovalShow ===
                  1 ? (
                  varForConditionChecking?.prd_tl_approval_status[
                    varForConditionChecking?.prd_tl_approval_status.length - 1
                  ] === "Pending" ||
                  phaseStatus === "Implementation" ||
                  phaseStatus === "Preparation" ||
                  phaseStatus === undefined ? (
                    ""
                  ) : (
                    <div>
                      <div>
                        <form
                          className="row mt-3 mb-3"
                          onSubmit={formik1.handleSubmit}
                        >
                          <div class="col-sm">
                            <span>PRD TL List:</span>
                            &nbsp;
                            <select
                              // class="form-select form-select-sm"
                              // aria-label=".form-select-sm example"
                              // style={{ width: "100%" }}
                              id="standard-select-currency"
                              name="prd_tl_list"
                              // className="textField"
                              fullWidth
                              select // label="Select"
                              autoComplete="off"
                              value={formik1.values.prd_tl_list}
                              onChange={(e) => {
                                // setUsertype(e.target.value);
                                console.log(e.target.value);
                                formik1.handleChange(e);
                              }}
                              variant="standard"
                            >
                              <option selected disabled value="">
                                Please select
                              </option>
                              {PRDTLlist.map((index) => {
                                return (
                                  <option value={index.email}>
                                    {index.tm_name}
                                  </option>
                                );
                              })}
                            </select>
                            <p
                              style={{
                                color: "#F44336",
                                fontWeight: "normal",
                                fontSize: "0.80rem",
                                float: "right",
                                paddingTop: "0.5rem",
                                marginRight: "2rem",
                              }}
                            >
                              {formik1.touched.prd_tl_list &&
                                formik1.errors.prd_tl_list}
                            </p>
                          </div>

                          <div className="col-sm">
                            <button
                              type="submit"
                              className="btn"
                              // onClick={sendRequestForApprovalToPRDTL}
                            >
                              Send Request
                            </button>
                          </div>
                        </form>
                        {/* </div> */}
                      </div>
                    </div>
                  )
                ) : (
                  ""
                )}
              </div>
            </Col>
            <Col lg={6} md={6} sm={6}>
              <table className="ar-table tableCol1">
                <thead>
                  <tr>
                    <th
                      className="ar-table-thead-header1"
                      // colSpan={2}
                      //  rowSpan={5}
                    >
                      PLAN ACCEPTANCE
                      <br />
                      (By PRD TL)
                    </th>
                    <th
                      className="ar-table-thead-header1"
                      // colSpan={2}
                      //  rowSpan={5}
                    >
                      PLAN PREPARED
                      <br />
                      (By MTD TL)
                    </th>
                  </tr>
                  <tr>
                    <th
                      className="approvalName"
                      // colSpan={2}
                      //  rowSpan={5}
                    >
                      {machineAllData?.checkSheet_data?.approved_by_PRD_TL[
                        machineAllData?.checkSheet_data?.approved_by_PRD_TL
                          .length - 1
                      ]
                        ? `${
                            machineAllData?.checkSheet_data?.approved_by_PRD_TL[
                              machineAllData?.checkSheet_data
                                ?.approved_by_PRD_TL.length - 1
                            ]
                          }`
                        : ""}
                    </th>
                    <th
                      className="approvalName"
                      // colSpan={2}
                      //  rowSpan={5}
                    >
                      {machineAllData?.checkSheet_data?.plan_prepared_tm_name[
                        machineAllData?.checkSheet_data?.plan_prepared_tm_name
                          .length - 1
                      ]
                        ? `${
                            machineAllData?.checkSheet_data
                              ?.plan_prepared_tm_name[
                              machineAllData?.checkSheet_data
                                ?.plan_prepared_tm_name.length - 1
                            ]
                          }`
                        : ""}
                    </th>
                  </tr>
                </thead>
              </table>
            </Col>
          </Row>
        </Container>
      </div>
      {machineAllData?.checkSheet_data?.checksheet_status === "Planning" ||
      machineAllData?.checkSheet_data?.checksheet_status ===
        "Implementation" ? (
        <div className="row mt-3">
          <div className="col-6"></div>
          <span className="col-6">
            <div className="row">
              <div className="col-6"></div>
              <div className="col-6" style={{ fontWeight: "bold" }}>
                Year: {machineAllData?.checkSheet_data?.current_year}{" "}
              </div>
            </div>
          </span>
        </div>
      ) : (
        ""
      )}

      <div>
        <Container fluid>
          <Row>
            <Col className="table-scrolling">
              <table className="ar-table tableCol">
                <thead>
                  <tr style={{ height: "2rem" }}>
                    <th
                      className="ar-table-thead-header2 headerPD"
                      colSpan={3}
                      rowSpan={5}
                    >
                      Line:- {machineAllData.line_names.line_name}
                      <br />
                      M/c No : {machineAllData.machine_code}
                    </th>
                    <th
                      className="ar-table-thead-header2 headerPD"
                      colSpan={2}
                      rowSpan={5}
                    >
                      Machine Name: {machineAllData.machine_name}
                    </th>
                    <th
                      className="ar-table-thead-header1 headerPD  align-items-center"
                      colSpan={2}
                      style={{ textAlign: "center" }}
                      // rowSpan={2}
                    >
                      Approved by
                      <br />
                      (MTD HOS)
                    </th>
                    <th
                      className="ar-table-thead-header1 headerPD"
                      colSpan={2}
                      style={{ textAlign: "center" }}
                      // rowSpan={2}
                    >
                      Prepared by
                      <br />
                      (MTD TL)
                    </th>
                    <th className="ar-table-thead-header1">
                      Checked & Verify by
                      <br />
                      (MTD TL)
                    </th>
                    {machineAllData?.checkSheet_data
                      ?.implementation_approved_by_MTD_TL
                      ? Object.values(
                          machineAllData?.checkSheet_data
                            ?.implementation_approved_by_MTD_TL
                        ).map((index) => (
                          <td className="ar-table-col1">
                            {index[index.length - 1]}
                          </td>
                        ))
                      : refArrayForTDMapping.map((index) => (
                          <td className="ar-table-col1"></td>
                        ))}
                  </tr>
                  <tr>
                    <th className="approvalName" colSpan={2} rowSpan={5}>
                      {machineAllData?.checkSheet_data?.approved_by_HOS[
                        machineAllData?.checkSheet_data?.approved_by_HOS
                          .length - 1
                      ]
                        ? machineAllData?.checkSheet_data?.approved_by_HOS[
                            machineAllData?.checkSheet_data?.approved_by_HOS
                              .length - 1
                          ]
                        : ""}
                      <br />

                      {machineAllData?.checkSheet_data?.approved_by_TL[
                        machineAllData?.checkSheet_data?.approved_by_TL.length -
                          1
                      ]
                        ? `,${
                            machineAllData?.checkSheet_data?.approved_by_TL[
                              machineAllData?.checkSheet_data?.approved_by_TL
                                .length - 1
                            ]
                          }`
                        : ""}
                    </th>
                    <th className="approvalName" colSpan={2} rowSpan={5}>
                      {machineAllData?.checkSheet_data?.sender_tm_name[
                        machineAllData?.checkSheet_data?.sender_tm_name.length -
                          1
                      ]
                        ? machineAllData?.checkSheet_data?.sender_tm_name[
                            machineAllData?.checkSheet_data?.sender_tm_name
                              .length - 1
                          ]
                        : ""}
                    </th>
                    <th className="ar-table-thead-header1">
                      Approved by
                      <br />
                      (MTD HOS)
                    </th>
                    {machineAllData?.checkSheet_data
                      ?.implementation_approved_by_MTD_HOS
                      ? Object.values(
                          machineAllData?.checkSheet_data
                            ?.implementation_approved_by_MTD_HOS
                        ).map((index) => (
                          <td className="ar-table-col1">
                            {index[index.length - 1]}
                          </td>
                        ))
                      : refArrayForTDMapping.map((index) => (
                          <td className="ar-table-col1"></td>
                        ))}
                  </tr>
                  <tr>
                    <th className="ar-table-thead-header1">
                      Approved by
                      <br />
                      (MTD HOD)
                    </th>
                    <td className="ar-table-col1" colSpan={6}>
                      {machineAllData?.checkSheet_data?.implementation_approved_by_MTD_HOD?.Sep?.at(
                        -1
                      )}
                    </td>
                    <td className="ar-table-col1" colSpan={6}>
                      {machineAllData?.checkSheet_data?.implementation_approved_by_MTD_HOD?.Mar?.at(
                        -1
                      )}
                    </td>
                  </tr>
                </thead>
                {/* <thead className="ar-table-thead1">
                  <tr>
                    {refArrayForTDMapping.map((index) => (
                      <td className="ar-table-col1"></td>
                    ))}
                  </tr>
                  <tr>
                    {refArrayForTDMapping.map((index) => (
                      <td className="ar-table-col1"></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ar-table-col1" colSpan={6}></td>
                    <td className="ar-table-col1" colSpan={6}></td>
                  </tr>
                </thead> */}
                <thead className="mt-5">
                  <tr>
                    {columns.map((tColumn) => (
                      <th
                        className={
                          tColumn.header === ""
                            ? "ar-table-thead-header3"
                            : "ar-table-thead-header"
                        }
                        // colSpan={
                        //   tColumn.header === "Inspection item"
                        //     ? refKey === true
                        //       ? 2
                        //       : 0
                        //     : 0
                        // }
                      >
                        {tColumn.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newTableData.map((rData) => (
                    <Rows
                      rData={rData}
                      isDeletedExists={
                        rData[10]?.["key"] === "isDeleted" &&
                        rData[10]?.["value"] === true
                          ? true
                          : false
                      }
                      checkSheet_status={
                        machineAllData?.checkSheet_data?.checksheet_status
                      }
                    />
                  ))}
                  <tr>
                    <th colSpan={9}></th>
                    <th className="ar-table-thead-header1">
                      Done By
                      <br />
                      (MTD TM's)
                    </th>
                    {machineAllData?.checkSheet_data?.PMworkedTMName
                      ? Object.values(
                          machineAllData?.checkSheet_data?.PMworkedTMName
                        ).map((index) => (
                          <td className="ar-table-col1">{index.join(" ,")}</td>
                        ))
                      : refArrayForTDMapping.map((index) => (
                          <td className="ar-table-col1"></td>
                        ))}
                  </tr>
                  <tr>
                    <th colSpan={9}></th>
                    <th className="ar-table-thead-header1">
                      Quality Check
                      <br />
                      (By PRD TL)
                    </th>
                    {machineAllData?.checkSheet_data
                      ?.implementation_approved_by_PRD_TL
                      ? Object.values(
                          machineAllData?.checkSheet_data
                            ?.implementation_approved_by_PRD_TL
                        ).map((index) => (
                          <td className="ar-table-col1">
                            {index[index.length - 1]}
                          </td>
                        ))
                      : refArrayForTDMapping.map((index) => (
                          <td className="ar-table-col1"></td>
                        ))}
                  </tr>
                  <tr>
                    <th colSpan={9}></th>
                    <th className="ar-table-thead-header1">
                      Revised Plan
                      <br />
                      Approved(MTD HOS)
                    </th>
                    {refArrayForTDMapping.map((index) => (
                      <td className="ar-table-col1"></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Col>
            {/* <Col lg={6} md={6} sm={6}>
              {phaseStatus === "Planning" ? (
                <div>
                  <div>
                    <table className="ar-table tableCol">
                      <thead className="ar-table-thead">
                        <tr
                        // className="ar-table-thead-row"
                        >
                          <th style={{ width: "5rem" }}></th>
                          {monthColumns.map((tColumn) => (
                            <th className="ar-table-thead-header">
                              {tColumn.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((index) => (
                          <tr
                          // className="ar-table-row"
                          >
                            <td></td>
                            {index.planningTableAnimationArray.map((index1) => {
                              if (index1 === "1") {
                                return <td className="ar-table-col">--></td>;
                              } else if (index1 === "0") {
                                return <td className="ar-table-col"></td>;
                              }
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {varForConditionChecking?.prd_tl_approval_status ===
                  "Pending" ? (
                    ""
                  ) : (
                    <div>
                      <form>
                        <div>
                          <span>PRD TL List:</span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <select
                              // class="form-select form-select-sm"
                              // aria-label=".form-select-sm example"
                              // style={{ width: "100%" }}
                              id="standard-select-currency"
                              name="prd_tl_list"
                              // className="textField"
                              // fullWidth
                              select // label="Select"
                              autoComplete="off"
                              value={formik.values.prd_tl_list}
                              onChange={(e) => {
                                // setUsertype(e.target.value);
                                console.log(e.target.value);
                                formik.handleChange(e);
                              }}
                              variant="standard"
                            >
                              <option selected disabled value="">
                                Please select
                              </option>
                              {PRDTLlist.map((index) => {
                                return (
                                  <option value={index.email}>
                                    {index.tm_name}
                                  </option>
                                );
                              })}
                            </select>
                            <div>
                              <p
                                style={{
                                  color: "#F44336",
                                  fontWeight: "normal",
                                  fontSize: "0.80rem",
                                  float: "left",
                                  paddingTop: "0.5rem",
                                }}
                              >
                                {formik.touched.user_type &&
                                  formik.errors.user_type}
                              </p>
                            </div>
                          </div>
                        </div>
                      </form>
                      <br />
                      <div>
                        <button
                          type="submit"
                          className="btn"
                          onClick={sendRequestForApprovalToPRDTL}
                        >
                          Send Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                console.log("not plannig")
              )}
            </Col> */}
          </Row>
          <Row>
            <Col>
              <div className="m-2 p-3 border bg-white rounded">
                <div>
                  <MaterialTable
                    localization={
                      {
                        // toolbar: {
                        //   exportCSVName: "Export some Excel format",
                        //   exportPDFName: "Export as pdf!!"
                        // }
                      }
                    }
                    icons={tableIcons}
                    columns={revisedColumns}
                    data={machineAllData?.checkSheet_data?.revisionContentData}
                    // title="User Management"
                    // tableRef={this.tableRef.current.onQueryChange()}

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

                        boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                        // color:"rgba(255,255,255,0.8)",
                        borderRadius: "5px",
                        border: "1px solid rgba(255,255,255)",
                        WebkitBackdropFilter: "blur( 2px )",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(5px)",
                      },
                    }}
                  />
                </div>
              </div>
            </Col>
            <Col>
              <div className="m-2 p-3 border bg-white rounded d-flex justify-content-center align-items-center">
                <button className="btn" onClick={funForOpeningSummeryPopups}>
                  Summary
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

export default CheckSheetForm;
