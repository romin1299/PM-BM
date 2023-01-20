import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotlyjs";
import { Row, Col, Container, Card } from "react-bootstrap";

import ManHourMonthWiseGraph from "./PmTimeMonitoringCharts/ManHourMonthWiseGraph";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../LoadingAnimation";
import NotFound from "../NotFound";

const TotalTimeManHourMonthWise = ({ context }) => {
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

  const pdfDownloadForTotalTimeManHourWise = () => {
    const doc = new jsPDF();
    doc.text(`${selectedYear}. Total Time Man Hour Wise`, 15, 10);

    autoTable(doc, {
      head: [csvData[0]],
      body: [csvData[1]],
    });
    // doc.autoTable(columns, csvData);
    doc.save(`${selectedYear}_Total_time_man_hour_wise${timeStamp()}`);
  };

  const postSectionToGetAllDataForTotalTimeManHoursMonthWise = async () => {
    setSelectedLine("");
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForTotalTimeManHoursMonthWise",
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
        setAllDataSectionWise(data);
        setGraphData(data?.totalTimeManHoursMonthWise);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Total time man hour wise"].concat(data?.totalTimeManHoursMonthWise)
        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPerticularLineToGetDataForTotalTimeManHours = async (
    selectedLine
  ) => {
    try {
      const res = await fetch(
        "/postPerticularLineToGetDataForTotalTimeManHours",
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
        // window.alert(data.abcd);
        // console.log("Data post", data);
        // setTableData(data.machineInfo);
        setGraphData(data?.totalTimeManHoursMonthWiseOfLineWise);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Total time man hour wise"].concat(
            data?.totalTimeManHoursMonthWiseOfLineWise
          )
        );
        setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForTotalTimeManHoursMonthWise();
  }, [selectedYear]);

  const [selectedLine, setSelectedLine] = useState("");

  const functionForTotalData = () => {
    setSelectedLine("");
    postSectionToGetAllDataForTotalTimeManHoursMonthWise();
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
      color: "green",
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
        text: "Total Time",
        font: {
          // family: 'Courier New, monospace',
          size: 14,
          color: "#000",
        },
      },
    },
    legend: { x: 0.3, y: "4", orientation: "h" },
  };

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);

  }, [selectedYear]);

  return (
    <>
      <div>
        <Container>
          <Row className="pt-2  cell">
            <Row>
              <Col
              // className="cell"
              // style={{ backgroundColor: "white" }}
              >
                <h4>Total time Man-Hour (Month Wise)</h4>
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
                    name="selectedCell"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    value={selectedLine}
                    onChange={(e) => {
                      setSelectedLine(e.target.value);
                      postPerticularLineToGetDataForTotalTimeManHours(
                        e.target.value
                      );
                      setLoadingAnimationState(<LoadingAnimation />);
                    }}
                  >
                    <option selected disabled value="">
                      Please select Line
                    </option>
                    {allDataSectionWise?.lineData?.map((option) => {
                      return (
                        <option value={option._id}>{option.line_name}</option>
                      );
                    })}
                  </select>
                </div>
              </Col>
              <Col>
                <button className="btn-reset" onClick={functionForTotalData}>
                  Total
                </button>
              </Col>
              <Col className="d-flex">
                <Col className="d-flex justify-content-end">
                  <CSVLink
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
                    onClick={pdfDownloadForTotalTimeManHourWise}
                  >
                    PDF
                  </button>
                </Col>
              </Col>
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
          <Card className="d-flex justify-content-center align-items-center">
            {graphData?.length > 0 ? (
              <ManHourMonthWiseGraph xValue={x1} yValue={y1} />
            ) : (
              loadingAnimationState
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default TotalTimeManHourMonthWise;
