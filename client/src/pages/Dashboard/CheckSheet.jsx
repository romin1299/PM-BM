import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import Rows from "../Section/Checksheet/row";
import "../Section/Checksheet/index.css";
import {
  useContext,
  MaterialTable,
  tableIcons,
} from "../../modules/PageModules";
import RoutingContext from "../../context/routing/RoutingContext";
import TextField from "@material-ui/core/TextField";
import { useLocation } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import EastIcon from "@mui/icons-material/East";
import SummeryPopups from "../Operator/PopupsForChecksheet/SummeryPopups";

function CheckSheet({ machineData, lineName, closeCheckSheet }) {
  const context = useContext(RoutingContext);
  const [newTableData, setNewTableData] = useState([]);
  const [refKey, setRefKey] = useState("");
  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const location = useLocation();
  let machineAllData = machineData;

  // console.log(
  //   machineAllData?.checkSheet_data?.implementation_approved_by_MTD_HOD
  // );

  // console.log(location.state);
  let tableData = machineData?.checkSheet_data?.checkSheet;
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
  const [stateForOpeningSummeryPopups, setStateForOpeningSummeryPopups] =
    useState("");

  const close = () => {
    setStateForOpeningSummeryPopups("");
    document.querySelector(".checkSheetForImplementation").style.pointerEvents =
      "auto";
  };

  const funForOpeningSummeryPopups = () => {
    setStateForOpeningSummeryPopups(
      <SummeryPopups close={close} tableData={tableData} />
    );
    document.querySelector(".checkSheetForImplementation").style.pointerEvents =
      "none";
  };

  // console.log(selectedMachineCheckSheetData.state.selectedRowForViewForm);
  return (
    <>
      {stateForOpeningSummeryPopups}
      <div className="checkSheetForImplementation">
        <div className="row">
          <div className="col-1">
            <button
              className="btn-closeForChecksheet"
              onClick={closeCheckSheet}
            >
              Close
            </button>
          </div>
          <div className="col-11"></div>
        </div>

        <br />
        <div>
          <Container fluid>
            <Row>
              <Col lg={6} md={6} sm={6}>
                {" "}
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
                        {machineAllData?.checkSheet_data?.approved_by_PRD_TL?.[
                          machineAllData?.checkSheet_data?.approved_by_PRD_TL
                            ?.length - 1
                        ]
                          ? `${
                              machineAllData?.checkSheet_data
                                ?.approved_by_PRD_TL[
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
                        {machineAllData?.checkSheet_data
                          ?.plan_prepared_tm_name?.[
                          machineAllData?.checkSheet_data?.plan_prepared_tm_name
                            ?.length - 1
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
                        className="ar-table-thead-header2 headerPD1"
                        colSpan={3}
                        rowSpan={5}
                      >
                        <b>Line:</b> {lineName}
                        <br />
                        M/c No : {machineAllData?.machine_code}
                      </th>
                      <th
                        className="ar-table-thead-header2 headerPD1"
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
                          machineAllData?.checkSheet_data?.approved_by_TL
                            .length - 1
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
                    {newTableData.map((rData, rIndex) => (
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
                          colData.print == true ? (
                            <td
                              className={
                                colData.value === ""
                                  ? "ar-table-col2"
                                  : colData.key === "inspection_parent_name" ||
                                    colData.key === "inspection_child_name" ||
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
                              colData.key !== "PM_time" ? (
                                ""
                              ) : (colData.value[0] === "1" ||
                                  colData.value[0] === "2") &&
                                colData.key !== "tableRowId" &&
                                colData.key !== "cycle" &&
                                colData.key !== "PM_time" ? (
                                colData.value.length === 1 &&
                                colData.key === monthForCompareSystemMonth ? (
                                  <>
                                    {" "}
                                    <div style={{ fontWeight: "900" }}>--></div>
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
                        ? Object.values(
                            machineAllData?.checkSheet_data?.PMworkedTMName
                          ).map((index) => (
                            <td className="ar-table-col1">
                              {index.join(" ,")}
                            </td>
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
                  <div>
                    <MaterialTable
                      style={{ boxShadow: "none" }}
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
                      data={
                        machineAllData?.checkSheet_data?.revisionContentData
                      }
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

                          // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                          // color:"rgba(255,255,255,0.8)",
                          borderRadius: "5px",
                          border: "1px solid black",
                          // WebkitBackdropFilter: "blur( 2px )",
                          background: "rgba(255,255,255,0.1)",
                          // backdropFilter: "blur(5px)",
                        },
                        cellStyle: {
                          border: "1px solid black",
                        },
                        headerStyle: {
                          border: "1px solid black",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </div>
                </div>
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
                {machineAllData?.checkSheet_data
                  ?.implemetation_prd_tl_approval_status ||
                machineAllData?.checkSheet_data
                  ?.implemetation_mtd_tl_approval_status ||
                machineAllData?.checkSheet_data
                  ?.implemetation_mtd_hos_approval_status ? (
                  machineAllData?.checkSheet_data
                    ?.implemetation_prd_tl_approval_status[
                    monthForCompareSystemMonth
                  ] !== "Rejected" ||
                  machineAllData?.checkSheet_data
                    ?.implemetation_mtd_tl_approval_status[
                    monthForCompareSystemMonth
                  ] !== "Rejected" ||
                  machineAllData?.checkSheet_data
                    ?.implemetation_mtd_hos_approval_status[
                    monthForCompareSystemMonth
                  ] !== "Rejected" ? (
                    <>
                      <Row className=" m-2 p-3 border bg-white rounded">
                        <Col>
                          {machineAllData?.checkSheet_data?.PMDelayRemark ? (
                            machineAllData?.checkSheet_data?.PMDelayRemark[
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
                                      ?.PMDelayRemark[
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
                                  // value={formik.values.delayRemarks}
                                  placeholder={
                                    machineAllData?.checkSheet_data
                                      ?.PMDelayRemark[
                                      monthForCompareSystemMonth
                                    ]
                                      ? machineAllData?.checkSheet_data
                                          .PMDelayRemark[
                                          monthForCompareSystemMonth
                                        ]
                                      : ""
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
                              style={{ textAlign: "left", fontWeight: "bold" }}
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
                                  ? machineAllData?.checkSheet_data?.PMStatus[
                                      monthForCompareSystemMonth
                                    ] === ""
                                    ? "Not schedule"
                                    : machineAllData?.checkSheet_data?.PMStatus[
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
                              style={{ textAlign: "left", fontWeight: "bold" }}
                            >
                              PM Time:{" "}
                            </span>
                            <TextField
                              type="text"
                              className="col-8"
                              name="pmTime"
                              autoComplete="off"
                              value={
                                machineAllData?.checkSheet_data?.totalPMTime
                                  ? machineAllData?.checkSheet_data
                                      ?.totalPMTime[monthForCompareSystemMonth]
                                      .totalWorkedPMTime === ""
                                    ? "0"
                                    : machineAllData?.checkSheet_data
                                        ?.totalPMTime[
                                        monthForCompareSystemMonth
                                      ].totalWorkedPMTime
                                  : ""
                              }
                            />
                          </div>
                          <div className="mb-2 row">
                            <span
                              className="col-3"
                              style={{ textAlign: "left", fontWeight: "bold" }}
                            >
                              Supporting TM:{" "}
                            </span>
                            <TextField
                              type="text"
                              className="col-8"
                              name="supportingOperator"
                              multiline
                              autoComplete="off"
                              value={
                                machineAllData?.checkSheet_data?.totalPMTime
                                  ? machineAllData?.checkSheet_data?.totalPMTime[
                                      monthForCompareSystemMonth
                                    ].supportingTMData.map(
                                      (index) => index.tm_name
                                    )
                                  : ""
                              }
                            />
                          </div>
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <>
                      <Row className=" m-2 p-3 border bg-white rounded">
                        <Col>
                          {machineAllData?.checkSheet_data?.PMDelayRemark ? (
                            machineAllData?.checkSheet_data?.PMDelayRemark[
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
                                      ?.PMDelayRemark[
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
                                  // value={formik.values.delayRemarks}
                                  placeholder={
                                    machineAllData?.checkSheet_data
                                      ?.PMDelayRemark[
                                      monthForCompareSystemMonth
                                    ]
                                      ? machineAllData?.checkSheet_data
                                          .PMDelayRemark[
                                          monthForCompareSystemMonth
                                        ]
                                      : ""
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
                              style={{ textAlign: "left", fontWeight: "bold" }}
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
                                  ? machineAllData?.checkSheet_data?.PMStatus[
                                      monthForCompareSystemMonth
                                    ] === ""
                                    ? "Not schedule"
                                    : machineAllData?.checkSheet_data?.PMStatus[
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
                              style={{ textAlign: "left", fontWeight: "bold" }}
                            >
                              PM Time:{" "}
                            </span>
                            <TextField
                              type="text"
                              className="col-8"
                              name="pmTime"
                              autoComplete="off"
                              value={
                                machineAllData?.checkSheet_data?.totalPMTime
                                  ? machineAllData?.checkSheet_data
                                      ?.totalPMTime[monthForCompareSystemMonth]
                                      .totalWorkedPMTime === ""
                                    ? "0"
                                    : machineAllData?.checkSheet_data
                                        ?.totalPMTime[
                                        monthForCompareSystemMonth
                                      ].totalWorkedPMTime
                                  : ""
                              }
                            />
                          </div>
                          <div className="mb-2 row">
                            <span
                              className="col-3"
                              style={{ textAlign: "left", fontWeight: "bold" }}
                            >
                              Supporting TM:{" "}
                            </span>
                            <TextField
                              type="text"
                              className="col-8"
                              name="supportingOperator"
                              multiline
                              autoComplete="off"
                              value={
                                machineAllData?.checkSheet_data?.totalPMTime
                                  ? machineAllData?.checkSheet_data?.totalPMTime[
                                      monthForCompareSystemMonth
                                    ].supportingTMData.map(
                                      (index) => index.tm_name
                                    )
                                  : ""
                              }
                            />
                          </div>
                          <div className="mb-2 row">
                            <span
                              className="col-3"
                              style={{ textAlign: "left" }}
                            >
                              Rejected remarks:{" "}
                            </span>
                            <TextField
                              type="text"
                              className="col-8"
                              name="implementation_rejected_remarks"
                              autoComplete="off"
                              value={
                                machineAllData?.checkSheet_data
                                  .implementation_rejected_remarks
                                  ? machineAllData?.checkSheet_data
                                      .implementation_rejected_remarks[
                                      monthForCompareSystemMonth
                                    ]
                                  : ""
                              }
                            />
                          </div>
                        </Col>
                      </Row>
                    </>
                  )
                ) : (
                  ""
                )}
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </>
  );
}

export default CheckSheet;
