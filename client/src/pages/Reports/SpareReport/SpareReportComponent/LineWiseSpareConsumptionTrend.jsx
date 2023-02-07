import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";

import LineWiseSpareConsumptionTrendGraph from "./GraphForSpareReports/LineWiseSpareConsumptionTrendGraph";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../../ReportComponents/LoadingAnimation";
import NotFound from "../../ReportComponents/NotFound";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";

const LineWiseSpareConsumptionTrend = ({ lineData, context }) => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [csvData, setCsvData] = useState([]);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const [graphData, setGraphData] = useState([]);

  //get the date and time
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

  const postSectionToGetAllDataForLineWiseSpareConsumption = async () => {
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForLineWiseSpareConsumption",
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
        // console.log(data);
        setGraphData(data);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          ["Lines"].concat(data?.lineWiseSpareCost?.map((item) => item?.line_name)),
          ["Total cost of PM"].concat(
            data?.lineWiseSpareCost?.map((item) => item?.sumOfTotalPMSpareCost)
          ),
          ["Total cost of BM"].concat(
            data?.lineWiseSpareCost?.map((item) => item?.sumOfTotalBMSpareCost)
          ),
          ["Total cost of Corrective"].concat(
            data?.lineWiseSpareCost?.map(
              (item) => item?.sumOfTotalCorrectiveSpareCost
            )
          ),
          ["Total cost of Predictive"].concat(
            data?.lineWiseSpareCost?.map(
              (item) => item?.sumOfTotalPridictiveSpareCost
            )
          ),
          ["Total cost of Kaizen"].concat(
            data?.lineWiseSpareCost?.map(
              (item) => item?.sumOfTotalKaizenSpareCost
            )
          ),
          ["Total"].concat(
            data?.lineWiseSpareCost?.map((key) => {
              return (
                key?.sumOfTotalPMSpareCost +
                key.sumOfTotalBMSpareCost +
                key.sumOfTotalCorrectiveSpareCost +
                key.sumOfTotalPridictiveSpareCost +
                key.sumOfTotalKaizenSpareCost
              );
            })
          )
        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const pdfDownloadForLineWiseSpareConsumption = () => {
    const doc = new jsPDF();
    doc.text(`${selectedYear}. Line Wise Spare Consumption Trend`, 15, 10);

    autoTable(doc, {
      head: [csvData[0]],
      body: [
        csvData[1],
        csvData[2],
        csvData[3],
        csvData[4],
        csvData[5],
        csvData[6],
      ],
    });
    // doc.autoTable(columns, csvData);
    doc.save(
      `${selectedYear}_Line_Wise_Spare_Consumption_Trend_${timeStamp()}`
    );
  };

  useEffect(() => {
    postSectionToGetAllDataForLineWiseSpareConsumption();
  }, [selectedYear]);

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
  }, [selectedYear]);

  return (
    <div className="pt-3">
      <Container fluid>
        <Row className="pt-2 cell">
          <Row>
            <Col
            // className="cell"
            // style={{ backgroundColor: "white" }}
            >
              <h4>Line Wise Spare Consumption Trend</h4>
            </Col>
          </Row>
          <Row>
            <Col sm={12} lg={6}>
              <YearDropDown
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </Col>
            <Col sm={12} lg={6}>
              <Col className="d-flex justify-content-end">
                <CSVLink
                  data={csvData}
                  filename={`${selectedYear}_Line_Wise_Spare_Consumption_Trend_${timeStamp()}`}
                  className="downloadCSV text-decoration-none"
                  target="_blank"
                >
                  CSV
                </CSVLink>
                &nbsp;
                <button
                  className="downloadPDF"
                  onClick={pdfDownloadForLineWiseSpareConsumption}
                >
                  PDF
                </button>
              </Col>
            </Col>
          </Row>

        </Row>
      </Container>
      <Container className="cell pt-1" fluid>
        <Row>
          <Col
          // style={{ height: "25rem" }}
          >
            {graphData?.lineWiseSpareCost?.length > 0 ? (
              <LineWiseSpareConsumptionTrendGraph
                lineData={lineData}
                graphData={graphData}
              />
            ) : (
              loadingAnimationState
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LineWiseSpareConsumptionTrend;
