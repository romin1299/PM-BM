import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../context/routing/RoutingContext";
import "./logTable.css";

import LoadingAnimation from "./ReportComponents/LoadingAnimation";

import { Row, Col, Container } from "react-bootstrap";
import YearDropDown from "../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../Dashboard/DashboardComponent/currentYear";
import NotFound from "./ReportComponents/NotFound";
import MonthDropDown from "../Dashboard/DashboardComponent/MonthDropDown";
import currentMonth from "../Dashboard/DashboardComponent/currentMonth";
import { typography } from "@mui/system";

import { postLineToGetAllMachineData } from "../../Integration/APIExports";
import { CSVLink } from "react-csv";

import axios from "axios";
import FileDownload from "js-file-download";
import Footer from "../../components/Footer/Footer";

const LogHistory = () => {
  let columns = [
    {
      label: "S.N.",
      key: "",
    },
    {
      label: "Schedule Month",
      key: "schedule_month",
    },
    {
      label: "Cell/Product",
      key: "cellInfo.cell_name",
    },
    {
      label: "Line",
      key: "lineInfo.line_name",
    },
    {
      label: "Machine",
      key: "machineInfo.machine_name",
    },
    {
      label: "M/c.No",
      key: "machineInfo.machine_Id",
    },
    {
      label: "Inspection Point",
      key: "inception_point",
    },
    {
      label: "Date-Time",
      key: "date",
    },
    {
      label: "Remarks",
      key: "remarks",
    },
    {
      label: "Abnormality",
      key: "abnormality",
    },
    {
      label: "Abnormality Status",
      key: "abnormality_status",
    },
    {
      label: "Abnormality Remarks",
      key: "abnormality_remarks",
    },
    {
      label: "Action Details",
      key: "actionDetailsOfAbnormalityClose",
    },
    {
      label: "Target",
      key: "target",
    },
    {
      label: "Spare Used",
      key: "spare_used",
    },
    {
      label: "P Name",
      key: "part_name",
    },
    {
      label: "Part No",
      key: "part_no",
    },
    {
      label: "Cost",
      key: "part_cost",
    },
    {
      label: "Done By",
      key: "done_by",
    },
    {
      label: "Photo",
      key: "",
    },
  ];

  const context = useContext(RoutingContext);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [selectedCell, setSelectedCell] = useState("");
  const [lineDropdown, setLineDropdown] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedMonth, setSelectedMonth] = useState();

  const [selectedMachine, setSelectedMachine] = useState();

  const [machineDropdown, setMachineDropdown] = useState([]);
  const [abnormalityYesOrNo, setAbnormalityYesOrNo] = useState();
  const [spareYesOrNo, setSpareYesOrNo] = useState();
  const [selectedAbnormalityStatus, setSelectedAbnormalityStatus] = useState();

  const [logHistoryData, setLogHistoryData] = useState([]);

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

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

        // getDataOfSkippedApprovalStatus(data?.sectionDataArray?.[0]);

        postSectionToGetAllDataForLogHistory(data?.sectionDataArray?.[0]);
        fetchSectionWiseLogHistory(data?.sectionDataArray?.[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(selectedMonth);

  const postSectionToGetAllDataForLogHistory = async (selectedSection) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForLogHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          selectedYear,
        }),
      });
      const data = await res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setAllDataSectionWise(data);
        // setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSectionWiseLogHistory = async (selectedSection) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/fetchSectionWiseLogHistory/simpleLogHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          selectedYear,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("178   ===============>", data?.logHistoryData);
        setLogHistoryData(data?.logHistoryData);

        // setAllDataSectionWise(data);
        // setTableData(data.logHistoryAllData);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   // if (context?.user_type === "Plant-Admin") {
  //   //   postSectionToGetAllDataForLogHistory(
  //   //     sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
  //   //   );
  //   // } else {
  //     postSectionToGetAllDataForLogHistory(context.section_data);
  //   // }

  //   fetchSectionWiseLogHistory();
  // }, []);

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
    if (context?.user_type === "Plant-Admin") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    } else {
      postSectionToGetAllDataForLogHistory(context.section_data);
      fetchSectionWiseLogHistory(context.section_data);
    }
  }, [selectedYear]);

  const styleForDownloadFileButton = {
    backgroundColor: "transparent",
    border: "none",
    color: "#0A58CA",
    textDecoration: "underline",
  };

  const downloadUploadedImage = async (selectedFileName) => {
    try {
      axios({
        url: `/downloadUploadedImage/${selectedFileName}`,
        method: "GET",
        responseType: "blob",
      }).then((res) => {
        // console.log("==========>")
        FileDownload(res.data, selectedFileName);
      });
    } catch (error) {
      console.log(error);
    }
  };
  // console.log(allDataSectionWise);

  return (
    <>
      <Container fluid>
        <Row className="mt-3 my-3">
          <Col sm={12} md={6} lg={2} className="mb-2">
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} md={6} lg={2} className="mb-2">
            <MonthDropDown
              selectedMonth={selectedMonth ? selectedMonth : ""}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
          {context?.user_type === "Plant-Admin" &&
          context?.tm_grade === "HOD" ? (
            <Col sm={12} md={6} lg={2} className="mb-2">
              <span>
                <b>Section:&nbsp; &nbsp;</b>
              </span>
              <select
                class="form-select form-select-sm"
                aria-label=".form-select-sm example"
                style={{ width: "60%" }}
                id="standard-select-currency"
                name="selectedSectionOrSubSection"
                className="textField"
                value={selectedSectionOrSubSection}
                onChange={(e) => {
                  setSelectedSectionOrSubSection(e.target.value);
                  postSectionToGetAllDataForLogHistory(
                    sectionOrSubSectionDropdownList?.[e.target.value]
                  );
                  fetchSectionWiseLogHistory(
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

          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Cell:&nbsp;&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "60%" }}
              id="standard-select-currency"
              name="selectedCell"
              value={selectedCell}
              className="textField"
              onChange={(e) => {
                // console.log(e.target.value);

                // console.log(
                //   allDataSectionWise?.cellData?.[e.target.value]?.cell_id
                // );
                setSelectedCell(
                  e.target.value
                  // allDataSectionWise?.cellData?.[e.target.value]
                );
                postCellToGetLineList(
                  allDataSectionWise?.cellData?.[e.target.value]?._id
                );
                setLoadingAnimationState(<LoadingAnimation />);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {allDataSectionWise?.cellData?.map((option, index) => {
                return <option value={index}>{option.cell_name}</option>;
              })}
            </select>
          </Col>

          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Line:&nbsp;&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "70%" }}
              id="standard-select-currency"
              name="selectedPlant"
              value={selectedLine}
              className="textField"
              onChange={(e) => {
                // console.log(
                //   "----------->",
                //   lineDropdown?.[e.target.value]?._id
                // );
                setSelectedLine(e.target.value);
                postLineToGetAllMachineData(
                  lineDropdown?.[e.target.value]?._id,
                  currentYear
                ).then((result) => setMachineDropdown(result?.machineInfo));
                setLoadingAnimationState(<LoadingAnimation />);
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
                return <option value={index}>{option.line_name}</option>;
              })}
            </select>
          </Col>

          <Col sm={12} md={6} lg={1} className="mb-2">
            <button
              class="btn-primary1"
              onClick={() => {
                setSelectedCell("");
                setSelectedLine("");
                setLineDropdown([]);
                setSelectedMonth();
                setSelectedMachine();
                setAbnormalityYesOrNo();
                setSpareYesOrNo();
                setSelectedAbnormalityStatus();
                setMachineDropdown([]);
              }}
            >
              Reset
            </button>
          </Col>

          {/* <Col sm={12} md={6} lg={2}></Col> */}
        </Row>
        <Row className="mt-3 my-3">
          <Col sm={12} md={6} lg={2} className="mb-2">
            <span>
              <b>Machine:&nbsp;&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              // style={{ width: "50%" }}
              id="standard-select-currency"
              name="selectedMachine"
              value={selectedMachine ? selectedMachine : ""}
              className="textField w-50"
              onChange={(e) => {
                setSelectedMachine(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {machineDropdown?.map((option, index) => {
                return (
                  <option value={option?.machine_code}>
                    {option?.machine_name}
                  </option>
                );
              })}
            </select>
          </Col>
          {/* {console.log(abnormalityYesOrNo)} */}

          <Col sm={12} md={6} lg={3} className="mb-2">
            <span>
              <b>Abnormality(Yes/No):&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              // style={{ width: "100%" }}
              id="standard-select-currency"
              name="abnormalityYesOrNo"
              value={abnormalityYesOrNo ? abnormalityYesOrNo : ""}
              className="textField w-50"
              onChange={(e) => {
                setAbnormalityYesOrNo(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {["Yes", "No"]?.map((option, index) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>

          <Col sm={12} md={6} lg={3} className="mb-2">
            <span>
              <b>Spare(Yes/No):&nbsp;&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              // style={{ width: "100%" }}
              id="standard-select-currency"
              name="spareYesOrNo"
              value={spareYesOrNo ? spareYesOrNo : ""}
              className="textField w-50"
              onChange={(e) => {
                setSpareYesOrNo(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {["Yes", "No"]?.map((option, index) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>

          <Col sm={12} md={6} lg={4} className="mb-2">
            <span>
              <b>Abnormality(Open/Closed):&nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              // style={{ width: "100%" }}
              id="standard-select-currency"
              name="selectedAbnormalityStatus"
              value={selectedAbnormalityStatus ? selectedAbnormalityStatus : ""}
              className="textField w-50"
              onChange={(e) => {
                setSelectedAbnormalityStatus(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {["Open", "Closed"]?.map((option, index) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>
        </Row>
      </Container>
      {logHistoryData?.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between">
            <h4 style={{ padding: "1rem 0 0 1rem" }}>Log History</h4>
            <div className="m-3">
              <CSVLink
                headers={columns}
                className="downloadCSV text-decoration-none"
                data={logHistoryData ? logHistoryData : []}
                filename={`PM_Log_History`}
                style={{ textDecoration: "none", color: "white" }}
              >
                {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
                CSV
              </CSVLink>
            </div>
          </div>
          <div className="container-fluid" style={{ overflowX: "auto" }}>
            <table className="ar-table pmSheetApprovalTableCol">
              <thead className="mt-5">
                <tr className="bg-button">
                  {columns.map((tColumn) => (
                    <th
                      className={"ar-table-thead-header5 td-padding text-white"}
                      colSpan={
                        tColumn.label === "Preparation"
                          ? 3
                          : tColumn.label === "Planning"
                          ? 2
                          : 0
                      }
                    >
                      {tColumn.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logHistoryData?.map((item, index) =>
                  (selectedCell
                    ? item?.cellInfo?.cell_Id ===
                      allDataSectionWise?.cellData?.[selectedCell]?.cell_id
                    : true) &&
                  (selectedMonth
                    ? item?.schedule_month === selectedMonth
                    : true) &&
                  (selectedLine
                    ? item?.lineInfo?.line_Id ===
                      lineDropdown?.[selectedLine]?.line_id
                    : true) &&
                  (selectedMachine
                    ? item?.machineInfo?.machine_Id === selectedMachine
                    : true) &&
                  (abnormalityYesOrNo
                    ? item?.abnormality_remarks
                      ? abnormalityYesOrNo === "Yes"
                      : abnormalityYesOrNo === "No"
                    : true) &&
                  (selectedAbnormalityStatus
                    ? item?.abnormality_status === selectedAbnormalityStatus
                    : true) &&
                  (spareYesOrNo
                    ? item?.spare_used
                      ? spareYesOrNo === "Yes"
                      : spareYesOrNo === "No"
                    : true) ? (
                    <tr className="ar-table-thead-header4 tableRowColor">
                      {/* {console.log(item?.lineInfo?.line_Id)} */}
                      <td className="td-padding">{index + 1}</td>
                      <td className="td-padding">{item?.schedule_month}</td>
                      <td className="td-padding">
                        {item?.cellInfo?.cell_name}
                      </td>
                      <td className="td-padding">
                        {item?.lineInfo?.line_name}
                      </td>
                      <td className="td-padding">
                        {item?.machineInfo?.machine_name}
                      </td>
                      <td className="td-padding">
                        {item?.machineInfo?.machine_Id}
                      </td>
                      <td className="td-padding">{item?.inception_point}</td>
                      <td className="td-padding">{item?.date}</td>
                      <td className="td-padding">{item?.remarks}</td>
                      <td className="td-padding">
                        {/* {item?.abnormality_remarks ? "Yes" : "No"} */}
                        {item?.abnormality}
                      </td>
                      <td className="td-padding">
                        {item?.abnormality_remarks}
                      </td>
                      <td className="td-padding">{item?.abnormality_status}</td>
                      <td className="td-padding">
                        {item?.actionDetailsOfAbnormalityClose}
                      </td>
                      <td className="td-padding">{item?.target}</td>
                      <td className="td-padding">{item?.spare_used}</td>
                      <td className="td-padding">{item?.part_name}</td>
                      <td className="td-padding">{item?.part_no}</td>
                      <td className="td-padding">{item?.part_cost}</td>
                      <td className="td-padding">{item?.done_by}</td>
                      <td className="td-padding">
                        <button
                          style={styleForDownloadFileButton}
                          onClick={() =>
                            downloadUploadedImage(item?.uploaded_file_name)
                          }
                        >
                          {item?.uploaded_file_name}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    ""
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="container-fluid d-flex justify-content-center align-items-center p-5"
          // style={{ height: "100vh" }}
        >
          {loadingAnimationState}
        </div>
      )}
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default LogHistory;
