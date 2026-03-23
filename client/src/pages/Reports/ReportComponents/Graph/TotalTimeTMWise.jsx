import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container, Card } from "react-bootstrap";

import TmWiseGraph from "./PmTimeMonitoringCharts/TmWiseGraph";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../LoadingAnimation";

const TotalTimeTMWise = ({ context, selectedSectionOrSubSection }) => {
  const [selectedTM, setSelectedTM] = useState("");

  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [csvData, setCsvData] = useState([]);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

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

  const pdfDownloadForActualTimeTakenTMWise = () => {
    const doc = new jsPDF();
    doc.text(`${selectedYear}. Total Time Man Hour Wise`, 15, 10);

    autoTable(doc, {
      head: [csvData[0]],
      body: [csvData[1]],
    });
    // doc.autoTable(columns, csvData);
    doc.save(`${selectedYear}_Total_time_man_hour_wise${timeStamp()}`);
  };

  const postSectionToGetAllDataForTotalTimeManHoursMonthWise = async (
    sectionData
  ) => {
    setSelectedTM("");
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForTotalTimeManHoursMonthWise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setAllDataSectionWise(data);
        setGraphData(data?.totalTimeManHoursMonthWise);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Actual time taken TM wise"].concat(data?.totalTimeManHoursMonthWise)
        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPerticularOperatorToGetDataForActualTimeTakenTMWise = async (
    teamMemberNo
  ) => {
    try {
      const res = await fetch(
        "/postPerticularOperatorToGetDataForActualTimeTakenTMWise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section:
              context.user_type === "Plant-Admin"
                ? selectedSectionOrSubSection
                : context.section_data,
            tm_no: teamMemberNo,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        // setTableData(data.machineInfo);
        setGraphData(data?.actualTotalTimeTakenOfTM);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Actual time taken TM wise"].concat(data?.actualTotalTimeTakenOfTM)
        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const y1 = graphData;
  const x1 = [
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

  var trace1 = {
    x: x1,
    y: y1,
    type: "bar",
    name: "Total Time",
    marker: {
      color: "orange",
    },
    hoverinfo: "y+name",
  };

  const layout = {
    title: {
      text: "",
      font: {
        size: 15,
      },
      xref: "paper",
      x: 0.0,
    },

    barmode: "stack",

    xaxis: {
      //   tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
      //   tickvals: showValueInXAxis.position,
      //   ticktext: showValueInXAxis.label,

      title: {
        text: "Month",
        font: {
          // family: 'Courier New, monospace',
          size: 14,
          color: "#000",
        },
      },
    },

    yaxis: {
      title: {
        text: "No. of Machine(2022)",
        font: {
          // family: 'Courier New, monospace',
          size: 14,
          color: "#000",
        },
      },
    },
    legend: { x: 0.3, y: "4", orientation: "h" },
  };

  const [tmList, setTmList] = useState([]);

  const supportingOperatorListForReportDashboard = async (sectionInfo) => {
    try {
      const res = await fetch("/supportingOperatorListForReportDashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section:
            context.user_type === "Plant-Admin"
              ? selectedSectionOrSubSection
              : context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTmList(data?.supportingOperatorListForReportDashboard);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    supportingOperatorListForReportDashboard();
  }, [selectedSectionOrSubSection]);

  useEffect(() => {
    postSectionToGetAllDataForTotalTimeManHoursMonthWise(
      selectedSectionOrSubSection || context?.section_data
    );
  }, [selectedYear, selectedSectionOrSubSection]);

  const functionForTotalData = () => {
    setSelectedTM("");
    postSectionToGetAllDataForTotalTimeManHoursMonthWise(
      selectedSectionOrSubSection || context?.section_data
    );
  };

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
  }, [selectedYear]);
  return (
    <>
      <div>
        <Container fluid>
          <h4 className="mb-3">Actual time taken TM wise</h4>
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
                name="selectedCell"
                fullWidth
                select // label="Select"
                autoComplete="off"
                variant="standard"
                value={selectedTM}
                onChange={(e) => {
                  setSelectedTM(e.target.value);
                  postPerticularOperatorToGetDataForActualTimeTakenTMWise(
                    e.target.value
                  );
                  setLoadingAnimationState(<LoadingAnimation />);
                }}
              >
                <option selected disabled value="">
                  Please select TM
                </option>
                {tmList?.map((option) => {
                  return <option value={option.tm_no}>{option.tm_name}</option>;
                })}
              </select>
              &nbsp;&nbsp;
              <button className="btn-reset" onClick={functionForTotalData}>
                Total
              </button>
            </Col>

            <Row className="p-2">
              <Col className="d-flex justify-content-start">
                <CSVLink
                  data={csvData}
                  filename={`${selectedYear}_Actual_time_taken_TM_wise${timeStamp()}`}
                  className="downloadCSV text-decoration-none"
                  target="_blank"
                >
                  CSV
                </CSVLink>
                &nbsp;
                <button
                  className="downloadPDF"
                  onClick={pdfDownloadForActualTimeTakenTMWise}
                >
                  PDF
                </button>
              </Col>
            </Row>

            <Row>
              {graphData?.length > 0 ? (
                <TmWiseGraph xValue={x1} yValue={y1} />
              ) : (
                loadingAnimationState
              )}
            </Row>
          </Row>
        </Container>

        <div>
          {/* <Plot
            data={[trace1]}
            layout={layout}
            config={{ displayModeBar: false }}
            style={{ width: "100%", height: "100%" }}
          /> */}
        </div>
      </div>
    </>
  );
};

export default TotalTimeTMWise;
