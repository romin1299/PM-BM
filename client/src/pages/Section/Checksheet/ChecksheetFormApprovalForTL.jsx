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
import Footer from "../../../components/Footer/Footer";
import EastIcon from "@mui/icons-material/East";
import { BASE_URL } from "../../../ConditionsForDNINandDNHA/ConditionBasedDisplay";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";

function ChecksheetFormApprovalForTL() {
  const context = useContext(RoutingContext);
  const selectedMachineCheckSheetData = useLocation();
  const [newTableData, setNewTableData] = useState([]);
  const [refKey, setRefKey] = useState("");
  const navigate = useNavigate();
  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const [stateForOpeningSummeryPopups, setStateForOpeningSummeryPopups] =
    useState("");

  const validationSchema = yup.object({
    request: yup.string().required("Please select one"),
    rejected_remarks: yup.string().when(["request"], {
      is: () => formik.values.request === "No",
      then: yup.string().required("Please enter remarks"),
    }),
  });

  let tableData =
    selectedMachineCheckSheetData.state?.selectedRowForViewForm?.checkSheet_data
      ?.checkSheet;
  // console.log(tableData);

  let machineAllData =
    selectedMachineCheckSheetData.state?.selectedRowForViewForm;

  let senderApprovalMonth =
    selectedMachineCheckSheetData.state?.selectedRowForViewForm
      ?.senderApprovalMonth;

  // console.log(senderApprovalMonth);
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
      header: "Feb",
      sort: "true",
    },
    {
      header: "Mar",
      sort: "true",
    },
  ];

  const revisedColumns = ["Sr. No.", "Revision contents", "Date", "Revised by"];

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
          machine_code: machineAllData?.machine_code,
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

  // console.log(context);
  const getDataModelled = () => {
    let data = tableData?.sort(compareCycle);
    let newRowData = [];
    for (var i = 0; i < data.length; i++) {
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
          key === "inspectionCompletionBy" ||
          key === "remarksCompulsoryOrNot"
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
    // console.log(myProps);
    for (let i = 1; i < myProps.length; i++) {
      for (let j = 3; j < 4; j++) {
        for (
          let k = i - 1;
          k >= 0 && myProps[i][j].value == myProps[k][j].value;
          k--
        ) {
          myProps[k][j].rowspan = myProps[k][j].rowspan + 1;
          myProps[k + 1][j].print = false;
        }
      }
      for (let j = 10; j < 11; j++) {
        for (
          let k = i - 1;
          k >= 0 && myProps[i][j].value == myProps[k][j].value;
          k--
        ) {
          myProps[k][j].rowspan = myProps[k][j].rowspan + 1;
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

    //   console.log(output);

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

  const formik = useFormik({
    initialValues: {
      request: "",
      rejected_remarks: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // console.log("________");
      const res = await fetch("/approveRequestFromTL_HOS_HOD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: values.request,
          rejected_remarks: values.rejected_remarks,
          selected_machine_data:
            selectedMachineCheckSheetData.state?.selectedRowForViewForm,
          approved_by_TL: context.tm_name,
          approved_by_PRD_TL: context.tm_name,
          preparation_TL_HOSS_date: timeStamp(),
          planning_PRD_TL_date: timeStamp(),
          implementation_approved_PRD_TL_date: timeStamp(),
          implementation_approved_by_PRD_TL: context.tm_name,
          implementation_approved_MTD_TL_date: timeStamp(),
          implementation_approved_by_MTD_TL: context.tm_name,
          implemetation_quality_remarks: values.qaulity_remarks,
          senderApprovalMonth,
          selectedYear: selectedMachineCheckSheetData?.state?.selectedYear
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("User added sucessfully...");
        machineAllData?.checkSheet_data?.checksheet_status === "Implementation"
          ? navigate("/pm/implementationApproval")
          : machineAllData?.checkSheet_data?.checksheet_status === "Preparation"
          ? navigate("/pm/preparationApproval")
          : navigate("/pm/planningApproval");
      }
    },
  });

  const close = () => {
    setStateForOpeningSummeryPopups("");
    document.querySelector(
      ".checkSheetForImplementation1"
    ).style.pointerEvents = "auto";
  };

  const funForOpeningSummeryPopups = () => {
    setStateForOpeningSummeryPopups(
      <SummeryPopups
        close={close}
        tableData={tableData}
        machineData={machineAllData}
      />
    );
    document.querySelector(
      ".checkSheetForImplementation1"
    ).style.pointerEvents = "none";
  };

  // const approveRequestFromTL = async () => {
  //   // setSubSection(undefined);
  //   try {
  //     const res = await fetch("/approveRequestFromTL", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         request: formik.values.request,
  //         rejected_remarks: formik.values.rejected_remarks,
  //         selected_machine_data:
  //           selectedMachineCheckSheetData.state.selectedRowForViewForm,
  //       }),
  //     });
  //     const data = await res.json();
  //     if (res.status === 400 || res.status === 422 || !data) {
  //       window.alert("Invalid credentials !");
  //     } else {
  //       console.log("approve request sucessfully...");
  //       navigate("/approvalDashboard");
  //       // if (values.email) {
  //       //   newPasswordLink(values.email);
  //       // }
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // console.log(selectedMachineCheckSheetData.state.selectedRowForViewForm);
  console.log(machineAllData?.checkSheet_data?.checksheet_status);
  return (
    <>
      {stateForOpeningSummeryPopups}

      <div className="checkSheetForImplementation1">
        <Container fluid>
          <Row className="d-flex justify-content-center align-items-center">
            <Col lg={6} md={6} sm={6}>
              <div className="col-1">
                <button
                  onClick={() => {
                    machineAllData?.checkSheet_data?.checksheet_status ===
                    "Implementation"
                      ? navigate("/pm/implementationApproval")
                      : machineAllData?.checkSheet_data?.checksheet_status ===
                        "Preparation"
                      ? navigate("/pm/preparationApproval")
                      : navigate("/pm/planningApproval");

                    // console.log(
                    //   selectedMachineCheckSheetData?.state?.dashboardID
                    // );

                    // if (
                    //   selectedMachineCheckSheetData?.state?.dashboardID ===
                    //   "FromPlanningApprovalDashboard"
                    // ) {
                    //   navigate("/planningApproval");
                    // } else if (
                    //   selectedMachineCheckSheetData?.state?.dashboardID ===
                    //   "FromPreparationApprovalDashboard"
                    // ) {
                    //   navigate("/checksheetCreationDashboardForMTDTLandHOS");
                    // }
                  }}
                  style={{
                    border: "none",
                    background: "white",
                    borderRadius: 5,
                    marginTop: "1rem",
                  }}
                >
                  <ArrowBackIcon />
                </button>
              </div>
              <div>
                <form onSubmit={formik.handleSubmit}>
                  <div className="row">
                    {machineAllData?.checkSheet_data?.checksheet_status ===
                      "Implementation" && context.tm_department === "PRD" ? (
                      <>
                        <div className="row mb-3 mt-3">
                          <span>
                            Machine quality conformation. &nbsp;
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
                              {formik.touched.request && formik.errors.request}
                            </p>
                          </span>
                        </div>
                        {formik.values.request === "Yes" ? (
                          <div className="col-6">
                            <span>Quality Remarks: </span>
                            <TextField
                              // id="outlined-number"
                              name="qaulity_remarks"
                              className="ApproveOrdRejectTextField"
                              value={formik.values.qaulity_remarks}
                              onChange={formik.handleChange}
                              autoComplete="off"
                              // label="Number"
                              fullWidth
                              type="text"
                            />
                            <br />
                            <p style={{ paddingTop: "0.5rem" }}></p>
                          </div>
                        ) : (
                          ""
                        )}
                      </>
                    ) : (
                      <div className="row mb-3 mt-3">
                        <span>
                          Kindly approve checkSheet. &nbsp;
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
                            {formik.touched.request && formik.errors.request}
                          </p>
                        </span>
                      </div>
                    )}

                    {formik.values.request === "No" ? (
                      <div className="col-6">
                        <span>Remarks: </span>
                        <TextField
                          // id="outlined-number"
                          name="rejected_remarks"
                          className="ApproveOrdRejectTextField"
                          value={formik.values.rejected_remarks}
                          onChange={formik.handleChange}
                          autoComplete="off"
                          // label="Number"
                          fullWidth
                          type="text"
                        />
                        <br />
                        <p
                          style={{
                            color: "#F44336",
                            fontWeight: "normal",
                            fontSize: "0.80rem",
                            float: "left",
                            paddingTop: "0.5rem",
                          }}
                        >
                          {formik.touched.rejected_remarks &&
                            formik.errors.rejected_remarks}
                        </p>
                      </div>
                    ) : (
                      ""
                    )}
                    <div className="col-6 d-flex align-items-center">
                      <button type="submit" className="btn-primary1">
                        Submit
                      </button>
                    </div>
                    {machineAllData?.checkSheet_data?.dataSheet ? (
                      <div className="col">
                        <a
                          href={`${process.env.REACT_APP_BASE_URL}/${machineAllData?.checkSheet_data?.dataSheet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="btn-reset" type="button">
                            <SimCardDownloadIcon /> Download DATA-SHEET
                          </button>
                        </a>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </form>
              </div>
            </Col>
            <Col lg={6} md={6} sm={6}>
              <table className="ar-table tableCol1 h-50">
                <thead>
                  <tr>
                    <th
                      className="ar-table-thead-header1 "
                      // colSpan={2}
                      //  rowSpan={5}
                      style={{ textAlign: "center" }}
                    >
                      PLAN ACCEPTANCE
                      <br />
                      (By PRD TL)
                    </th>
                    <th
                      className="ar-table-thead-header1"
                      // colSpan={2}
                      //  rowSpan={5}
                      style={{ textAlign: "center" }}
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
                      {machineAllData?.checkSheet_data?.approved_by_PRD_TL?.[
                        machineAllData?.checkSheet_data?.approved_by_PRD_TL
                          ?.length - 1
                      ]
                        ? `${
                            machineAllData?.checkSheet_data
                              ?.approved_by_PRD_TL?.[
                              machineAllData?.checkSheet_data
                                ?.approved_by_PRD_TL?.length - 1
                            ]
                          }`
                        : ""}
                    </th>
                    <th
                      className="approvalName"
                      // colSpan={2}
                      //  rowSpan={5}
                    >
                      {machineAllData?.checkSheet_data?.plan_prepared_tm_name?.[
                        machineAllData?.checkSheet_data?.plan_prepared_tm_name
                          ?.length - 1
                      ]
                        ? `${
                            machineAllData?.checkSheet_data
                              ?.plan_prepared_tm_name?.[
                              machineAllData?.checkSheet_data
                                ?.plan_prepared_tm_name?.length - 1
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
                    Line:- {machineAllData?.line_names?.line_name}
                    <br />
                    M/c No : {machineAllData?.machine_code}
                  </th>
                  <th
                    className="ar-table-thead-header2 headerPD"
                    colSpan={2}
                    rowSpan={5}
                  >
                    Machine Name: {machineAllData?.machine_name}
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
                    {machineAllData?.checkSheet_data?.approved_by_HOS?.[
                      machineAllData?.checkSheet_data?.approved_by_HOS?.length -
                        1
                    ]
                      ? machineAllData?.checkSheet_data?.approved_by_HOS?.[
                          machineAllData?.checkSheet_data?.approved_by_HOS
                            ?.length - 1
                        ]
                      : ""}
                    <br />

                    {machineAllData?.checkSheet_data?.approved_by_TL?.[
                      machineAllData?.checkSheet_data?.approved_by_TL?.length -
                        1
                    ]
                      ? `,${
                          machineAllData?.checkSheet_data?.approved_by_TL?.[
                            machineAllData?.checkSheet_data?.approved_by_TL
                              ?.length - 1
                          ]
                        }`
                      : ""}
                  </th>
                  <th className="approvalName" colSpan={2} rowSpan={5}>
                    {machineAllData?.checkSheet_data?.sender_tm_name?.[
                      machineAllData?.checkSheet_data?.sender_tm_name?.length -
                        1
                    ]
                      ? machineAllData?.checkSheet_data?.sender_tm_name?.[
                          machineAllData?.checkSheet_data?.sender_tm_name
                            ?.length - 1
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
                    {
                      machineAllData?.checkSheet_data
                        ?.implementation_approved_by_MTD_HOD?.Sep?.[
                        machineAllData?.checkSheet_data
                          ?.implementation_approved_by_MTD_HOD?.Sep?.length - 1
                      ]
                    }
                  </td>
                  <td className="ar-table-col1" colSpan={6}>
                    {
                      machineAllData?.checkSheet_data
                        ?.implementation_approved_by_MTD_HOD?.Mar?.[
                        machineAllData?.checkSheet_data
                          ?.implementation_approved_by_MTD_HOD?.Mar?.length - 1
                      ]
                    }
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
                      colSpan={
                        tColumn.header === "Inspection item"
                          ? refKey === true
                            ? 2
                            : 0
                          : 0
                      }
                    >
                      {tColumn.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newTableData?.map((rData) => (
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
                      )?.map((index) => (
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
                  {varForConditionChecking.prd_tl_approval_status ===
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
              <table style={{ width: "40vw" }}>
                {revisedColumns?.map((item) => (
                  <th className="td-padding">{item}</th>
                ))}

                {machineAllData?.checkSheet_data?.revisionContentData?.map(
                  (item, index) => (
                    <tr>
                      <td className="td-padding">{index + 1}</td>
                      <td className="td-padding">{item?.revisionContent}</td>
                      <td className="td-padding">
                        {item?.revisionContentDate}
                      </td>
                      <td className="td-padding">{item?.revisedBy}</td>
                    </tr>
                  )
                )}
              </table>
            </div>
            <Row className="m-2 p-3 border bg-white rounded d-flex justify-content-center align-items-center">
              <table>
                <tr>
                  <td>
                    <table>
                      <tr>[Notes of filing out checklist] (Category)</tr>
                      <tr>
                        <td>
                          <span style={{ fontWeight: "bold" }}>B</span>
                          reakdown: Directly relates to failure aspect
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style={{ fontWeight: "bold" }}>S</span>
                          afety: Directly relates to safety aspect
                        </td>
                      </tr>
                      <tr>
                        <td>
                          {" "}
                          <span style={{ fontWeight: "bold" }}>Q</span>
                          uality: Directly relates to quality aspect
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style={{ fontWeight: "bold" }}>P</span>
                          ollution: Directly relates to pollution aspect
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style={{ borderLeft: "2px solid black" }}></td>
                  <td>
                    <table>
                      <tr>(Person in charge)</tr>
                      <tr>
                        <td>M: Maintenance personnel</td>
                      </tr>
                      <tr>
                        <td>O : Production personnel</td>
                      </tr>
                      <tr>
                        {" "}
                        <td>
                          <br />
                        </td>{" "}
                      </tr>
                      <tr>
                        {" "}
                        <td>
                          <br />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </Row>
            <Row className="m-2 p-3 border bg-white rounded d-flex justify-content-center align-items-center">
              <Col>--> Planned</Col>
              <Col>
                <EastIcon fontSize="small" /> Normal Condition
              </Col>
              <Col>--> * Abnormality</Col>
            </Row>
            <Row className="m-2 p-3 border bg-white rounded d-flex justify-content-center align-items-center">
              <div style={{ float: "left" }}>FO/MTD/02/04/04</div>
            </Row>
          </Col>
          <Col>
            <div className="m-2 p-3 border bg-white rounded d-flex justify-content-center align-items-center">
              <button
                className="btn-danger"
                onClick={funForOpeningSummeryPopups}
              >
                Summary
              </button>
            </div>
          </Col>
        </Row>
      </Container>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
}

export default ChecksheetFormApprovalForTL;
