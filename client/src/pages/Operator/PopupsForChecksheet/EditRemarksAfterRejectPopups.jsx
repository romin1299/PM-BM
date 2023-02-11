import React, { useState, useEffect } from "react";
import MaterialTable from "@material-table/core";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { useFormik } from "formik";
import * as yup from "yup";
import { Container, Row, Col } from "react-bootstrap";
import TextField from "@material-ui/core/TextField";

const EditRemarksAfterRejectPopups = ({
  close,
  machineData,
  senderApprovalMonth,
  functionToSetRefKey,
}) => {
  const tableData = machineData?.checkSheet_data?.checkSheet;

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
  // const financialYearWiseMonthKeyArray = [
  //   "Apr",
  //   "May",
  //   "June",
  //   "July",
  //   "Aug",
  //   "Sep",
  //   "Oct",
  //   "Nov",
  //   "Dec",
  //   "Jan",
  //   "Feb",
  //   "Mar",
  // ];

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

  let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

  const [HOSList, setHOSList] = useState([]);
  const [PRDTLlist, setPRDTLlist] = useState([]);
  const [MTDTLlist, setMTDTLlist] = useState([]);

  const validationSchema1 = yup.object({
    prd_tl_list: yup.string().required("Please select PRD TL"),
    mtd_tl_list: yup.string().required("Please select MTD TL"),
    mtd_hos_list: yup.string().required("Please select MTD HOS"),
  });

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
          prd_tl_list: PRDTLlist[values.prd_tl_list],
          mtd_tl_list: MTDTLlist[values.mtd_tl_list],
          mtd_hos_list: HOSList[values.mtd_hos_list],
          implemetation_completed_date: timeStamp(),
          selected_machine_data: machineData,
          monthForCompareSystemMonth,
          phaseStatus: machineData?.checkSheet_data?.checksheet_status,
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
        close();
        functionToSetRefKey();
      }
    },
  });

  // console.log(
  //   machineData?.checkSheet_data?.implemetation_mtd_tl_approval_status?.[
  //     monthForCompareSystemMonth
  //   ]?.at(-1),
  //   machineData?.checkSheet_data?.implemetation_mtd_hos_approval_status?.[
  //     monthForCompareSystemMonth
  //   ]?.at(-1)
  // );

  const subSectionHeader = [
    // {
    //   title: "Month",
    //   // field: "start_month",
    //   render: (rowData) => financialYearWiseMonthKeyArray[rowData?.start_month],
    //   width: "5%",
    // },
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData?.tableData.id + 1}`,
      // align: "center",
      width: "6%",
    },
    {
      title: "Inspection Item",
      field: "inspection_parent_name",
      editable: "false",
    },
    {
      title: "Remarks",
      field: `remarks`,
      render: (rowData) =>
        rowData?.planningTableAnimationArray2
          ? rowData?.planningTableAnimationArray2?.[senderApprovalMonth]?.[2]
          : "",
    },
    {
      title: "Abnormality{Yes/No}",
      render: (rowData) =>
        rowData?.abnormalityDetails
          ? rowData?.abnormalityDetails?.[senderApprovalMonth]
            ?.abnormalityRemarks
            ? "Yes"
            : ""
          : "",
      width: "5%",
      editable: "false",
      // field: "abnormality",
    },
    {
      title: "Ab. Remarks",
      field: `abnormalityRemarks`,
      render: (rowData) =>
        rowData?.abnormalityDetails
          ? rowData?.abnormalityDetails?.[senderApprovalMonth]
            ?.abnormalityRemarks
          : "",
      editable: "false",
    },
    {
      title: "Status",
      render: (rowData) =>
        rowData?.abnormalityDetails
          ? rowData?.abnormalityDetails?.[senderApprovalMonth]
            ?.abnormalityStatus
          : "",
      width: "5%",

      // field: "planningTableAnimationArray2.abnormalityDetails.abnormalityStatus",
    },
    {
      title: "T.D",
      render: (rowData) =>
        rowData?.abnormalityDetails
          ? rowData?.abnormalityDetails?.[senderApprovalMonth]?.targetDate
          : "",
      //   field: "",
    },
    {
      title: "Spare{Yes/No}",
      render: (rowData) =>
        rowData?.spareDetails
          ? rowData?.spareDetails?.[senderApprovalMonth]?.spareParts
          : "",
      //   field: "",
      width: "5%",
    },
    {
      title: "P. Name",
      render: (rowData) =>
        rowData?.spareDetails
          ? rowData?.spareDetails?.[senderApprovalMonth]?.partName
          : "",
    },
    {
      title: "P. No",
      render: (rowData) =>
        rowData?.spareDetails
          ? rowData?.spareDetails?.[senderApprovalMonth]?.partNo
          : "",
    },
    {
      title: "Cost",
      render: (rowData) =>
        rowData?.spareDetails
          ? rowData?.spareDetails?.[senderApprovalMonth]?.cost
          : "",
    },
    {
      title: "TM",
      render: (rowData) =>
        rowData?.inspectionCompletionBy
          ? rowData?.inspectionCompletionBy?.[senderApprovalMonth]
          : "",
      //   field: "",
    },
  ];

  const submitRemarksAfterTLOrHosRejection = async (updatedRow, oldRow) => {
    try {
      const res = await fetch("/submitRemarksAfterTLOrHosRejection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineData,
          updatedRow,
          senderApprovalMonth,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Remarks Added Successful");
        postNewLogHistory(updatedRow);
        functionToSetRefKey();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postNewLogHistory = async (updatedRow) => {
    const res = await fetch("/submitLogHistoryAfterRejection", {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yearOfCheckSheet: machineData?.checkSheet_data?.current_year,
        values: updatedRow,
        inceptionValueForLogHistory: updatedRow?.inspection_parent_name,
        completionDateOfInspection: timeStamp(),

        remarks: updatedRow?.remarks,
        fileNameForLogHistory:
          updatedRow?.abnormalityDetails?.[senderApprovalMonth]
            ?.PMuploadedImage,

        refKeyForScheduleMonthInLogHistory:
          updatedRow?.planningTableAnimationArray2?.[senderApprovalMonth]?.[0],

        workedOnPM:
          updatedRow?.planningTableAnimationArray2?.[senderApprovalMonth]?.[1],

        abnormalityRemarks:
          updatedRow?.abnormalityDetails?.[senderApprovalMonth]
            ?.abnormalityRemarks,

        spareParts: updatedRow?.spareDetails?.[senderApprovalMonth]?.spareParts,
        part_name: updatedRow?.spareDetails?.[senderApprovalMonth]?.partName,
        part_no: updatedRow?.spareDetails?.[senderApprovalMonth]?.partNo,
        part_cost: updatedRow?.spareDetails?.[senderApprovalMonth]?.cost,

        target:
          updatedRow?.abnormalityDetails?.[senderApprovalMonth]?.targetDate,
        machineAllData: machineData,
      }),
    });
    const data = res.json();
    // console.log(data);
    if (res.status === 400 || res.status === 422 || !data) {
      window.alert("Invalid credentials !");
    } else {
      console.log("Log Added Successfully...");
    }
  };

  //fetch supported operator list
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
      setPRDTLlist(data.PRDTLlist);
      setHOSList(data.HOSlist);
      setMTDTLlist(data.MTDTLlist);
      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListForApproval();
  }, []);

  console.log(tableData);
  return (
    <>
      <div className="summeryPopupsCss">
        <div className="row">
          <div className="col-11"></div>
          <div className="col-1">
            <button className="btn-closeForChecksheet" onClick={close}>
              Close
            </button>
          </div>
        </div>
        <div>
          {machineData?.checkSheet_data?.implemetation_mtd_hos_approval_status[
            monthForCompareSystemMonth
          ][
            machineData?.checkSheet_data?.implemetation_mtd_hos_approval_status[
              monthForCompareSystemMonth
            ].length - 1
          ] === "Rejected" ||
            machineData?.checkSheet_data?.implemetation_mtd_tl_approval_status[
            monthForCompareSystemMonth
            ][
            machineData?.checkSheet_data?.implemetation_mtd_tl_approval_status[
              monthForCompareSystemMonth
            ].length - 1
            ] === "Rejected" ? (
            <div className="mb-2 row">
              <span
                className="col-2"
                style={{
                  textAlign: "left",
                  fontWeight: "bold",
                }}
              >
                Rejected Remarks:{" "}
              </span>
              <TextField
                type="text"
                className="col-2"
                name="pmStatus"
                autoComplete="off"
                value={
                  machineData?.checkSheet_data?.implementation_rejected_remarks
                    ? machineData?.checkSheet_data
                      ?.implementation_rejected_remarks[
                    monthForCompareSystemMonth
                    ][
                    machineData?.checkSheet_data
                      ?.implementation_rejected_remarks[
                      monthForCompareSystemMonth
                    ].length - 1
                    ]
                    : ""
                }
              />
            </div>
          ) : (
            ""
          )}
        </div>
        <br />
        <div>
          <MaterialTable
            localization={{
              header: {
                actions: "Actions",
              },
              // toolbar: {
              //   exportCSVName: "Export some Excel format",
              //   exportPDFName: "Export as pdf!!"
              // }
            }}
            actions={[]}
            columns={subSectionHeader}
            data={tableData}
            title={`Edit Remarks of month (${senderApprovalMonth})`}
            // tableRef={this.tableRef.current.onQueryChange()}

            editable={{
              isEditHidden: (rowData) =>
                rowData?.planningTableAnimationArray2?.[senderApprovalMonth]
                  ?.length <= 2,
              onRowUpdate: (updatedRow, oldRow) =>
                new Promise((resolve, reject) => {
                  const index = oldRow.tableData.id;
                  const updatedRows = [...tableData];
                  updatedRows[index] = updatedRow;
                  //call the update user function and pass the user data
                  // updateUserInfo(updatedRow);

                  // console.log(updatedRow);

                  submitRemarksAfterTLOrHosRejection(updatedRow, oldRow);
                  setTimeout(() => {
                    // setRefKey2((refKey2) => refKey2 + 1);
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
                // color: "red",
                position: "sticky",
                top: "0",
                fontWeight: "bold",
                // backgroundColor: "#E6232A",
              },

              maxBodyHeight: "70vh",
              rowStyle: {
                // fontStyle:'bold'

                // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                // color:"rgba(255,255,255,0.8)",
                borderRadius: "5px",
                border: "1px solid black",
                // WebkitBackdropFilter: "blur( 2px )",
                borderBottom: "black !important",
                background: "rgba(255,255,255,0)",
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
        </div>
        <div>
          <form onSubmit={formik1.handleSubmit}>
            <div className="m-2 p-3 border bg-white rounded">
              <Row className="d-flex justify-content-start">
                <Col className=" col-sm ">
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
                      <option selected disabled value="">
                        Please select
                      </option>
                      {PRDTLlist?.map((index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
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
                        {formik1.touched.prd_tl_list &&
                          formik1.errors.prd_tl_list}
                      </p>
                    </div>
                  </div>
                </Col>
                <Col className=" col-sm ">
                  <span>
                    MTD TL List <br /> (Checked & Verify by)
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
                      <option selected disabled value="">
                        Please select
                      </option>
                      {MTDTLlist?.map((index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
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
                        {formik1.touched.mtd_tl_list &&
                          formik1.errors.mtd_tl_list}
                      </p>
                    </div>
                  </div>
                </Col>
                <Col className=" col-sm ">
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
                      value={formik1.values.mtd_hos_list}
                      onChange={(e) => {
                        // setUsertype(e.target.value);
                        formik1.handleChange(e);
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {HOSList?.map((index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
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
                <Col className=" col-sm">
                  <button className="btn-approval" type="submit">
                    Send for Approval
                  </button>
                </Col>
              </Row>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditRemarksAfterRejectPopups;
