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

import axios from "axios";
import FileDownload from "js-file-download";
import Footer from "../../components/Footer/Footer";

const LogHistory = () => {
  let columns = [
    {
      header: "Sr.No",
      sort: "true",
    },
    {
      header: "Schedule Month",
      sort: "true",
    },
    {
      header: "Cell/Product",
      sort: "true",
    },
    {
      header: "Line",
      sort: "true",
    },
    {
      header: "Machine",
      sort: "true",
    },
    {
      header: "M/c.No",
      sort: "true",
    },
    {
      header: "Inspection Point",
      sort: "true",
    },
    {
      header: "Date-Time",
      sort: "true",
    },
    {
      header: "Remarks",
      sort: "true",
    },
    {
      header: "Abnormality",
      sort: "true",
    },
    {
      header: "Abnormality Remarks",
      sort: "true",
    },
    {
      header: "Abnormality Status",
      sort: "true",
    },
    {
      header: "Target",
      sort: "true",
    },
    {
      header: "Spare Used",
      sort: "true",
    },
    {
      header: "P Name",
      sort: "true",
    },
    {
      header: "Part No",
      sort: "true",
    },
    {
      header: "Cost",
      sort: "true",
    },
    {
      header: "Done By",
      sort: "true",
    },
    {
      header: "File",
      sort: "true",
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
          section: context.section_data,
          selectedYear,
        }),
      });
      const data = await res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setAllDataSectionWise(data);
        setLoadingAnimationState(<NotFound />);
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

  const fetchSectionWiseLogHistory = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/fetchSectionWiseLogHistory/simpleLogHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
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
        // setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForLogHistory();

    fetchSectionWiseLogHistory();
  }, []);

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
        <Row>
          <Col sm={12} md={6} lg={2}>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col >
          <Col sm={12} md={6} lg={2}>
            <MonthDropDown
              selectedMonth={selectedMonth ? selectedMonth : ""}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>

          <Col sm={12} md={6} lg={2}>
            <Row className="p-2 ">
              <Col sm={12} lg={3}>
                <span>
                  <b>Cell:</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
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
                </div>
              </Col>
            </Row>
          </Col>

          <Col sm={12} md={6} lg={2}>
            <Row className="p-2 ">
              <Col sm={12} lg={3}>
                <span>
                  <b>Line:</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
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
                      ).then((result) =>
                        setMachineDropdown(result?.machineInfo)
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
                    {lineDropdown?.map((option, index) => {
                      return <option value={index}>{option.line_name}</option>;
                    })}
                  </select>
                </div>
              </Col>
            </Row>
          </Col>

          <Col sm={12} md={6} lg={2}>
            <Row className="p-2 ">
              <Col>
                <div>
                  <button
                    class="btn-primary1 w-50"
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
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={12} md={6} lg={3}>
            <Row className="p-2 ">
              <Col>
                <span>
                  <b>Machine:</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="selectedMachine"
                    value={selectedMachine ? selectedMachine : ""}
                    className="textField"
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
                </div>
              </Col>
            </Row>
          </Col>
          {/* {console.log(abnormalityYesOrNo)} */}

          <Col sm={12} md={6} lg={3}>
            <Row className="p-2 ">
              <Col sm={12} lg="auto">
                <span>
                  <b>Abnormality(Yes/No):</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="abnormalityYesOrNo"
                    value={abnormalityYesOrNo ? abnormalityYesOrNo : ""}
                    className="textField"
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
                </div>
              </Col>
            </Row>
          </Col>

          <Col sm={12} md={6} lg={3}>
            <Row className="p-2 ">
              <Col sm={12} lg="auto">
                <span>
                  <b>Spare(Yes/No):</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="spareYesOrNo"
                    value={spareYesOrNo ? spareYesOrNo : ""}
                    className="textField"
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
                </div>
              </Col>
            </Row>
          </Col>

          <Col sm={12} md={6} lg={3}>
            <Row className="p-2 ">
              <Col sm={12} lg="auto">
                <span>
                  <b>Abnormality(Open/Closed):</b>
                </span>
              </Col>
              <Col>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="selectedAbnormalityStatus"
                    value={
                      selectedAbnormalityStatus ? selectedAbnormalityStatus : ""
                    }
                    className="textField"
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
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
      {logHistoryData?.length > 0 ? (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <h4 style={{ padding: "1rem 0 0 0" }}>Log History</h4>

          <table className="ar-table pmSheetApprovalTableCol">
            <thead className="mt-5">
              <tr className="bg-button">
                {columns.map((tColumn) => (
                  <th
                    className={"ar-table-thead-header5 td-padding text-white"}
                    colSpan={
                      tColumn.header === "Preparation"
                        ? 3
                        : tColumn.header === "Planning"
                        ? 2
                        : 0
                    }
                  >
                    {tColumn.header}
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
                    <td className="td-padding">{item?.cellInfo?.cell_name}</td>
                    <td className="td-padding">{item?.lineInfo?.line_name}</td>
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
                      {item?.abnormality_remarks ? "Yes" : "No"}
                    </td>
                    <td className="td-padding">{item?.abnormality_remarks}</td>
                    <td className="td-padding">{item?.abnormality_status}</td>
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
      ) : (
        <div
          className="container-fluid d-flex justify-content-center align-items-center p-5"
          // style={{ height: "100vh" }}
        >
          {loadingAnimationState}
        </div>
      )}
      <Footer/>
    </>
  );
};

export default LogHistory;
