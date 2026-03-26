import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { Container, Row, Col } from "react-bootstrap";
import EastIcon from "@mui/icons-material/East";
import moment from "moment";
import "react-toastify/dist/ReactToastify.css";
import EditModalForPlanVsActualBySelectedUser from "./EditModalForPlanVsActualBySelectedUser";
import AddApproverNameIfNotAvailableInCheckSheet from "./AddApproverNameIfNotAvailableInCheckSheet";
const CheckSheetEditAfterApproval = ({
  modelProp,
  selectedRow,
  selectedYear,
}) => {
  const [machineAllData, setMachineAllData] = useState([]);
  const [newTableData, setNewTableData] = useState([]);
  const [workOnImplementationPM, setWorkOnImplementationPM] = useState("");
  const [
    checkSheetApprovalEditModalOpenClose,
    setCheckSheetApprovalEditModalOpenClose,
  ] = useState(false);

  const [listOfAllApproverAndOtherData, setListOfAllApproverAndOtherData] =
    useState({
      HOSListForAfterAdd: [],
      PRDTLlistForAfterAdd: [],
      MTDTLlistForAfterAdd: [],
      supportingTMListForAfterAdd: [],
      MTDHODlistForAfterAdd: [],
      selectedMonth: "",
    });

  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

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
        if (key === "planningTableAnimationArray2") {
          newColData.push(
            new Object({
              key: 1,
              value: "",
              rowspan: 1,
              // colspan: 1,
              print: true,
            })
          );
          for (let key1 in obj[key]) {
            if (key1 === "_id") {
              continue;
            }
            // if (
            //   key1 === previousMonth &&
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
            continue;
          }
        }
      }
      newRowData.push(newColData);
    }
    // console.log(newRowData);
    getDataWithSpanCount(newRowData);
  };
  const getDataWithSpanCount = (myProps) => {
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
    setNewTableData(myProps);
  };

  const postMachineIdToGetAllDetailsOfMachine = async () => {
    try {
      const res = await fetch(
        `/postMachineIdToGetAllDetailsOfMachine/?selectedYear=${selectedYear}&&getAllUser=${true}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machine_code: selectedRow?.machine_code,
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
          PRDTLlistForAfterAdd: data?.prdTL,
          MTDTLlistForAfterAdd: data?.mtdTL,
          HOSListForAfterAdd: data?.mtdHOS,
          supportingTMListForAfterAdd: data?.operatorList,
          MTDHODlistForAfterAdd: data?.mtdHOD,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const close = () => {
    setWorkOnImplementationPM("");
  };

  useEffect(() => {
    postMachineIdToGetAllDetailsOfMachine();
  }, [workOnImplementationPM]);

  const handleCheckSheetApprovalEditShowAndCloseState = () => {
    setCheckSheetApprovalEditModalOpenClose(
      (checkSheetApprovalEditModalOpenClose) =>
        !checkSheetApprovalEditModalOpenClose
    );
  };
  return (
    <>
      {checkSheetApprovalEditModalOpenClose && (
        <AddApproverNameIfNotAvailableInCheckSheet
          selectedYear={selectedYear}
          machine_code={selectedRow?.machine_code}
          listOfAllApproverAndOtherData={listOfAllApproverAndOtherData}
          modelProp={{
            show: checkSheetApprovalEditModalOpenClose,
            onHide: () => handleCheckSheetApprovalEditShowAndCloseState(),
          }}
          postMachineIdToGetAllDetailsOfMachine={
            postMachineIdToGetAllDetailsOfMachine
          }
        />
      )}
      {workOnImplementationPM}
      <Modal
        {...modelProp}
        fullscreen
        aria-labelledby="contained-modal-title-vcenter"
        centered
        enforceFocus={false}
        scrollable={true}
      >
        <Modal.Header className="d-flex justify-content-between">
          <Modal.Title id="contained-modal-title-vcenter">
            Check-Sheet Edit After Approval
          </Modal.Title>
          <Button
            variant="secondary"
            onClick={modelProp?.onHide}
            className="btn-danger"
          >
            Close
          </Button>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Container fluid>
              <Row>
                <Col sm={12} md={6}></Col>
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
                          <b>Line:</b>- {selectedRow?.line_names.line_name}
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
                                machineAllData?.checkSheet_data?.approved_by_HOS
                                  ?.length - 1
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
                    <thead className="mt-5">
                      <tr>
                        {columns.map((tColumn) => (
                          <th
                            className={
                              tColumn.header === ""
                                ? "ar-table-thead-header3"
                                : "ar-table-thead-header"
                            }
                          >
                            {machineAllData?.checkSheet_data
                              ?.currentMonthScheduleOrNotStatus?.[
                              tColumn?.header
                            ] === "Scheduled" ? (
                              new Date().getMonth() > 2 ? (
                                moment().month(tColumn.header).format("M") -
                                  1 <=
                                  new Date().getMonth() &&
                                moment().month(tColumn.header).format("M") >
                                  3 ? (
                                  <>
                                    <button
                                      className="editAfterApprovalPmImplementationBtn"
                                      onClick={() => {
                                        handleCheckSheetApprovalEditShowAndCloseState();
                                        setListOfAllApproverAndOtherData({
                                          ...listOfAllApproverAndOtherData,
                                          selectedMonth: tColumn?.header,
                                        });
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <br />
                                    {tColumn.header}
                                  </>
                                ) : (
                                  tColumn.header
                                )
                              ) : moment().month(tColumn.header).format("M") >
                                3 ? (
                                <>
                                  <button className="editAfterApprovalPmImplementationBtn">
                                    Edit
                                  </button>
                                  <br />
                                  {tColumn.header}
                                </>
                              ) : (
                                tColumn.header
                              )
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
                            rData[10]?.["key"] === "isDeleted" &&
                            rData[10]?.["value"] === true
                              ? "ar-table-row table-col-mid-year-delete"
                              : "ar-table-row"
                          }
                        >
                          {" "}
                          {rData.map((colData) =>
                            machineAllData?.checkSheet_data
                              ?.checksheet_status === "Implementation" ? (
                              //    && context?.user_type === "Operator"
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
                                        colData.key === "judgement_criteria" ||
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
                                    colData.key !== "inspection_parent_name" &&
                                    colData.key !== "inspection_point" &&
                                    colData.key !== "judgement_criteria" &&
                                    colData.key !== "action" ? (
                                    colData.value.length === 1 ? (
                                      <>
                                        <p style={{ fontWeight: "900" }}>--&gt;</p>
                                        {rData[10]?.["key"] !== "isDeleted" &&
                                        new Date().getMonth() > 2
                                          ? moment()
                                              .month(colData.key)
                                              .format("M") -
                                              1 <=
                                              new Date().getMonth() &&
                                            moment()
                                              .month(colData.key)
                                              .format("M") > 3 && (
                                              <button
                                                className="commonBtn pmImplementationBtn"
                                                id={rData[0].value}
                                                onClick={() => {
                                                  setWorkOnImplementationPM(
                                                    <EditModalForPlanVsActualBySelectedUser
                                                      close={close}
                                                      machineId={
                                                        machineAllData.machine_code
                                                      }
                                                      tableRowId={
                                                        rData[0].value
                                                      }
                                                      tableRowIdForSrNo={
                                                        rData[1].value
                                                      }
                                                      yearOfCheckSheet={
                                                        machineAllData
                                                          ?.checkSheet_data
                                                          .current_year
                                                      }
                                                      monthForCompareSystemMonth={
                                                        colData.key
                                                      }
                                                      postMachineIdToGetAllDetailsOfMachine={
                                                        postMachineIdToGetAllDetailsOfMachine
                                                      }
                                                    />
                                                  );
                                                }}
                                              >
                                                Edit
                                              </button>
                                            )
                                          : moment()
                                              .month(colData.key)
                                              .format("M") > 3 &&
                                            rData[10]?.["key"] !==
                                              "isDeleted" && (
                                              <button
                                                className="commonBtn pmImplementationBtn"
                                                id={rData[0].value}
                                                onClick={() => {
                                                  setWorkOnImplementationPM(
                                                    <EditModalForPlanVsActualBySelectedUser
                                                      close={close}
                                                      machineId={
                                                        machineAllData.machine_code
                                                      }
                                                      tableRowId={
                                                        rData[0].value
                                                      }
                                                      tableRowIdForSrNo={
                                                        rData[1].value
                                                      }
                                                      yearOfCheckSheet={
                                                        machineAllData
                                                          ?.checkSheet_data
                                                          .current_year
                                                      }
                                                      monthForCompareSystemMonth={
                                                        colData.key
                                                      }
                                                      postMachineIdToGetAllDetailsOfMachine={
                                                        postMachineIdToGetAllDetailsOfMachine
                                                      }
                                                    />
                                                  );
                                                }}
                                              >
                                                Edit
                                              </button>
                                            )}
                                      </>
                                    ) : colData.value.length === 1 &&
                                      colData.value[0] === "1" ? (
                                      <>
                                        <p style={{ fontWeight: "900" }}>--&gt;</p>
                                        {rData[10]?.["key"] !== "isDeleted" && (
                                          <button
                                            className="commonBtn pmImplementationBtn"
                                            id={rData[0].value}
                                            onClick={() => {
                                              setWorkOnImplementationPM(
                                                <EditModalForPlanVsActualBySelectedUser
                                                  close={close}
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
                                                    colData.key
                                                  }
                                                  postMachineIdToGetAllDetailsOfMachine={
                                                    postMachineIdToGetAllDetailsOfMachine
                                                  }
                                                />
                                              );
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </>
                                    ) : colData.value[0] === "1" &&
                                      (colData.value[1] === "Yes" ||
                                        colData.value[1] === "Rectify") ? (
                                      <>
                                        <div style={{ fontWeight: "900" }}>
                                          --&gt;
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
                                        {rData[10]?.["key"] !== "isDeleted" &&
                                          moment()
                                            .month(colData.key)
                                            .format("M") -
                                            1 <=
                                            new Date().getMonth() &&
                                          moment()
                                            .month(colData.key)
                                            .format("M") > 3 && (
                                            <button
                                              className="commonBtn pmImplementationBtn"
                                              id={rData[0].value}
                                              onClick={() => {
                                                setWorkOnImplementationPM(
                                                  <EditModalForPlanVsActualBySelectedUser
                                                    close={close}
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
                                                      colData.key
                                                    }
                                                    postMachineIdToGetAllDetailsOfMachine={
                                                      postMachineIdToGetAllDetailsOfMachine
                                                    }
                                                  />
                                                );
                                              }}
                                            >
                                              Edit
                                            </button>
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
                                        {rData[10]?.["key"] !== "isDeleted" && (
                                          <button
                                            className="commonBtn pmImplementationBtn"
                                            id={rData[0].value}
                                            onClick={() => {
                                              setWorkOnImplementationPM(
                                                <EditModalForPlanVsActualBySelectedUser
                                                  close={close}
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
                                                    colData.key
                                                  }
                                                  postMachineIdToGetAllDetailsOfMachine={
                                                    postMachineIdToGetAllDetailsOfMachine
                                                  }
                                                />
                                              );
                                            }}
                                          >
                                            Edit
                                          </button>
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
                                        --&gt;
                                      </p>
                                    ) : colData.value.length === 2 &&
                                      colData.value[0] === "1" &&
                                      colData.value[1] === "skip" ? (
                                      <p
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ fontWeight: "900" }}
                                      >
                                        {" "}
                                        --&gt;
                                      </p>
                                    ) : colData.value.length === 1 &&
                                      colData.value[0] === "2" ? (
                                      <>
                                        <p
                                          className="d-flex justify-content-center align-items-center"
                                          style={{ fontWeight: "900" }}
                                        >
                                          {" "}
                                          --&gt;
                                        </p>
                                        {rData[10]?.["key"] !== "isDeleted" && (
                                          <button
                                            className="commonBtn pmImplementationBtn"
                                            id={rData[0].value}
                                            onClick={() => {
                                              setWorkOnImplementationPM(
                                                <EditModalForPlanVsActualBySelectedUser
                                                  close={close}
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
                                                    colData.key
                                                  }
                                                  postMachineIdToGetAllDetailsOfMachine={
                                                    postMachineIdToGetAllDetailsOfMachine
                                                  }
                                                />
                                              );
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </>
                                    ) : colData.value.length === 2 &&
                                      colData.value[0] === "2" &&
                                      colData.value[1] === "skip_previous" ? (
                                      <p
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ fontWeight: "900" }}
                                      >
                                        {" "}
                                        --&gt;
                                      </p>
                                    ) : (
                                      <>
                                        <div style={{ fontWeight: "900" }}>
                                          --&gt; *
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
                                        {rData[10]?.["key"] !== "isDeleted" && (
                                          <button
                                            className="commonBtn pmImplementationBtn"
                                            id={rData[0].value}
                                            onClick={() => {
                                              setWorkOnImplementationPM(
                                                <EditModalForPlanVsActualBySelectedUser
                                                  close={close}
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
                                                    colData.key
                                                  }
                                                  postMachineIdToGetAllDetailsOfMachine={
                                                    postMachineIdToGetAllDetailsOfMachine
                                                  }
                                                />
                                              );
                                            }}
                                          >
                                            Edit
                                          </button>
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
                                      colData.key === "inspection_child_name" ||
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
                                    ?.implemetation_completed_tm_name?.[month] ||
                                    []),
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
                                      ?.implementation_assign_PRD_TL_name[
                                      month
                                    ][
                                      machineAllData?.checkSheet_data
                                        ?.implementation_assign_PRD_TL_name[
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
              </Row>
            </Container>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CheckSheetEditAfterApproval;
