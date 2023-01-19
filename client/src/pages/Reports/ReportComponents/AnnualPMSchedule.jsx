import React, { useState, useEffect, useContext } from "react";
import MaterialTable from "@material-table/core";
// import { ExportCsv, ExportPdf } from "@material-table/exporters";
import { jsPDF } from "jspdf";
import { CSVLink, CSVDownload } from "react-csv";
import { Row, Col, Container, Button } from "react-bootstrap";
import CircleIcon from "@mui/icons-material/Circle";

import * as yup from "yup";
import { useFormik } from "formik";

import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import RoutingContext from "../../../context/routing/RoutingContext";

import LoadingAnimation from "./LoadingAnimation";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../../Dashboard/DashboardComponent/currentYear";

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

  const [refKeyForAnimation, setRefKeyForAnimation] = useState(
    <LoadingAnimation />
  );

  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

  useEffect(() => {
    setSelectedCell("");
    postSectionToGetAllDataForMainDashboard();
  }, [selectedYear]);

  const postCellToGetLineList = async (selectedCell) => {
    setSelectedLine(undefined);
    try {
      const res = await fetch("/postCellToGetLineListForReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cell: selectedCell,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        setLineDropdown(data.lineInfo);
        console.log("Data post", data);
        if (data?.lineInfo.length > 0) {
          postLineToGetMachineList(data?.lineInfo?.[0]._id);
        } else {
          setTableData([]);
        }

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
        // console.log("Data post", data);
        setTableData(data.machineInfo);
      }
    } catch (error) {
      console.log(error);
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
      console.log(data?.allUser);
      setAllUserDropdownList(data?.allUser);
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
  let refArrayForTDSpacing = [1, 1, 1];

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
          selectedLine: selectedLine ? selectedLine : lineDropdown?.[0]?._id,
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
        // window.alert("New password generation successfully !!!");
      }
    },
  });

  // console.log(
  //   // indexOfSelectedLine,
  //   // lineDropdown,
  //   lineDropdown?.[indexOfSelectedLine]
  // );

  // if (lineDropdown?.length > 0) {
  //   if ("annualPmScheduleApproval" in lineDropdown?.[indexOfSelectedLine]) {
  //     console.log("true");
  //   } else {
  //     console.log("false");
  //   }
  // }

  // console.log(
  //   "=================",
  //   lineDropdown?.[parseInt(selectedLine)]?.line_name
  // );

  return (
    <>
      <div>
        <div className="pt-4">
          <Container className="cell p-2">
            <Row>
              <Col sm={12} lg={4}>
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col>
                <Row className="p-2 ">
                  <Col sm={12} lg={2}>
                    <span>Cell:</span>
                  </Col>
                  <Col>
                    <div>
                      <select
                        class="form-select form-select-sm"
                        aria-label=".form-select-sm example"
                        // style={{ width: "100%" }}
                        id="standard-select-currency"
                        name="selectedCell"
                        value={
                          selectedCell === ""
                            ? allDataSectionWise?.cellData?.[0].cell_name
                            : selectedCell
                        }
                        className="textField"
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
                            <option value={option._id}>
                              {option.cell_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col>
                <Row className="p-2 ">
                  <Col sm={12} lg={2}>
                    <span>Line:</span>
                  </Col>
                  <Col>
                    <div>
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
                        className="textField"
                        onChange={(e) => {
                          // setSelectedLine(e.target.value);
                          // setIndexOfSelectedLine(e.target.value);
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
                          return (
                            <option value={index}>{option.line_name}</option>
                          );
                        })}
                      </select>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>

          {/* <form>
            <table>
              <tr>
                <td>abcd</td>
              </tr>
            </table>
          </form> */}
          <div style={{ padding: "1rem" }}>
            <Container fluid>
              <Row className="ar-table   pmSheetApprovalTableCol1">
                <Col className="col-3">
                  <h2 className="annualPmScheduleHeading">
                    Annual PM Schedule
                  </h2>
                </Col>
                <Col className="text-center col-3">
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
                                option._id === selectedCell
                                  ? option.cell_name
                                  : ""
                              )
                            : allDataSectionWise?.cellData?.[0].cell_name}
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
                      {tableData.length > 0 ? (
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
                                {allUserDropdownList?.map((option, index) =>
                                  option?.tm_department === "PRD" &&
                                  option?.tm_grade === "HOS" ? (
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
                                {allUserDropdownList?.map((option, index) =>
                                  option?.tm_department === "MTD" &&
                                  option?.tm_grade === "HOD" ? (
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
                                {allUserDropdownList?.map((option, index) =>
                                  option?.tm_department === "MTD" &&
                                  option?.tm_grade === "HOS" ? (
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
                                <td
                                  rowSpan={array.length}
                                  className="td-padding"
                                >
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
                                        {item1 === "Completed" ? (
                                          <CircleIcon />
                                        ) : item1 === "Current Plan" ? (
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
                                        {item1 === "Completed" ? (
                                          <CircleIcon />
                                        ) : item1 === "Current Plan" ? (
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
                      <tr>
                        <td className="td-padding">Plan</td>
                        <td className="td-padding">
                          <CircleIcon />
                        </td>
                        <td></td>
                        <th className="td-padding">Checked By (TL)</th>
                        {refArrayForTDMapping.map((index) => (
                          <td className="td-padding"></td>
                        ))}
                      </tr>
                      <tr>
                        <td className="td-padding">Actual</td>
                        <td className="td-padding">
                          <PanoramaFishEyeIcon />
                        </td>
                        <td></td>

                        <th className="td-padding">Approved By (HOS)</th>
                        {refArrayForTDMapping.map((index) => (
                          <td className="td-padding"></td>
                        ))}
                      </tr>
                      <tr>
                        {refArrayForTDSpacing.map((item) => (
                          <td></td>
                        ))}
                        <th className="td-padding">
                          Approved By (HOD)
                          <br />
                          (Only in case of delay)
                        </th>

                        {refArrayForTDMapping.map((index) => (
                          <td className="td-padding"></td>
                        ))}
                      </tr>
                      <tr>
                        {refArrayForTDSpacing.map((item) => (
                          <td></td>
                        ))}
                        <th className="td-padding">Remarks (If Delay)</th>
                        {refArrayForTDMapping.map((index) => (
                          <td className="td-padding"></td>
                        ))}
                      </tr>
                    </thead>
                  </table>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnualPMSchedule;
