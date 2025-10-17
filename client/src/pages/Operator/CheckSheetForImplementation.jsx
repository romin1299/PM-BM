import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import $ from "jquery";
import { useFormik } from "formik";
import * as yup from "yup";
import { useContext, tableIcons } from "../../../src/modules/PageModules";
import RoutingContext from "../../context/routing/RoutingContext";
import TextField from "@material-ui/core/TextField";
import { useLocation } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import WorkOnImplementationPM from "../../Popups/WorkOnImplementationPM";
import MaterialTable from "@material-table/core";
import EastIcon from "@mui/icons-material/East";
import { useNavigate } from "react-router-dom";
import SummeryPopups from "./PopupsForChecksheet/SummeryPopups";
import EditRemarksAfterRejectPopups from "./PopupsForChecksheet/EditRemarksAfterRejectPopups";
import { Multiselect } from "multiselect-react-dropdown";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import axios from "axios";
import FileDownload from "js-file-download";
import Footer from "../../components/Footer/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { InfoToast } from "../../BM/Component/ShowTostify";
// import 'reactjs-popup/dist/index.css';
const CheckSheet = ({
  show,
  handleClose,
  lineName,
  // machineData,
  // functionToSetRefKey,
  closeCheckSheet,
  machine_code,
  selectedYear,
}) => {
  const context = useContext(RoutingContext);

  const [stateForOpeningSummeryPopups, setStateForOpeningSummeryPopups] =
    useState("");

  const [stateForEditRemarksAfterReject, setStateForEditRemarksAfterReject] =
    useState("");

  const [newTableData, setNewTableData] = useState([]);
  const [workOnImplementationPM, setWorkOnImplementationPM] = useState("");

  const [supportingTMList, setSupportingTMList] = useState([]);
  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);

  const [delayRemarks, setDelayRemarks] = useState(0);
  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  //after completed send for approval
  // const [HOSList, setHOSList] = useState([]);
  // const [PRDTLlist, setPRDTLlist] = useState([]);
  // const [MTDTLlist, setMTDTLlist] = useState([]);

  const [dataSheetName, setDataSheetName] = useState([]);
  const [machineAllData, setMachineAllData] = useState([]);

  const [listOfAllApproverAndOtherData, setListOfAllApproverAndOtherData] =
    useState({
      HOSList: [],
      PRDTLlist: [],
      MTDTLlist: [],
      supportingTMList: [],
      MTDHODlistForAfterAdd: [],
      selectedMonth: "",
    });

  // let machineAllData = machineData;
  // console.log(machineAllData);
  // let tableData = machineData?.checkSheet_data?.checkSheet;

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

  const validationSchema = yup.object({
    pmTime: yup.string().required("Please enter PM time"),
    delayRemarks: yup.string().when([], {
      is: () =>
        machineAllData?.checkSheet_data?.PMStatus?.[
          monthForCompareSystemMonth
        ] === "",
      then: yup.string().required("Please enter delay reason"),
    }),
  });

  const validationSchema1 = yup.object({
    prd_tl_list: yup.string().required("Please select PRD TL"),
    mtd_tl_list: yup.string().required("Please select MTD TL"),
    mtd_hos_list: yup.string().required("Please select MTD HOS"),
  });
  // get the date and time
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
      pmTime: "",
      supportingOperator: "",
      delayRemarks: "",
    },
    validationSchema: validationSchema,

    onSubmit: async (values) => {
      const res = await fetch("/savedWorkedPMData", {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalPMTime: values.pmTime,
          yearOfCheckSheet: machineAllData?.checkSheet_data?.current_year,
          delayRemarks: machineAllData?.checkSheet_data?.PMDelayRemark
            ? machineAllData?.checkSheet_data?.PMDelayRemark?.[
                monthForCompareSystemMonth
              ]
              ? machineAllData?.checkSheet_data?.PMDelayRemark?.[
                  monthForCompareSystemMonth
                ]
              : values.delayRemarks
            : values.delayRemarks,
          PMworkedTMName: context.tm_name.split(" ")[0],
          PMworkedTMNo: context.tm_no,
          selectedSupportedTM,
          finishedPMTime: timeStamp(),
          machine_code: machineAllData?.machine_code,
          monthForCompareSystemMonth,
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else if (res.status === 409) {
        console.log("Machine code already exists!");
      } else {
        console.log("PM worked data save sucessfully...");
        postMachineIdToGetAllDetailsOfMachine();
        InfoToast(
          "Don't forget to send for approval after all points are completed !!!"
        );
        // closeCheckSheet();
        // navigate("/");
        // clearState();
      }
    },
  });

  const notifyForNotEnteredPMTime = () => {
    toast.warn("Please first enter PM time, after send approval !", {
      position: "top-center",
      autoClose: true,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  const formik1 = useFormik({
    initialValues: {
      prd_tl_list: "",
      mtd_tl_list: "",
      mtd_hos_list: "",
    },
    validationSchema: validationSchema1,

    onSubmit: async (values) => {
      const res = await fetch("/sendRequestForApproval", {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prd_tl_list:
            listOfAllApproverAndOtherData?.PRDTLlist[values.prd_tl_list],
          mtd_tl_list:
            listOfAllApproverAndOtherData?.MTDTLlist[values.mtd_tl_list],
          mtd_hos_list:
            listOfAllApproverAndOtherData?.HOSList[values.mtd_hos_list],
          implemetation_completed_date: timeStamp(),
          selected_machine_data: machineAllData,
          monthForCompareSystemMonth,
          phaseStatus: machineAllData?.checkSheet_data?.checksheet_status,
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else if (res.status === 409) {
        notifyForNotEnteredPMTime();
        // alert("Please first enter PM time & Supporting TM after send approval !")
      } else {
        console.log("PM worked data save sucessfully...");
        closeCheckSheet();
      }
    },
  });

  //fetch supported operator list
  // const getListForApproval = async () => {
  //   try {
  //     const res = await fetch("/getListForApproval", {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     const data = await res.json();
  //     // console.log(data);
  //     setPRDTLlist(data.PRDTLlist);
  //     setHOSList(data.HOSlist);
  //     setMTDTLlist(data.MTDTLlist);
  //     setSupportingTMList(data.supportingOperatorList);
  //     // setTableData(finalData);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

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

  // const postMachineIdToGetAllDetailsOfMachine = () => {};

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

  const getDataModelled = (checkSheetData) => {
    let data = checkSheetData?.sort(compareCycle);

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
          : key === "remarksCompulsoryOrNot"
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
            //   key1 === previousMonth &&
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
            if (
              key1 === previousMonth &&
              (obj[key][key1][1] === "dummy" || obj[key][key1][1] === "delay")
            ) {
              setDelayRemarks(1);
            }
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
      for (let j = 11; j < 12; j++) {
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
  // console.log(newTableData);
  const close = () => {
    setWorkOnImplementationPM("");
    setStateForOpeningSummeryPopups("");
    setStateForEditRemarksAfterReject("");
    // document.querySelector(".checkSheetForImplementation").style.pointerEvents =
    //   "auto";
  };

  const disabledButtonAfterPM = (tableRowId, id) => {
    document.getElementById(tableRowId).setAttribute("disabled", "");
  };

  const funForOpeningSummeryPopups = () => {
    setStateForOpeningSummeryPopups(
      <SummeryPopups
        close={close}
        // tableData={tableData}
        machineData={machineAllData}
      />
    );
    document.querySelector(".checkSheetForImplementation").style.pointerEvents =
      "none";
  };

  const OpenPopupForEditRemarksAfterReject = (senderApprovalMonth) => {
    setStateForEditRemarksAfterReject(
      <EditRemarksAfterRejectPopups
        close={close}
        senderApprovalMonth={senderApprovalMonth}
        // functionToSetRefKey={functionToSetRefKey}
        postMachineIdToGetAllDetailsOfMachine={
          postMachineIdToGetAllDetailsOfMachine
        }
        // tableData={tableData}
        machineData={machineAllData}
      />
    );
    document.querySelector(".checkSheetForImplementation").style.pointerEvents =
      "none";
  };

  // useEffect(() => {
  //   getListForApproval();
  //   getDataModelled();
  // }, []);

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

  const postMachineIdToGetAllDetailsOfMachine = async () => {
    try {
      const res = await fetch(
        `/postMachineIdToGetAllDetailsOfMachine/?selectedYear=${selectedYear}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machine_code,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data)
        setMachineAllData(data?.machineLastData);
        getDataModelled(data?.machineLastData?.checkSheet_data?.checkSheet);
        setListOfAllApproverAndOtherData({
          ...listOfAllApproverAndOtherData,
          PRDTLlist: data?.prdTL,
          MTDTLlist: data?.mtdTL,
          HOSList: data?.mtdHOS,
          supportingTMList: data?.operatorList,
          MTDHODlistForAfterAdd: data?.mtdHOD,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postMachineIdToGetAllDetailsOfMachine();
  }, []);

  return (
    <>
      {workOnImplementationPM}
      {stateForOpeningSummeryPopups}
      {stateForEditRemarksAfterReject}
      <div className="modal-fullscreen">
        <Modal
          className="d-flex align-items-center justify-content-center"
          show={show}
          fullscreen={true}
          onHide={handleClose}
          scrollable={true}
          enforceFocus={false}
        >
          <Modal.Header className="d-flex justify-content-between">
            <Modal.Title>CheckSheet</Modal.Title>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="btn-danger"
            >
              Close
            </Button>
          </Modal.Header>
          <Modal.Body>
            <div>
              <Container fluid>
                <Row>
                  {machineAllData?.checkSheet_data?.dataSheet ? (
                    <Col>
                      <Col sm={12} md={6}>
                        <div style={{ float: "left" }}>
                          <span style={{ fontWeight: "bold", float: "left" }}>
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
                              onChange={(e) =>
                                setDataSheetName(e.target.files[0])
                              }
                            />
                            <br />
                            &nbsp;
                            <button
                              type="submit"
                              className="btn-primary1 mt-2 mb-2"
                            >
                              Upload
                            </button>
                          </form>
                        </div>{" "}
                      </Col>
                      <Col
                        sm={12}
                        md={6}
                        className="d-flex justify-content-center align-items-center"
                      >
                        <button
                          className="btn-reset"
                          onClick={downloadUploadedDataSheet}
                        >
                          <SimCardDownloadIcon /> Download DATA-SHEET
                        </button>
                      </Col>
                    </Col>
                  ) : (
                    <Col sm={12} md={6}></Col>
                  )}
                  <Col lg={6} md={6} sm={12}>
                    <table className="ar-table tableCol1 ">
                      <thead>
                        <tr>
                          <th
                            className="ar-table-thead-header1 text-center"
                            // colSpan={2}
                            //  rowSpan={5}
                          >
                            PLAN ACCEPTANCE
                            <br />
                            (By PRD TL)
                          </th>
                          <th
                            className="ar-table-thead-header1 text-center"
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
                            {machineAllData?.checkSheet_data
                              ?.approved_by_PRD_TL?.[
                              machineAllData?.checkSheet_data
                                ?.approved_by_PRD_TL?.length - 1
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
                            {machineAllData?.checkSheet_data
                              ?.plan_prepared_tm_name?.[
                              machineAllData?.checkSheet_data
                                ?.plan_prepared_tm_name?.length - 1
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
            {machineAllData?.checkSheet_data?.checksheet_status ===
              "Planning" ||
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
                            <b>Line:</b>- {lineName}
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
                            ? Object.entries(
                                machineAllData?.checkSheet_data
                                  ?.implemetation_mtd_tl_approval_status
                              ).map(([month, statusArray]) =>
                                statusArray[statusArray.length - 1] ===
                                "Accepted" ? (
                                  <td className="ar-table-col1">
                                    {
                                      machineAllData?.checkSheet_data
                                        ?.implementation_assign_MTD_TL_name[
                                        month
                                      ][
                                        machineAllData?.checkSheet_data
                                          ?.implementation_assign_MTD_TL_name[
                                          month
                                        ].length - 1
                                      ]
                                    }
                                  </td>
                                ) : (
                                  <td className="ar-table-col1"></td>
                                )
                              )
                            : refArrayForTDMapping?.map((index) => (
                                <td className="ar-table-col1"></td>
                              ))}
                        </tr>
                        <tr>
                          <th className="approvalName" colSpan={2} rowSpan={5}>
                            {machineAllData?.checkSheet_data?.approved_by_HOS?.[
                              machineAllData?.checkSheet_data?.approved_by_HOS
                                ?.length - 1
                            ]
                              ? machineAllData?.checkSheet_data
                                  ?.approved_by_HOS?.[
                                  machineAllData?.checkSheet_data
                                    ?.approved_by_HOS?.length - 1
                                ]
                              : ""}
                            <br />

                            {machineAllData?.checkSheet_data?.approved_by_TL?.[
                              machineAllData?.checkSheet_data?.approved_by_TL
                                ?.length - 1
                            ]
                              ? `,${
                                  machineAllData?.checkSheet_data
                                    ?.approved_by_TL?.[
                                    machineAllData?.checkSheet_data
                                      ?.approved_by_TL?.length - 1
                                  ]
                                }`
                              : ""}
                          </th>
                          <th className="approvalName" colSpan={2} rowSpan={5}>
                            {machineAllData?.checkSheet_data?.sender_tm_name?.[
                              machineAllData?.checkSheet_data?.sender_tm_name
                                ?.length - 1
                            ]
                              ? machineAllData?.checkSheet_data
                                  ?.sender_tm_name?.[
                                  machineAllData?.checkSheet_data
                                    ?.sender_tm_name?.length - 1
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
                            ? Object.entries(
                                machineAllData?.checkSheet_data
                                  ?.implemetation_mtd_hos_approval_status
                              ).map(([month, statusArray]) =>
                                statusArray[statusArray.length - 1] ===
                                "Accepted" ? (
                                  <td className="ar-table-col1">
                                    {
                                      machineAllData?.checkSheet_data
                                        ?.implementation_assign_MTD_HOS_name[
                                        month
                                      ][
                                        machineAllData?.checkSheet_data
                                          ?.implementation_assign_MTD_HOS_name[
                                          month
                                        ].length - 1
                                      ]
                                    }
                                  </td>
                                ) : (
                                  <td className="ar-table-col1"></td>
                                )
                              )
                            : refArrayForTDMapping?.map((index) => (
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
                                  ?.implementation_approved_by_MTD_HOD?.Sep
                                  ?.length - 1
                              ]
                            }
                          </td>
                          <td className="ar-table-col1" colSpan={6}>
                            {
                              machineAllData?.checkSheet_data
                                ?.implementation_approved_by_MTD_HOD?.Mar?.[
                                machineAllData?.checkSheet_data
                                  ?.implementation_approved_by_MTD_HOD?.Mar
                                  ?.length - 1
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
                              // colSpan={
                              //   tColumn.header === "Inspection item"
                              //     ? refKey === true
                              //       ? 2
                              //       : 0
                              //     : 0
                              // }
                            >
                              {machineAllData?.checkSheet_data
                                ?.implemetation_prd_tl_approval_status?.[
                                tColumn?.header
                              ]?.[
                                machineAllData?.checkSheet_data
                                  ?.implemetation_prd_tl_approval_status?.[
                                  tColumn?.header
                                ]?.length - 1
                              ] === "Rejected" ||
                              machineAllData?.checkSheet_data
                                ?.implemetation_mtd_tl_approval_status?.[
                                tColumn?.header
                              ]?.[
                                machineAllData?.checkSheet_data
                                  ?.implemetation_mtd_tl_approval_status?.[
                                  tColumn?.header
                                ]?.length - 1
                              ] === "Rejected" ||
                              machineAllData?.checkSheet_data
                                ?.implemetation_mtd_hos_approval_status?.[
                                tColumn?.header
                              ]?.[
                                machineAllData?.checkSheet_data
                                  ?.implemetation_mtd_hos_approval_status?.[
                                  tColumn?.header
                                ]?.length - 1
                              ] === "Rejected" ? (
                                <button
                                  style={{
                                    backgroundColor: "#E5232A",
                                    color: "#ffffff",
                                  }}
                                  onClick={() =>
                                    OpenPopupForEditRemarksAfterReject(
                                      tColumn.header
                                    )
                                  }
                                >
                                  {tColumn.header}
                                </button>
                              ) : (
                                tColumn.header
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {newTableData?.map((rData, rIndex) => (
                          <tr
                            className={
                              rData[11]?.["key"] === "isDeleted" &&
                              rData[11]?.["value"] === true
                                ? "ar-table-row table-col-mid-year-delete"
                                : "ar-table-row"
                            }
                          >
                            {" "}
                            {rData.map((colData) =>
                              machineAllData?.checkSheet_data
                                ?.checksheet_status === "Implementation" &&
                              context?.user_type === "Operator" ? (
                                colData?.print == true ? (
                                  <td
                                    className={
                                      colData.value === ""
                                        ? "ar-table-col2"
                                        : colData.key ===
                                            "inspection_parent_name" ||
                                          colData.key ===
                                            "inspection_child_name" ||
                                          colData.key === "inspection_point" ||
                                          colData.key ===
                                            "judgement_criteria" ||
                                          colData.key === "action"
                                        ? "table_text_alignment"
                                        : colData.value.length === 2 &&
                                          colData.value[0] === "1" &&
                                          colData.value[1] === "dummy"
                                        ? "table-col-bg-ongoing"
                                        : colData.value.length === 2 &&
                                          colData.value[0] === "1" &&
                                          colData.value[1] === "delay"
                                        ? "table-col-bg-delay"
                                        : colData.value.length === 2 &&
                                          colData.value[0] === "1" &&
                                          colData.value[1] === "skip"
                                        ? "table-col-bg-skip"
                                        : "ar-table-col"
                                      //ar-table-col
                                    }
                                    rowSpan={colData.rowspan}
                                    colSpan={colData.colspan}
                                  >
                                    {" "}
                                    {colData.value[0] === "0" &&
                                    colData.key !== "tableRowId" &&
                                    colData.key !== "cycle" &&
                                    colData.key !== "PM_time" &&
                                    colData.key !== "inspection_parent_name" &&
                                    colData.key !== "inspection_point" &&
                                    colData.key !== "judgement_criteria" &&
                                    colData.key !== "action" ? (
                                      ""
                                    ) : (colData.value[0] === "1" ||
                                        colData.value[0] === "2") &&
                                      colData.key !== "tableRowId" &&
                                      colData.key !== "cycle" &&
                                      colData.key !== "PM_time" &&
                                      colData.key !==
                                        "inspection_parent_name" &&
                                      colData.key !== "inspection_point" &&
                                      colData.key !== "judgement_criteria" &&
                                      colData.key !== "action" ? (
                                      colData.value.length === 1 &&
                                      colData.key ===
                                        monthForCompareSystemMonth &&
                                      rData[11]?.["key"] !== "isDeleted" &&
                                      rData[11]?.["value"] !== true ? (
                                        <>
                                          {" "}
                                          <button
                                            className="commonBtn pmImplementationBtn"
                                            id={rData[0].value}
                                            onClick={() => {
                                              setWorkOnImplementationPM(
                                                <WorkOnImplementationPM
                                                  close={close}
                                                  // disabledButtonAfterPM={
                                                  //   disabledButtonAfterPM
                                                  // }
                                                  machineId={
                                                    machineAllData.machine_code
                                                  }
                                                  tableRowId={rData[0].value}
                                                  tableRowIdForSrNo={
                                                    rData[1].value
                                                  }
                                                  yearOfCheckSheet={
                                                    machineAllData
                                                      ?.checkSheet_data
                                                      .current_year
                                                  }
                                                  monthForCompareSystemMonth={
                                                    monthForCompareSystemMonth
                                                  }
                                                  // functionToSetRefKey={
                                                  //   functionToSetRefKey
                                                  // }
                                                  postMachineIdToGetAllDetailsOfMachine={
                                                    postMachineIdToGetAllDetailsOfMachine
                                                  }
                                                  previousMonth={previousMonth}
                                                  //--------------------

                                                  machineAllData={
                                                    machineAllData
                                                  }
                                                  inceptionValueForLogHistory={
                                                    rData?.[3]?.value
                                                  }
                                                  refKeyForScheduleMonthInLogHistory={
                                                    colData?.value?.[0]
                                                  }
                                                  remarksCompulsoryOrNot={
                                                    rData[10].value
                                                  }
                                                />
                                              );
                                              // document.querySelector(
                                              //   ".checkSheetForImplementation"
                                              // ).style.pointerEvents = "none";
                                            }}
                                          >
                                            -->
                                          </button>
                                          <br />{" "}
                                        </>
                                      ) : colData.value.length === 1 &&
                                        colData.value[0] === "1" ? (
                                        <p style={{ fontWeight: "900" }}>--></p>
                                      ) : colData.value[0] === "1" &&
                                        (colData.value[1] === "Yes" ||
                                          colData.value[1] === "Rectify") ? (
                                        <>
                                          <div style={{ fontWeight: "900" }}>
                                            -->
                                            <br />
                                            <EastIcon fontSize="small" />
                                            <br />
                                          </div>
                                          {colData.value[2] ? (
                                            <p className="remarksText">
                                              {colData.value[2]}
                                            </p>
                                          ) : (
                                            ""
                                          )}
                                        </>
                                      ) : colData.value[0] === "2" &&
                                        (colData.value[1] === "Yes" ||
                                          colData.value[1] === "Rectify") ? (
                                        <>
                                          <div style={{ fontWeight: "900" }}>
                                            <EastIcon fontSize="small" />
                                            <br />
                                          </div>
                                          {colData.value[2] ? (
                                            <p className="remarksText">
                                              {colData.value[2]}
                                            </p>
                                          ) : (
                                            ""
                                          )}
                                        </>
                                      ) : colData.value.length === 2 &&
                                        colData.value[0] === "1" &&
                                        (colData.value[1] === "dummy" ||
                                          colData.value[1] === "delay") ? (
                                        <p
                                          className="d-flex justify-content-center align-items-center"
                                          style={{ fontWeight: "900" }}
                                        >
                                          {" "}
                                          -->
                                        </p>
                                      ) : colData.value.length === 2 &&
                                        colData.value[0] === "1" &&
                                        colData.value[1] === "skip" ? (
                                        <p
                                          className="d-flex justify-content-center align-items-center"
                                          style={{ fontWeight: "900" }}
                                        >
                                          {" "}
                                          -->
                                        </p>
                                      ) : colData.value.length === 1 &&
                                        colData.value[0] === "2" ? (
                                        <p
                                          className="d-flex justify-content-center align-items-center"
                                          style={{ fontWeight: "900" }}
                                        >
                                          {" "}
                                          -->
                                        </p>
                                      ) : colData.value.length === 2 &&
                                        colData.value[0] === "2" &&
                                        colData.value[1] === "skip_previous" ? (
                                        <p
                                          className="d-flex justify-content-center align-items-center"
                                          style={{ fontWeight: "900" }}
                                        >
                                          {" "}
                                          -->
                                        </p>
                                      ) : (
                                        <>
                                          <div style={{ fontWeight: "900" }}>
                                            --> *
                                            <br />
                                          </div>
                                          {colData.value[2] ? (
                                            <p className="remarksText">
                                              {colData.value[2]}
                                            </p>
                                          ) : (
                                            ""
                                          )}
                                          {colData.value[3] ? (
                                            <p className="remarksText">
                                              &#x2B24; &nbsp;
                                              {colData.value[3]}
                                            </p>
                                          ) : (
                                            ""
                                          )}
                                        </>
                                      )
                                    ) : (
                                      colData.value
                                    )}{" "}
                                  </td>
                                ) : (
                                  ""
                                )
                              ) : colData.print == true ? (
                                <td
                                  className={
                                    colData.value === ""
                                      ? "ar-table-col2"
                                      : colData.key ===
                                          "inspection_parent_name" ||
                                        colData.key ===
                                          "inspection_child_name" ||
                                        colData.key === "inspection_point" ||
                                        colData.key === "judgement_criteria" ||
                                        colData.key === "action"
                                      ? "table_text_alignment"
                                      : "ar-table-col"
                                  }
                                  rowSpan={colData.rowspan}
                                  colSpan={colData.colspan}
                                >
                                  {" "}
                                  {colData.value[0] === "0" &&
                                  colData.key !== "cycle" &&
                                  colData.key !== "PM_time"
                                    ? ""
                                    : colData.value[0] === "1" &&
                                      colData.key !== "cycle" &&
                                      colData.key !== "PM_time"
                                    ? "-->"
                                    : colData.value}{" "}
                                </td>
                              ) : (
                                ""
                              )
                            )}
                          </tr>
                        ))}
                        <tr>
                          <th colSpan={9}></th>
                          <th className="ar-table-thead-header1">
                            Done By
                            <br />
                            (MTD TM's)
                          </th>
                          {machineAllData?.checkSheet_data?.PMworkedTMName
                            ? Object.keys({
                                ...machineAllData?.checkSheet_data
                                  ?.implemetation_completed_tm_name,
                                ...machineAllData?.checkSheet_data
                                  ?.PMworkedTMName,
                              }).map((month) => {
                                const uniqueNames = [
                                  ...new Set([
                                    ...(machineAllData?.checkSheet_data
                                      ?.implemetation_completed_tm_name?.[
                                      month
                                    ] || []),
                                    ...(machineAllData?.checkSheet_data
                                      ?.PMworkedTMName?.[month] || []),
                                  ]),
                                ];
                                return (
                                  <td key={month} className="ar-table-col1">
                                    {uniqueNames.length > 0
                                      ? uniqueNames.join(" ,")
                                      : "-"}
                                  </td>
                                );
                              })
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
                            ? Object.entries(
                                machineAllData?.checkSheet_data
                                  ?.implemetation_prd_tl_approval_status
                              ).map(([month, statusArray]) =>
                                statusArray[statusArray.length - 1] ===
                                "Accepted" ? (
                                  <td className="ar-table-col1">
                                    {
                                      machineAllData?.checkSheet_data
                                        ?.implementation_assign_PRD_TL_name?.[
                                        month
                                      ][
                                        machineAllData?.checkSheet_data
                                          ?.implementation_assign_PRD_TL_name?.[
                                          month
                                        ]?.length - 1
                                      ]
                                    }
                                  </td>
                                ) : (
                                  <td className="ar-table-col1"></td>
                                )
                              )
                            : refArrayForTDMapping?.map((index) => (
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
                          {refArrayForTDMapping?.map((index) => (
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
                              <td className="td-padding">
                                {item?.revisionContent}
                              </td>
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
                              <tr>
                                [Notes of filing out checklist] (Category)
                              </tr>
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
                    {machineAllData?.checkSheet_data?.checksheet_status ===
                      "Implementation" && context.user_type === "Operator" ? (
                      machineAllData?.checkSheet_data
                        ?.implemetation_prd_tl_approval_status?.[
                        monthForCompareSystemMonth
                      ]?.length > 0 ||
                      machineAllData?.checkSheet_data
                        ?.implemetation_mtd_tl_approval_status?.[
                        monthForCompareSystemMonth
                      ]?.length > 0 ||
                      machineAllData?.checkSheet_data
                        ?.implemetation_mtd_hos_approval_status?.[
                        monthForCompareSystemMonth
                      ]?.length > 0 ? (
                        <>
                          <Row className="m-2 p-3 border bg-white rounded">
                            <Col>
                              <form onSubmit={formik.handleSubmit}>
                                {delayRemarks === 1 ? (
                                  machineAllData?.checkSheet_data
                                    ?.PMDelayRemark ? (
                                    machineAllData?.checkSheet_data
                                      ?.PMDelayRemark?.[
                                      monthForCompareSystemMonth
                                    ] ? (
                                      <div className="mb-2 row">
                                        <span
                                          className="col-3"
                                          style={{
                                            textAlign: "left",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Delay reason:{" "}
                                        </span>
                                        <TextField
                                          type="text"
                                          className="col-8"
                                          name="delayRemarks"
                                          autoComplete="off"
                                          value={
                                            machineAllData?.checkSheet_data
                                              ?.PMDelayRemark?.[
                                              monthForCompareSystemMonth
                                            ]
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="mb-2 row">
                                        <span
                                          className="col-3"
                                          style={{
                                            textAlign: "left",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Delay reason:{" "}
                                        </span>
                                        <TextField
                                          type="text"
                                          className="col-8"
                                          name="delayRemarks"
                                          autoComplete="off"
                                          value={formik.values.delayRemarks}
                                          placeholder={
                                            machineAllData?.checkSheet_data
                                              ?.PMDelayRemark?.[
                                              monthForCompareSystemMonth
                                            ]
                                              ? machineAllData?.checkSheet_data
                                                  ?.PMDelayRemark?.[
                                                  monthForCompareSystemMonth
                                                ]
                                              : ""
                                          }
                                          onChange={formik.handleChange}
                                          error={
                                            formik.touched.delayRemarks &&
                                            Boolean(formik.errors.delayRemarks)
                                          }
                                          helperText={
                                            formik.touched.delayRemarks &&
                                            formik.errors.delayRemarks
                                          }
                                        />
                                      </div>
                                    )
                                  ) : (
                                    <div className="mb-2 row">
                                      <span
                                        className="col-3"
                                        style={{
                                          textAlign: "left",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Delay reason:{" "}
                                      </span>
                                      <TextField
                                        type="text"
                                        className="col-8"
                                        name="delayRemarks"
                                        autoComplete="off"
                                        value={formik.values.delayRemarks}
                                        placeholder={
                                          machineAllData?.checkSheet_data
                                            ?.PMDelayRemark?.[
                                            monthForCompareSystemMonth
                                          ]
                                            ? machineAllData?.checkSheet_data
                                                ?.PMDelayRemark?.[
                                                monthForCompareSystemMonth
                                              ]
                                            : ""
                                        }
                                        onChange={formik.handleChange}
                                        error={
                                          formik.touched.delayRemarks &&
                                          Boolean(formik.errors.delayRemarks)
                                        }
                                        helperText={
                                          formik.touched.delayRemarks &&
                                          formik.errors.delayRemarks
                                        }
                                      />
                                    </div>
                                  )
                                ) : (
                                  ""
                                )}
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    PM Status:{" "}
                                  </span>
                                  <TextField
                                    type="text"
                                    className="col-8"
                                    name="pmStatus"
                                    autoComplete="off"
                                    value={
                                      machineAllData?.checkSheet_data?.PMStatus
                                        ? machineAllData?.checkSheet_data
                                            ?.PMStatus?.[
                                            monthForCompareSystemMonth
                                          ] === ""
                                          ? "Not schedule"
                                          : machineAllData?.checkSheet_data
                                              ?.PMStatus?.[
                                              monthForCompareSystemMonth
                                            ]
                                        : ""
                                    }
                                    // onChange={formik.handleChange}
                                    // error={
                                    //   formik.touched.pmTime && Boolean(formik.errors.pmTime)
                                    // }
                                    // helperText={
                                    //   formik.touched.pmTime && formik.errors.pmTime
                                    // }
                                  />
                                </div>
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    PM Time(min):{" "}
                                  </span>
                                  <TextField
                                    type="text"
                                    className="col-8"
                                    name="pmTime"
                                    autoComplete="off"
                                    value={formik.values.pmTime}
                                    onChange={formik.handleChange}
                                    error={
                                      formik.touched.pmTime &&
                                      Boolean(formik.errors.pmTime)
                                    }
                                    helperText={
                                      formik.touched.pmTime &&
                                      formik.errors.pmTime
                                    }
                                  />
                                </div>
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Previous PM Time(min):{" "}
                                  </span>
                                  <span
                                    className="col-8"
                                    style={{ textAlign: "left" }}
                                  >
                                    {machineAllData?.checkSheet_data
                                      ?.totalPMTime?.[
                                      monthForCompareSystemMonth
                                    ]?.totalWorkedPMTime
                                      ? machineAllData?.checkSheet_data
                                          ?.totalPMTime?.[
                                          monthForCompareSystemMonth
                                        ]?.totalWorkedPMTime
                                      : "0"}
                                  </span>
                                </div>
                                <div className="mb-2 d-flex align-items-center">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Supporting TM:{" "}
                                  </span>

                                  <Multiselect
                                    displayValue="tm_name"
                                    className="col-9 "
                                    options={
                                      listOfAllApproverAndOtherData?.supportingTMList
                                    } // Options to display in the dropdown
                                    // selectedValues={departmentList} // Preselected value to persist in dropdown
                                    onSelect={async (selectedList) => {
                                      await setSelectedSupportedTM(
                                        selectedList
                                      );
                                    }} // Function will trigger on select event
                                    onRemove={async (selectedList) => {
                                      await setSelectedSupportedTM(
                                        selectedList
                                      );
                                    }} // Function will trigger on remove event
                                    style={{
                                      multiselectContainer: {
                                        width: "15rem",
                                      },
                                    }}
                                  />
                                </div>

                                <button className="btn-primary1" type="submit">
                                  Save
                                </button>
                              </form>
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              {machineAllData?.checkSheet_data?.PMStatus ? (
                                machineAllData?.checkSheet_data?.PMStatus[
                                  monthForCompareSystemMonth
                                ] === "Completed" ||
                                (machineAllData?.checkSheet_data?.PMStatus[
                                  previousMonth
                                ] === "Done with delay" &&
                                  machineAllData?.checkSheet_data?.PMStatus[
                                    monthForCompareSystemMonth
                                  ] === "" &&
                                  machineAllData?.checkSheet_data
                                    ?.implemetation_mtd_hos_approval_status?.[
                                    monthForCompareSystemMonth
                                  ]?.[
                                    machineAllData?.checkSheet_data
                                      ?.implemetation_mtd_hos_approval_status?.[
                                      monthForCompareSystemMonth
                                    ]?.length - 1
                                  ] === "Pending") ? (
                                  machineAllData?.checkSheet_data
                                    ?.implemetation_mtd_tl_approval_status?.[
                                    monthForCompareSystemMonth
                                  ]?.[
                                    machineAllData?.checkSheet_data
                                      ?.implemetation_mtd_tl_approval_status?.[
                                      monthForCompareSystemMonth
                                    ]?.length - 1
                                  ] !== "Rejected"
                                ) : machineAllData?.checkSheet_data
                                    ?.implemetation_mtd_hos_approval_status?.[
                                    monthForCompareSystemMonth
                                  ]?.[
                                    machineAllData?.checkSheet_data
                                      ?.implemetation_mtd_hos_approval_status?.[
                                      monthForCompareSystemMonth
                                    ]?.length - 1
                                  ] !== "Rejected" ? (
                                  <form onSubmit={formik1.handleSubmit}>
                                    <div className="m-2 p-3 border bg-white rounded">
                                      <div className="d-flex">
                                        <div className="col-3">
                                          <span>
                                            PRD TL List <br /> (Quality Check)
                                          </span>
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
                                              value={formik1.values.prd_tl_list}
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.PRDTLlist?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                                {formik1.touched.prd_tl_list &&
                                                  formik1.errors.prd_tl_list}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-1 d-flex align-items-center justify-content-center ">
                                          <EastIcon />
                                        </div>
                                        <div className="col-3">
                                          <span>
                                            MTD TL List <br /> (Checked & Verify
                                            by)
                                          </span>
                                          <div style={{ marginTop: "0.5rem" }}>
                                            <select
                                              // class="form-select form-select-sm"
                                              // aria-label=".form-select-sm example"
                                              // style={{ width: "100%" }}
                                              id="standard-select-currency"
                                              name="mtd_tl_list"
                                              // className="textField"
                                              // fullWidth
                                              select // label="Select"
                                              autoComplete="off"
                                              value={formik1.values.mtd_tl_list}
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.MTDTLlist?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                                {formik1.touched.mtd_tl_list &&
                                                  formik1.errors.mtd_tl_list}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-1 d-flex align-items-center justify-content-center">
                                          <EastIcon />
                                        </div>
                                        <div className="col-3">
                                          <span>
                                            MTD HOS List <br /> (Approved by)
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
                                              value={
                                                formik1.values.mtd_hos_list
                                              }
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.HOSList?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                        </div>
                                      </div>
                                      <div>
                                        <button
                                          className="btn-approval"
                                          type="submit"
                                        >
                                          Send for Approval
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                ) : (
                                  ""
                                )
                              ) : (
                                ""
                              )}
                            </Col>
                          </Row>
                        </>
                      ) : (
                        <>
                          <Row className="m-2 p-3 border bg-white rounded">
                            <Col>
                              <form onSubmit={formik.handleSubmit}>
                                {delayRemarks === 1 ? (
                                  machineAllData?.checkSheet_data
                                    ?.PMDelayRemark ? (
                                    machineAllData?.checkSheet_data
                                      ?.PMDelayRemark?.[
                                      monthForCompareSystemMonth
                                    ]?.[
                                      machineAllData?.checkSheet_data
                                        ?.PMDelayRemark?.[
                                        monthForCompareSystemMonth
                                      ]?.length - 1
                                    ] ? (
                                      <div className="mb-2 row">
                                        <span
                                          className="col-3"
                                          style={{
                                            textAlign: "left",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Delay reason:{" "}
                                        </span>
                                        <TextField
                                          type="text"
                                          className="col-8"
                                          name="delayRemarks"
                                          autoComplete="off"
                                          value={
                                            machineAllData?.checkSheet_data
                                              ?.PMDelayRemark?.[
                                              monthForCompareSystemMonth
                                            ]
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="mb-2 row">
                                        <span
                                          className="col-3"
                                          style={{
                                            textAlign: "left",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Delay reason:{" "}
                                        </span>
                                        <TextField
                                          type="text"
                                          className="col-8"
                                          name="delayRemarks"
                                          autoComplete="off"
                                          value={formik.values.delayRemarks}
                                          placeholder={
                                            machineAllData?.checkSheet_data
                                              ?.PMDelayRemark?.[
                                              monthForCompareSystemMonth
                                            ]
                                              ? machineAllData?.checkSheet_data
                                                  ?.PMDelayRemark?.[
                                                  monthForCompareSystemMonth
                                                ]
                                              : ""
                                          }
                                          onChange={formik.handleChange}
                                          error={
                                            formik.touched.delayRemarks &&
                                            Boolean(formik.errors.delayRemarks)
                                          }
                                          helperText={
                                            formik.touched.delayRemarks &&
                                            formik.errors.delayRemarks
                                          }
                                        />
                                      </div>
                                    )
                                  ) : (
                                    <div className="mb-2 row">
                                      <span
                                        className="col-3"
                                        style={{
                                          textAlign: "left",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Delay reason:{" "}
                                      </span>
                                      <TextField
                                        type="text"
                                        className="col-8"
                                        name="delayRemarks"
                                        autoComplete="off"
                                        value={formik.values.delayRemarks}
                                        placeholder={
                                          machineAllData?.checkSheet_data
                                            ?.PMDelayRemark?.[
                                            monthForCompareSystemMonth
                                          ]
                                            ? machineAllData?.checkSheet_data
                                                ?.PMDelayRemark?.[
                                                monthForCompareSystemMonth
                                              ]
                                            : ""
                                        }
                                        onChange={formik.handleChange}
                                        error={
                                          formik.touched.delayRemarks &&
                                          Boolean(formik.errors.delayRemarks)
                                        }
                                        helperText={
                                          formik.touched.delayRemarks &&
                                          formik.errors.delayRemarks
                                        }
                                      />
                                    </div>
                                  )
                                ) : (
                                  ""
                                )}
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    PM Status:{" "}
                                  </span>
                                  <TextField
                                    type="text"
                                    className="col-8"
                                    name="pmStatus"
                                    autoComplete="off"
                                    value={
                                      machineAllData?.checkSheet_data?.PMStatus
                                        ? machineAllData?.checkSheet_data
                                            ?.PMStatus[
                                            monthForCompareSystemMonth
                                          ] === ""
                                          ? "Not schedule"
                                          : machineAllData?.checkSheet_data
                                              ?.PMStatus[
                                              monthForCompareSystemMonth
                                            ]
                                        : ""
                                    }
                                    // onChange={formik.handleChange}
                                    // error={
                                    //   formik.touched.pmTime && Boolean(formik.errors.pmTime)
                                    // }
                                    // helperText={
                                    //   formik.touched.pmTime && formik.errors.pmTime
                                    // }
                                  />
                                </div>
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    PM Time(min):{" "}
                                  </span>
                                  <TextField
                                    type="text"
                                    className="col-8"
                                    name="pmTime"
                                    autoComplete="off"
                                    value={formik.values.pmTime}
                                    onChange={formik.handleChange}
                                    error={
                                      formik.touched.pmTime &&
                                      Boolean(formik.errors.pmTime)
                                    }
                                    helperText={
                                      formik.touched.pmTime &&
                                      formik.errors.pmTime
                                    }
                                  />
                                </div>
                                <div className="mb-2 row">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Previous PM Time(min):{" "}
                                  </span>
                                  <span
                                    className="col-8"
                                    style={{ textAlign: "left" }}
                                  >
                                    {machineAllData?.checkSheet_data
                                      ?.totalPMTime?.[
                                      monthForCompareSystemMonth
                                    ]?.totalWorkedPMTime
                                      ? machineAllData?.checkSheet_data
                                          ?.totalPMTime?.[
                                          monthForCompareSystemMonth
                                        ]?.totalWorkedPMTime
                                      : "0"}
                                  </span>
                                </div>
                                <div className="mb-2 d-flex align-items-center">
                                  <span
                                    className="col-3"
                                    style={{
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Supporting TM:{" "}
                                  </span>

                                  <Multiselect
                                    displayValue="tm_name"
                                    options={
                                      listOfAllApproverAndOtherData?.supportingTMList
                                    } // Options to display in the dropdown
                                    className="col-9"
                                    // selectedValues={departmentList} // Preselected value to persist in dropdown
                                    onSelect={async (selectedList) => {
                                      await setSelectedSupportedTM(
                                        selectedList
                                      );
                                    }} // Function will trigger on select event
                                    onRemove={async (selectedList) => {
                                      await setSelectedSupportedTM(
                                        selectedList
                                      );
                                    }} // Function will trigger on remove event
                                  />
                                </div>

                                <button className="btn-primary1" type="submit">
                                  Save
                                </button>
                              </form>
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              {machineAllData?.checkSheet_data?.PMStatus ? (
                                machineAllData?.checkSheet_data?.PMStatus?.[
                                  monthForCompareSystemMonth
                                ] === "Completed" ||
                                (machineAllData?.checkSheet_data?.PMStatus?.[
                                  previousMonth
                                ] === "Done with delay" &&
                                  machineAllData?.checkSheet_data?.PMStatus?.[
                                    monthForCompareSystemMonth
                                  ] === "") ? (
                                  <form onSubmit={formik1.handleSubmit}>
                                    <div className="m-2 p-3 border bg-white rounded">
                                      <div className="d-flex">
                                        <div className="col-4">
                                          <span>
                                            PRD TL List <br /> (Quality Check)
                                          </span>
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
                                              value={formik1.values.prd_tl_list}
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.PRDTLlist?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                                {formik1.touched.prd_tl_list &&
                                                  formik1.errors.prd_tl_list}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-4">
                                          <span>
                                            MTD TL List <br /> (Checked & Verify
                                            by)
                                          </span>
                                          <div style={{ marginTop: "0.5rem" }}>
                                            <select
                                              // class="form-select form-select-sm"
                                              // aria-label=".form-select-sm example"
                                              // style={{ width: "100%" }}
                                              id="standard-select-currency"
                                              name="mtd_tl_list"
                                              // className="textField"
                                              // fullWidth
                                              select // label="Select"
                                              autoComplete="off"
                                              value={formik1.values.mtd_tl_list}
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.MTDTLlist?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                                {formik1.touched.mtd_tl_list &&
                                                  formik1.errors.mtd_tl_list}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-4">
                                          <span>
                                            MTD HOS List <br /> (Approved by)
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
                                              value={
                                                formik1.values.mtd_hos_list
                                              }
                                              onChange={(e) => {
                                                // setUsertype(e.target.value);
                                                formik1.handleChange(e);
                                              }}
                                              variant="standard"
                                            >
                                              <option
                                                selected
                                                disabled
                                                value=""
                                              >
                                                Please select
                                              </option>
                                              {listOfAllApproverAndOtherData?.HOSList?.map(
                                                (index, idx) => {
                                                  return (
                                                    <option value={idx}>
                                                      {index.tm_name}
                                                    </option>
                                                  );
                                                }
                                              )}
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
                                        </div>
                                      </div>
                                      <div>
                                        <button
                                          className="btn-approval"
                                          type="submit"
                                        >
                                          Send for Approval
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                ) : (
                                  ""
                                )
                              ) : (
                                ""
                              )}
                            </Col>
                          </Row>
                        </>
                      )
                    ) : (
                      ""
                    )}
                    {/* {monthForCompareSystemMonth === "Jan" ||
                monthForCompareSystemMonth === "Mar" ||
                machineAllData?.checkSheet_data
                  ?.implemetation_mtd_hod_approval_status[
                  monthForCompareSystemMonth
                ][
                  machineAllData?.checkSheet_data
                    ?.implemetation_mtd_hod_approval_status[
                    monthForCompareSystemMonth
                  ].length - 1
                ] === "Rejected" ? (
                  <Row>
                    <Col>
                      <form onSubmit={formik2.handleSubmit}>
                        <div className="m-2 p-3 border bg-white rounded">
                          <div className="d-flex justify-content-between">
                            <div>
                              <span>
                                MTD HOD List <br /> (Approved by)
                              </span>
                            </div>

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
                                value={formik2.values.mtd_hod_list}
                                onChange={(e) => {
                                  // setUsertype(e.target.value);
                                  formik2.handleChange(e);
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
                                  {formik2.touched.mtd_hod_list &&
                                    formik2.errors.mtd_hod_list}
                                </p>
                              </div>
                            </div>
                            <div>
                              <button className="btn-approval" type="submit">
                                Send for Approval
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </Col>
                  </Row>
                ) : (
                  ""
                )} */}
                  </Col>
                </Row>
              </Container>
            </div>
          </Modal.Body>
          {/* <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer> */}
        </Modal>
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};
export default CheckSheet;
