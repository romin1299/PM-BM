import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";

import MonthlySpareConsumptionTrendGraph from "./GraphForSpareReports/MonthlySpareConsumptionTrendGraph";

import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../../ReportComponents/LoadingAnimation";
import NotFound from "../../ReportComponents/NotFound";

const MonthlySpareConsumptionTrend = ({ lineData, context }) => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [csvData, setCsvData] = useState([]);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const [selectedLine, setSelectedLine] = useState("");
  const [graphData, setGraphData] = useState([]);

  const functionForTotalDataForSpareParts = () => {
    setSelectedLine("");
    postSectionToGetAllDataForSparePartsReport();
  };

  const label = [
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

  const postSectionToGetAllDataForSparePartsReport = async () => {
    setSelectedLine("");
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForSparePartsReport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: context.section_data,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log(data);
        // setAllDataSectionWise(data);
        // setGraphData(data?.total_time_month_wise);
        // let downloadData = [];
        // downloadData.push(
        //   // keyOfCsvData,
        //   label,
        //   ["Total time month wise"].concat(data?.total_time_month_wise)
        // );
        // setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForSparePartsReport();
  }, [selectedYear]);


  return (
    <div className="p-3 ">
      <Container>
          <Row className="pt-2 cell">
            <Row>
              <Col
              // className="cell"
              // style={{ backgroundColor: "white" }}
              >
                <h4>Monthly Spare Consumption Trend</h4>
              </Col>
            </Row>
            <Row>
              <Col sm={12} lg={5}>
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
            </Row>
            <Row className="p-2">
              <Col>
                <div>
                  <select
                    style={{ width: "100%" }}
                    name="selectedLine"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    value={selectedLine}
                    onChange={(e) => {
                      setSelectedLine(e.target.value);
                      // postPerticularLineToGetDataForTotalTimeMonthWiseReport(
                      //   e.target.value
                      // );
                      setLoadingAnimationState(<LoadingAnimation />);
                    }}
                  >
                    <option selected disabled value="">
                      Please select Line
                    </option>

                    {lineData?.map((option) => {
                      return (
                        <option value={option._id}>{option.line_name}</option>
                      );
                    })}
                  </select>
                </div>
              </Col>
              <Col>
                <button className="btn-reset" onClick={functionForTotalDataForSpareParts}>
                  Total
                </button>
              </Col>
              <Col className="d-flex ">
                <Col className="d-flex justify-content-end">
                  {/* <CSVLink
                    data={csvData}
                    filename={`${selectedYear}_Total_time_month_wise${timeStamp()}`}
                    className="downloadCSV text-decoration-none"
                    target="_blank"
                  >
                    CSV
                  </CSVLink>
                  &nbsp;
                  <button
                    className="downloadPDF"
                    onClick={pdfDownloadForTotalTimeMonthWise}
                  >
                    PDF
                  </button> */}
                </Col>
              </Col>
            </Row>
          </Row>
        </Container>
      <Container className="cell">
        <Row>
          <Col>
            <MonthlySpareConsumptionTrendGraph />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MonthlySpareConsumptionTrend;
