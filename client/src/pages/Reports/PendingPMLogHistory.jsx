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

const PendingPMLogHistory = () => {
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
      header: "Reason for delay",
      sort: "true",
    },
    {
      header: "Inception Point",
      sort: "true",
    },
    {
      header: "Date",
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
  ];

  const context = useContext(RoutingContext);

  const [tableData, setTableData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [selectedCell, setSelectedCell] = useState("");
  const [lineDropdown, setLineDropdown] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedMonth, setSelectedMonth] = useState();

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

  const postSectionToGetAllPendingPMLogHistory = async (selectedSection) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllPendingPMLogHistory", {
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
      console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setAllDataSectionWise(data);
        // setLineData(data.lineData);
        setTableData(data.logHistoryAllPendingPMData);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postCellToGetLineList = async (selectedCell) => {
    setSelectedLine("");
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

  const postLineToGetMachineList = async (selectedLine) => {
    // console.log(selectedLine);
    try {
      const res = await fetch("/postLineToGetMachineListForLogHistory", {
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
        console.log(data);
        // setTableData(data.machineInfo);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllPendingPMLogHistory();
  }, []);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col>
            <MonthDropDown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
          <Col>
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
                      setSelectedCell(e.target.value);
                      postCellToGetLineList(e.target.value);
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
                    {allDataSectionWise?.cellData?.map((option) => {
                      return (
                        <option value={option._id}>{option.cell_name}</option>
                      );
                    })}
                  </select>
                </div>
              </Col>
            </Row>
          </Col>
          <Col>
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
                      setSelectedLine(e.target.value);
                      //   postLineToGetMachineList(e.target.value);
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
                    {lineDropdown?.map((option) => {
                      return (
                        <option value={option._id}>{option.line_name}</option>
                      );
                    })}
                  </select>
                </div>
              </Col>
            </Row>
          </Col>
          <Col>
            <Row className="p-2 ">
              <Col>
                <div>
                  <button
                    class="btn-primary1 w-75"
                    onClick={() => {
                      setSelectedCell("");
                      setSelectedLine("");
                      setLineDropdown([]);
                      setSelectedMonth();
                    }}
                  >
                    Reset
                  </button>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
      {tableData?.length > 0 ? (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <h4 style={{ padding: "1rem 0 0 0" }}>Pending PM Log History</h4>

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
              {selectedCell || selectedLine || selectedMonth
                ? tableData?.map((index) =>
                    (selectedCell !== ""
                      ? index?.cell_names?._id === selectedCell
                      : true) &&
                    (selectedMonth !== undefined
                      ? index?.schedule_month === selectedMonth
                      : true) &&
                    (selectedLine !== ""
                      ? index?.line_names._id === selectedLine
                      : true) ? (
                      <tr className="ar-table-thead-header4 tableRowColor">
                        <td className="td-padding">{index?.sr_no}</td>
                        <td className="td-padding">{index?.schedule_month}</td>
                        <td className="td-padding">
                          {index?.cell_names?.cell_name}
                        </td>
                        <td className="td-padding">
                          {index?.line_names?.line_name}
                        </td>
                        <td className="td-padding">{index?.machine_name}</td>
                        <td className="td-padding">{index?.machine_code}</td>

                        <td className="td-padding">
                          {index?.reasonForDelayWhenSkip}
                        </td>
                        <td className="td-padding">
                          {index?.inspection_parent_name}
                        </td>
                        <td className="td-padding">
                          {index?.completionDateOfInspection}
                        </td>
                        <td className="td-padding">
                          {index?.remarksOfWorkedImplementaion}
                        </td>
                        <td className="td-padding">{index?.abnormality}</td>
                        <td className="td-padding">
                          {index?.abnormalityRemarks}
                        </td>
                        <td className="td-padding">
                          {index?.abnormalityStatus}
                        </td>
                        <td className="td-padding">{index?.targetDate}</td>
                        <td className="td-padding">{index?.spareParts}</td>
                        <td className="td-padding">{index?.partName}</td>
                        <td className="td-padding">{index?.partNo}</td>
                        <td className="td-padding">{index?.cost}</td>
                        <td className="td-padding">{index?.doneBy}</td>
                      </tr>
                    ) : (
                      // <NotFound/>
                      console.log("")
                    )
                  )
                : tableData?.map((index) => (
                    <tr className="ar-table-thead-header4 tableRowColor">
                      <td className="td-padding">{index?.sr_no}</td>
                      <td className="td-padding">{index?.schedule_month}</td>
                      <td className="td-padding">
                        {index?.cell_names?.cell_name}
                      </td>
                      <td className="td-padding">
                        {index?.line_names?.line_name}
                      </td>
                      <td className="td-padding">{index?.machine_name}</td>

                      <td className="td-padding">{index?.machine_code}</td>
                      <td className="td-padding">
                        {index?.reasonForDelayWhenSkip}
                      </td>
                      <td className="td-padding">
                        {index?.inspection_parent_name}
                      </td>
                      <td className="td-padding">
                        {index?.completionDateOfInspection}
                      </td>
                      <td className="td-padding">
                        {index?.remarksOfWorkedImplementaion}
                      </td>
                      <td className="td-padding">{index?.abnormality}</td>
                      <td className="td-padding">
                        {index?.abnormalityRemarks}
                      </td>
                      <td className="td-padding">{index?.abnormalityStatus}</td>
                      <td className="td-padding">{index?.targetDate}</td>
                      <td className="td-padding">{index?.spareParts}</td>
                      <td className="td-padding">{index?.partName}</td>
                      <td className="td-padding">{index?.partNo}</td>
                      <td className="td-padding">{index?.cost}</td>
                      <td className="td-padding">{index?.doneBy}</td>
                    </tr>
                  ))}
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
    </>
  );
};

export default PendingPMLogHistory;
