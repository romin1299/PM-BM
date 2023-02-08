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

  const label = [
    "",
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
      const res = await fetch("/postSectionToGetAllDataForSparePartsReport", {
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
        // console.log(data);
        setGraphData(data);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Total cost of PM"].concat(data?.totalMonthlyPMSpareConsumption),
          ["Total cost of BM"].concat(data?.totalMonthlyBMSpareConsumption),
          ["Total cost of Corrective"].concat(data?.totalMonthlyCorrectiveSpareConsumption),
          ["Total cost of Predictive"].concat(data?.totalMonthlyPridictiveSpareConsumption),
          ["Total cost of Kaizen"].concat(data?.totalMonthlyKaizenSpareConsumption),
          ["Total"].concat(
            data?.totalMonthlyPMSpareConsumption?.map((key, idx) => {
              return key + data?.totalMonthlyBMSpareConsumption[idx] +
                data?.totalMonthlyCorrectiveSpareConsumption[idx] +
                data?.totalMonthlyPridictiveSpareConsumption[idx] +
                data?.totalMonthlyKaizenSpareConsumption[idx]
            })
          )

        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPerticularLineToGetDataForMonthlySpareConsumption = async (
    selectedLine
  ) => {
    try {
      const res = await fetch(
        "/postPerticularLineToGetDataForMonthlySpareConsumption",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            line: selectedLine,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {

        setGraphData(data);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Total cost of PM"].concat(data?.totalMonthlyPMSpareConsumption),
          ["Total cost of BM"].concat(data?.totalMonthlyBMSpareConsumption),
          ["Total cost of Corrective"].concat(data?.totalMonthlyCorrectiveSpareConsumption),
          ["Total cost of Predictive"].concat(data?.totalMonthlyPridictiveSpareConsumption),
          ["Total cost of Kaizen"].concat(data?.totalMonthlyKaizenSpareConsumption),
          ["Total"].concat(
            data?.totalMonthlyPMSpareConsumption?.map((key, idx) => {
              return key + data?.totalMonthlyBMSpareConsumption[idx] +
                data?.totalMonthlyCorrectiveSpareConsumption[idx] +
                data?.totalMonthlyPridictiveSpareConsumption[idx] +
                data?.totalMonthlyKaizenSpareConsumption[idx]
            })
          )

        );
        setCsvData(downloadData);

      }
    } catch (error) {
      console.log(error);
    }
  };

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

  const pdfDownloadForMonthlySpareConsumption = () => {
    const doc = new jsPDF();
    doc.text(`${selectedYear}. Monthly Spare Consumption Trend`, 15, 10);

    autoTable(doc, {
      head: [csvData[0]],
      body: [csvData[1], csvData[2], csvData[3], csvData[4], csvData[5], csvData[6]],
    });
    // doc.autoTable(columns, csvData);
    doc.save(`${selectedYear}_Monthly_Spare_Consumption_Trend_${timeStamp()}`);
  };

  const functionForTotalDataForSpareParts = () => {
    setSelectedLine("");
    postSectionToGetAllDataForSparePartsReport();
  };

  useEffect(() => {
    postSectionToGetAllDataForSparePartsReport();
  }, [selectedYear]);

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
  }, [selectedYear]);

  return (
    <div className="pt-3 ">


      <Container fluid>
        <h4 className="mb-3">Monthly Spare Consumption Trend</h4>
        <Row className="pt-2 cell gy-2">
          <Col sm={12} lg={6} md={12}>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} lg={6} md={12}>
            <select
              
              style={{ width: "75%" }}
              name="selectedLine"
              fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
              value={selectedLine}
              onChange={(e) => {
                setSelectedLine(e.target.value);
                postPerticularLineToGetDataForMonthlySpareConsumption(
                  e.target.value
                );
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
            </select>&nbsp;&nbsp;
            <button
              className="btn-reset"
              onClick={functionForTotalDataForSpareParts}
            >
              Total
            </button>
          </Col>


          <Row className="p-2">

            <Col className="d-flex justify-content-start">
              <CSVLink
                data={csvData}
                filename={`${selectedYear}_Monthly_Spare_Consumption_Trend_${timeStamp()}`}
                className="downloadCSV text-decoration-none"
                target="_blank"
              >
                CSV
              </CSVLink>
              &nbsp;
              <button
                className="downloadPDF"
                onClick={pdfDownloadForMonthlySpareConsumption}
              >
                PDF
              </button>
            </Col>
          </Row>
          <Row className="mt-3">
          {graphData?.totalMonthlyPMSpareConsumption?.length > 0 ? (
              <MonthlySpareConsumptionTrendGraph graphData={graphData} />
            ) : (
              loadingAnimationState
            )}
          </Row>
        </Row>
      </Container>



      
    </div>
  );
};

export default MonthlySpareConsumptionTrend;
