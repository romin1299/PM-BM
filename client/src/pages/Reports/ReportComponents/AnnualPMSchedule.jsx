import React, { useState, useEffect, useContext } from "react";
import MaterialTable from "@material-table/core";
// import { ExportCsv, ExportPdf } from "@material-table/exporters";
import { jsPDF } from "jspdf";
import { CSVLink, CSVDownload } from "react-csv";
import { Row, Col, Container, Button } from "react-bootstrap";

import CircleIcon from "@mui/icons-material/Circle";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";

import * as yup from "yup";
import { useFormik } from "formik";

import RoutingContext from "../../../context/routing/RoutingContext";

import LoadingAnimation from "./LoadingAnimation";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";

import DefaultMonthlyApprovalComponent from "./AnnualPmScheduleReportSubComponent/DefaultMonthlyApprovalComponent";
import MonthlyApprovalComponentAfterAllApproval from "./AnnualPmScheduleReportSubComponent/MonthlyApprovalComponentAfterAllApproval";
import SendApprovalComponent from "./AnnualPmScheduleReportSubComponent/SendApprovalComponent";
import Footer from "../../../components/Footer/Footer";

// import PopupForAnnualPmScheduleReport from "../../../Popups/PopupForAnnualPmScheduleReport";

const AnnualPMSchedule = () => {
  const context = useContext(RoutingContext);

  // console.log(context);

  const [allUserDropdownList, setAllUserDropdownList] = useState([]);

  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [selectedCell, setSelectedCell] = useState("");

  const [lineDropdown, setLineDropdown] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [indexOfSelectedLine, setIndexOfSelectedLine] = useState(0);

  const [
    refKeyForPostLineToGetMachineDataApi,
    setRefKeyForPostLineToGetMachineDataApi,
  ] = useState(0);

  const [objOfAnnualPmScheduleApproval, setObjOfAnnualPmScheduleApproval] =
    useState({});

  const [refKeyForAnimation, setRefKeyForAnimation] = useState(
    <LoadingAnimation />
  );

  const [
    stateForMonthlyApprovalComponent,
    setStateForMonthlyApprovalComponent,
  ] = useState(<DefaultMonthlyApprovalComponent />);

  const [
    stateForSendingApprovalDashboard,
    setStateForSendingApprovalDashboard,
  ] = useState();

  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  // console.log(context?.user_type, context?.?.tm_grade);

  const postSectionToGetCellDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedYear,
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data?.lineData?.[0]._id);
        setAllDataSectionWise(data);

        postCellToGetLineList(data?.cellData?.[0]._id);

        // let finalData = await data.machineData?.map((item) => item?.line_names);

        // console.log(finalData);

        // getDataModelled(finalData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPlantToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postPlantToGetCellData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plant: context.plant_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data?.lineData?.[0]._id);
        setAllDataSectionWise(data);

        // console.log("***************", data);

        postCellToGetLineList(data?.cellData?.[0]._id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setSelectedCell("");

    if (context?.user_type === "Plant-Admin" && context?.tm_grade === "HOD") {
      postPlantToGetAllDataForMainDashboard();
    } else {
      postSectionToGetCellDataForMainDashboard();
    }
  }, [selectedYear]);

  const postCellToGetLineList = async (selectedCell, refKey) => {
    if (!refKey) {
      setSelectedLine(undefined);
      setIndexOfSelectedLine(0);
    }

    try {
      const res = await fetch("/postCellToGetLineListForReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cell: selectedCell || allDataSectionWise?.cellData?.[0]._id,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        setLineDropdown(data.lineInfo);
        // console.log("Data post", data);
        if (data?.lineInfo.length > 0) {
          postLineToGetMachineList(selectedLine || data?.lineInfo?.[0]._id);
        } else {
          setTableData([]);
        }

        // console.log(selectedLine, data?.lineInfo?.[0]._id);

        // setLineList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postLineToGetMachineList = async (selectedLine) => {
    // console.log(selectedLine);
    try {
      const res = await fetch("/postLineToGetMachineListForReportDashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post", data?.machineInfo);
        setTableData(data?.machineInfo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(
  //   // selectedCell,
  //   selectedLine,
  //   // tableData,
  //   lineDropdown?.[indexOfSelectedLine]
  // );

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
      console.log(data);

      // data?.allUser?.map((item) => console.log(item?.plant_data));
      setAllUserDropdownList(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListForApproval();
  }, []);

  let columns = [
    "Line Name",

    "SN",

    "Machine Name",

    "Machine No",

    "Apr",

    "May",

    "June",

    "July",

    "Aug",

    "Sep",

    "Oct",

    "Nov",

    "Dec",

    "Jan",

    "Feb",

    "Mar",
  ];

  let columnForHeading1 = ["Product", "Fiscal year"];
  let columnForHeading2 = [
    "Accepted By (PRD HOS)",
    "Approved By (MTD HOD)",
    "Checked By (MTD HOS)",
    "Prepared By (MTD TL)",
  ];

  // console.log(tableData);

  useEffect(() => {
    setRefKeyForAnimation(<LoadingAnimation />);

    setTimeout(() => {
      setRefKeyForAnimation("");
    }, 3000);
  }, [selectedCell, selectedLine]);

  const validationSchema = yup.object({
    selectedPrdHos: yup.string().required("Please select PRD HOS"),
    selectedMtdHod: yup.string().required("Please select MTD HOD"),
    selectedMtdHos: yup.string().required("Please select MTD HOS"),
  });

  const formik = useFormik({
    initialValues: {
      selectedPrdHos: "",
      selectedMtdHod: "",
      selectedMtdHos: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      //e.preventDefault();
      // console.log(values);
      const res = await fetch("/annualPmScheduleApproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedLine: lineDropdown?.[indexOfSelectedLine],
          // selectedLine: selectedLine ? selectedLine : lineDropdown?.[0]?._id,
          selectedPrdHos: values.selectedPrdHos,
          selectedMtdHod: values.selectedMtdHod,
          selectedMtdHos: values.selectedMtdHos,
          selectedMtdTl: context?._id,
        }),
      });

      const data = res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Error");
      } else {
        console.log("Updated SuccessFully");
        postCellToGetLineList(selectedCell, "AfterApproval");
        // postLineToGetMachineList(selectedLine || lineDropdown?.[0]?._id);
        setRefKeyForPostLineToGetMachineDataApi(
          (refKeyForPostLineToGetMachineDataApi) =>
            refKeyForPostLineToGetMachineDataApi + 1
        );
        // window.alert("New password generation successfully !!!");
      }
    },
  });
  // console.log(lineDropdown?.[indexOfSelectedLine]);

  const approveRequest = async (
    lineData,
    ID,
    supportingKey,
    objOfAnnualPmScheduleApproval
  ) => {
    const res = await fetch("/approveRequestForAnnualPmSchedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineData,
        ID,
        supportingKey,
        objOfAnnualPmScheduleApproval,
      }),
    });

    const data = res.json();

    if (res.status === 400 || res.status === 422 || !data) {
      console.log("Error");
    } else {
      console.log("Updated SuccessFully");
      postCellToGetLineList(selectedCell, "AfterApproval");
      // postLineToGetMachineList(selectedLine || lineDropdown?.[0]?._id);
      setRefKeyForPostLineToGetMachineDataApi(
        (refKeyForPostLineToGetMachineDataApi) =>
          refKeyForPostLineToGetMachineDataApi + 1
      );
    }
  };

  const funForRefreshingDataAfterApproval = () => {
    postCellToGetLineList(selectedCell, "AfterApproval");
    // postLineToGetMachineList(selectedLine || lineDropdown?.[0]?._id);
    setRefKeyForPostLineToGetMachineDataApi(
      (refKeyForPostLineToGetMachineDataApi) =>
        refKeyForPostLineToGetMachineDataApi + 1
    );
  };

  // context?.tm_department === "MTD" && context?.tm_grade === "TL" ?
  // console.log(lineDropdown?.[indexOfSelectedLine]?.annualPmScheduleApproval);

  useEffect(() => {
    // console.log(
    //   "================ 295",
    //   lineDropdown?.[indexOfSelectedLine]?.annualPmScheduleApproval
    // );
    if (lineDropdown?.length > 0) {
      if (
        lineDropdown?.[indexOfSelectedLine]?.annualPmScheduleApproval?.length >
        0
      ) {
        lineDropdown?.[indexOfSelectedLine]?.annualPmScheduleApproval?.map(
          (item) => {
            if (item?.current_year === selectedYear) {
              // console.log("&&&&&&&&&&&&&&&&&&", item);
              setObjOfAnnualPmScheduleApproval(item);
            }
          }
        );
      }
    }
  }, [
    lineDropdown,
    indexOfSelectedLine,
    refKeyForPostLineToGetMachineDataApi,
    selectedYear,
  ]);

  useEffect(() => {
    if (
      objOfAnnualPmScheduleApproval?.mtdHos?.mtdHosApprovalStatus ===
        "Accepted" &&
      objOfAnnualPmScheduleApproval?.mtdHod?.mtdHodApprovalStatus ===
        "Accepted" &&
      objOfAnnualPmScheduleApproval?.prdHos?.prdHosApprovalStatus === "Accepted"
    ) {
      setStateForMonthlyApprovalComponent(
        <MonthlyApprovalComponentAfterAllApproval
          loggedUserDetails={context}
          lineInfo={lineDropdown?.[indexOfSelectedLine]}
          objOfAnnualPmScheduleApproval={objOfAnnualPmScheduleApproval}
          selectedYear={selectedYear}
          funForRefreshingDataAfterApproval={funForRefreshingDataAfterApproval}
        />
      );

      if (
        context?.user_type === "TL/HOSS" &&
        context?.tm_department === "MTD" &&
        objOfAnnualPmScheduleApproval?.prdHos?.prdHosApprovalStatus ===
          "Accepted"
      ) {
        setStateForSendingApprovalDashboard(
          <SendApprovalComponent
            loggedUserDetails={context}
            lineInfo={lineDropdown?.[indexOfSelectedLine]}
            objOfAnnualPmScheduleApproval={objOfAnnualPmScheduleApproval}
            selectedYear={selectedYear}
            allUserDropdownList={allUserDropdownList}
            funForRefreshingDataAfterApproval={
              funForRefreshingDataAfterApproval
            }
          />
        );
      }
    } else {
      setStateForMonthlyApprovalComponent(<DefaultMonthlyApprovalComponent />);
      setStateForSendingApprovalDashboard();
    }

    // console.log(
    //   "------------------------------------->",
    //   objOfAnnualPmScheduleApproval?.mtdHos?.mtdHosApprovalStatus ===
    //     "Accepted" &&
    //     objOfAnnualPmScheduleApproval?.mtdHod?.mtdHodApprovalStatus ===
    //       "Accepted" &&
    //     objOfAnnualPmScheduleApproval?.prdHos?.prdHosApprovalStatus ===
    //       "Accepted"
    // );

    //     <MonthlyApprovalComponentAfterAllApproval />
    // <MonthlyApprovalDefaultComponent />
  }, [objOfAnnualPmScheduleApproval]);

  // console.log(
  //   "421 @@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  //   objOfAnnualPmScheduleApproval
  // );

  // console.log(allUserDropdownList);
  return (
    <>
      <div>
        <div className="pt-4">
          {/* <PopupForAnnualPmScheduleReport /> */}

          <Container fluid>
            <Row className="gy-2">
              <Col sm={6} md={6} lg={4}>
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col sm={6} md={6} lg={4}>
                <span>
                  <b>Cell: &nbsp;</b>
                </span>

                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  // style={{ width: "100%" }}
                  id="standard-select-currency"
                  name="selectedCell"
                  value={
                    selectedCell === ""
                      ? allDataSectionWise?.cellData?.[0]?.cell_name
                      : selectedCell
                  }
                  className="textField w-50"
                  onChange={(e) => {
                    // console.log(e.target.value);
                    setSelectedCell(e.target.value);
                    postCellToGetLineList(e.target.value);
                  }}
                  // fullWidth
                  select // label="Select"
                  autoComplete="off"
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {allDataSectionWise?.cellData?.map((option) => {
                    return (
                      <option value={option?._id}>{option?.cell_name}</option>
                    );
                  })}
                </select>
              </Col>
              <Col sm={6} md={6} lg={4}>
                <span>
                  <b>Line:&nbsp;</b>
                </span>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  // style={{ width: "100%" }}
                  id="standard-select-currency"
                  name="selectedPlant"
                  value={
                    // selectedLine || lineDropdown?.[0]?.line_name
                    selectedLine === undefined
                      ? lineDropdown?.[0]?.line_name
                      : lineDropdown?.[parseInt(selectedLine)]?._id
                  }
                  className="textField w-50"
                  onChange={(e) => {
                    // setSelectedLine(e.target.value);
                    setObjOfAnnualPmScheduleApproval({});

                    setIndexOfSelectedLine(e.target.value);
                    setSelectedLine(lineDropdown?.[e.target.value]?._id);
                    postLineToGetMachineList(
                      lineDropdown?.[e.target.value]?._id
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
                  {lineDropdown?.map((option, index) => {
                    return <option value={index}>{option?.line_name}</option>;
                  })}
                </select>
              </Col>
            </Row>
          </Container>
          <Container fluid>
            <Row>
              <Col sm={12} md={12} lg={2}>
                <h4 className="annualPmScheduleHeading">Annual PM Schedule</h4>
              </Col>
              <Col sm={12} md={12} lg={4} className="text-center">
                <table className="ar-table  td-padding pmSheetApprovalTableCol1">
                  <thead className="mt-5">
                    <tr>
                      {columnForHeading1.map((item) => (
                        <th className={"td-padding"}>{item}</th>
                      ))}
                    </tr>
                    <tr>
                      <td className={"td-padding"}>
                        {selectedCell
                          ? allDataSectionWise?.cellData?.map((option) =>
                              option?._id === selectedCell
                                ? option?.cell_name
                                : ""
                            )
                          : allDataSectionWise?.cellData?.[0]?.cell_name}
                      </td>
                      <td className={"td-padding"}>{selectedYear}</td>
                    </tr>
                  </thead>
                </table>
              </Col>

              <Col>
                <table className="ar-table td-padding pmSheetApprovalTableCol1">
                  <thead className="mt-5">
                    <tr>
                      {columnForHeading2.map((item) => (
                        <th className={"td-padding"}>{item}</th>
                      ))}
                    </tr>
                    {tableData?.length > 0 ? (
                      lineDropdown?.length > 0 ? (
                        lineDropdown?.[indexOfSelectedLine]
                          ?.annualPmScheduleApproval?.length > 0 &&
                        objOfAnnualPmScheduleApproval?.mtdTlId ? (
                          selectedYear === currentYear ? (
                            <tr>
                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {objOfAnnualPmScheduleApproval?.prdHos
                                    ?.prdHosApprovalStatus === "Accepted" ? (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.prdHos
                                          ?.prdHosId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {
                                        objOfAnnualPmScheduleApproval?.prdHos
                                          ?.prdHosApprovalStatus
                                      }
                                    </>
                                  ) : objOfAnnualPmScheduleApproval?.prdHos
                                      ?.prdHosId?._id === context?._id &&
                                    objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodApprovalStatus === "Accepted" ? (
                                    <Button
                                      onClick={() =>
                                        approveRequest(
                                          lineDropdown?.[indexOfSelectedLine],
                                          "prdHos", //Current Key
                                          "mtdTlId", //Supporting Key for sending mail to next approval user
                                          objOfAnnualPmScheduleApproval
                                        )
                                      }
                                    >
                                      Accept
                                    </Button>
                                  ) : (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.prdHos
                                          ?.prdHosId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {console.log(
                                        objOfAnnualPmScheduleApproval?.prdHos
                                      )}
                                      {
                                        objOfAnnualPmScheduleApproval?.prdHos
                                          ?.prdHosApprovalStatus
                                      }
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {objOfAnnualPmScheduleApproval?.mtdHod
                                    ?.mtdHodApprovalStatus === "Accepted" ? (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHod
                                          ?.mtdHodId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHod
                                          ?.mtdHodApprovalStatus
                                      }
                                    </>
                                  ) : objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodId?._id === context?._id &&
                                    objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosApprovalStatus === "Accepted" ? (
                                    <Button
                                      onClick={() =>
                                        approveRequest(
                                          lineDropdown?.[indexOfSelectedLine],
                                          "mtdHod", //Current Key
                                          "prdHos", //Supporting Key for sending mail to next approval user
                                          objOfAnnualPmScheduleApproval
                                        )
                                      }
                                    >
                                      Accept
                                    </Button>
                                  ) : (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHod
                                          ?.mtdHodId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHod
                                          ?.mtdHodApprovalStatus
                                      }
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {objOfAnnualPmScheduleApproval?.mtdHos
                                    ?.mtdHosApprovalStatus === "Accepted" ? (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHos
                                          ?.mtdHosId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHos
                                          ?.mtdHosApprovalStatus
                                      }
                                    </>
                                  ) : objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosId._id === context?._id &&
                                    objOfAnnualPmScheduleApproval?.mtdTlId
                                      ?.tm_name ? (
                                    <Button
                                      onClick={() =>
                                        approveRequest(
                                          lineDropdown?.[indexOfSelectedLine],
                                          "mtdHos", //Current Key
                                          "mtdHod", //Supporting Key for sending mail to next approval user
                                          objOfAnnualPmScheduleApproval
                                        )
                                      }
                                    >
                                      Accept
                                    </Button>
                                  ) : (
                                    <>
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHos
                                          ?.mtdHosId?.tm_name
                                      }
                                      <br />
                                      Status:{" "}
                                      {
                                        objOfAnnualPmScheduleApproval?.mtdHos
                                          ?.mtdHosApprovalStatus
                                      }
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdTlId
                                      ?.tm_name
                                  }
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.prdHos
                                      ?.prdHosId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.prdHos
                                      ?.prdHosApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdTlId
                                      ?.tm_name
                                  }
                                </div>
                              </td>
                            </tr>
                          )
                        ) : context?.tm_department === "MTD" &&
                          context?.user_type === "TL/HOSS" ? (
                          selectedYear === currentYear ? (
                            <tr>
                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  <select
                                    class="form-select form-select-sm"
                                    aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="selectedPrdHos"
                                    className="textField"
                                    value={formik.values.selectedPrdHos}
                                    onChange={formik.handleChange}
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {allUserDropdownList?.allUser?.map(
                                      (option, index) =>
                                        option?.tm_department === "PRD" &&
                                        option?.tm_grade === "HOS" &&
                                        option?.user_type ===
                                          "Section-Admin" ? (
                                          <option value={option?._id}>
                                            {option.tm_name}
                                          </option>
                                        ) : (
                                          ""
                                        )
                                    )}
                                  </select>
                                </div>
                                <div className=" d-flex justify-content-center align-items-center">
                                  <p
                                    style={{
                                      color: "#F44336",
                                      fontWeight: "normal",
                                      fontSize: "0.80rem",
                                      float: "left",
                                    }}
                                  >
                                    {formik.touched.selectedPrdHos &&
                                      formik.errors.selectedPrdHos}
                                  </p>
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  <select
                                    class="form-select form-select-sm"
                                    aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="selectedMtdHod"
                                    className="textField"
                                    value={formik.values.selectedMtdHod}
                                    onChange={formik.handleChange}
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {allUserDropdownList?.HODList?.map(
                                      (option, index) =>
                                        option?.tm_department === "MTD" &&
                                        option?.tm_grade === "HOD" &&
                                        option?.user_type === "Plant-Admin" ? (
                                          <option value={option?._id}>
                                            {option.tm_name}
                                          </option>
                                        ) : (
                                          ""
                                        )
                                    )}
                                  </select>
                                </div>
                                <div className=" d-flex justify-content-center align-items-center">
                                  <p
                                    style={{
                                      color: "#F44336",
                                      fontWeight: "normal",
                                      fontSize: "0.80rem",
                                      float: "left",
                                    }}
                                  >
                                    {formik.touched.selectedMtdHod &&
                                      formik.errors.selectedMtdHod}
                                  </p>
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  <select
                                    class="form-select form-select-sm"
                                    aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="selectedMtdHos"
                                    className="textField"
                                    value={formik.values.selectedMtdHos}
                                    onChange={formik.handleChange}
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>
                                    {allUserDropdownList?.allUser?.map(
                                      (option, index) =>
                                        option?.tm_department === "MTD" &&
                                        option?.tm_grade === "HOS" &&
                                        option?.user_type ===
                                          "Section-Admin" ? (
                                          <option value={option?._id}>
                                            {option.tm_name}
                                          </option>
                                        ) : (
                                          ""
                                        )
                                    )}
                                  </select>
                                </div>
                                <div className=" d-flex justify-content-center align-items-center">
                                  <p
                                    style={{
                                      color: "#F44336",
                                      fontWeight: "normal",
                                      fontSize: "0.80rem",
                                      float: "left",
                                    }}
                                  >
                                    {formik.touched.selectedMtdHos &&
                                      formik.errors.selectedMtdHos}
                                  </p>
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <Button onClick={formik.handleSubmit}>
                                  Send For Approval
                                </Button>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.prdHos
                                      ?.prdHosId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.prdHos
                                      ?.prdHosApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHod
                                      ?.mtdHodApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosId?.tm_name
                                  }
                                  <br />
                                  Status:{" "}
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdHos
                                      ?.mtdHosApprovalStatus
                                  }
                                </div>
                              </td>

                              <td className={"td-padding"}>
                                <div className="p-1 d-flex justify-content-center align-items-center">
                                  {
                                    objOfAnnualPmScheduleApproval?.mtdTlId
                                      ?.tm_name
                                  }
                                </div>
                              </td>
                            </tr>
                          )
                        ) : (
                          columnForHeading2.map((item) => (
                            <th className={"td-padding"}></th>
                          ))
                        )
                      ) : (
                        ""
                      )
                    ) : (
                      ""
                    )}
                  </thead>
                </table>
              </Col>
            </Row>
            <Row>
              <Col className="table-scrolling">
                <table className="ar-table  pmSheetApprovalTableCol1">
                  <thead className="mt-5">
                    <tr>
                      {columns.map((tColumn) => (
                        <th className={"td-padding"}>{tColumn}</th>
                      ))}
                    </tr>

                    {tableData.length > 0 ? (
                      tableData?.map(
                        (item, index, array) =>
                          // console.log(item?.checkSheet_data?.PMStatus)

                          index === 0 ? (
                            <tr className="td-padding">
                              <td rowSpan={array.length} className="td-padding">
                                {" "}
                                {item?.line_names?.line_name}
                              </td>
                              <td className="td-padding">{index + 1}</td>
                              <td className="td-padding">
                                {item?.machine_name}
                              </td>
                              <td className="td-padding">
                                {item?.machine_code}
                              </td>
                              {item?.checkSheet_data?.PMStatus
                                ? Object.values(
                                    item?.checkSheet_data?.PMStatus
                                  ).map((item1) => (
                                    <td className="td-padding">
                                      {item1 === "Completed" ||
                                      item1 === "Done with delay" ? (
                                        <CircleIcon />
                                      ) : item1 === "Current Plan" ||
                                        item1 === "Ongoing" ||
                                        item1 === "No Completion" ||
                                        item1 === "PM Skip" ? (
                                        <PanoramaFishEyeIcon />
                                      ) : (
                                        ""
                                      )}
                                    </td>
                                  ))
                                : refArrayForTDMapping.map((index) => (
                                    <td className="td-padding"></td>
                                  ))}
                            </tr>
                          ) : (
                            <tr className="td-padding">
                              <td className="td-padding">{index + 1}</td>
                              <td className="td-padding">
                                {item?.machine_name}
                              </td>
                              <td className="td-padding">
                                {item?.machine_code}
                              </td>
                              {item?.checkSheet_data?.PMStatus
                                ? Object.values(
                                    item?.checkSheet_data?.PMStatus
                                  ).map((item1) => (
                                    <td className="td-padding">
                                      {item1 === "Completed" ||
                                      item1 === "Done with delay" ? (
                                        <CircleIcon />
                                      ) : item1 === "Current Plan" ||
                                        item1 === "Ongoing" ||
                                        item1 === "No Completion" ||
                                        item1 === "PM Skip" ? (
                                        <PanoramaFishEyeIcon />
                                      ) : (
                                        ""
                                      )}
                                    </td>
                                  ))
                                : refArrayForTDMapping.map((index) => (
                                    <td className="td-padding"></td>
                                  ))}
                              {/* <td className="td-padding"></td> */}
                            </tr>
                          )

                        // <tr>
                        //   <td className="td-padding">
                        //     {item?.line_names.line_name}
                        //   </td>
                        // </tr>
                      )
                    ) : refKeyForAnimation === "" ? (
                      ""
                    ) : (
                      <tr
                        // colSpan={2}
                        className=" d-flex justify-content-center align-items-center p-5"
                      >
                        {refKeyForAnimation}
                      </tr>
                    )}
                    <tr>
                      <td></td>
                    </tr>

                    {/* {lineDropdown?.[indexOfSelectedLine] ? (
                        <MonthlyApprovalComponentAfterAllApproval
                          loggedUserDetails={context}
                          lineInfo={lineDropdown?.[indexOfSelectedLine]}
                          objOfAnnualPmScheduleApproval={
                            objOfAnnualPmScheduleApproval
                          }
                        />
                      ) : (
                        ""
                      )} */}

                    {stateForMonthlyApprovalComponent}

                    {/* {objOfAnnualPmScheduleApproval?.mtdHos
                        ?.mtdHosApprovalStatus === "Accepted" &&
                      objOfAnnualPmScheduleApproval?.mtdHod
                        ?.mtdHodApprovalStatus === "Accepted" &&
                      objOfAnnualPmScheduleApproval?.prdHos
                        ?.prdHosApprovalStatus === "Accepted" ? (
                        <MonthlyApprovalComponentAfterAllApproval
                          loggedUserDetails={context}
                          lineInfo={lineDropdown?.[indexOfSelectedLine]}
                          objOfAnnualPmScheduleApproval={
                            objOfAnnualPmScheduleApproval
                          }
                        />
                      ) : (
                        <MonthlyApprovalDefaultComponent
                          loggedUserDetails={context}
                          lineInfo={lineDropdown?.[indexOfSelectedLine]}
                          objOfAnnualPmScheduleApproval={
                            objOfAnnualPmScheduleApproval
                          }
                        />
                      )} */}
                    <tr></tr>

                    {stateForSendingApprovalDashboard}
                  </thead>
                </table>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
      <br />
      <br />
      <br />

      <Footer />
    </>
  );
};

export default AnnualPMSchedule;
