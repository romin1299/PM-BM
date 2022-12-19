import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container, Card } from "react-bootstrap";

import ManHourMonthWiseGraph from "./PmTimeMonitoringCharts/ManHourMonthWiseGraph";

const TotalTimeManHourMonthWise = ({ context }) => {
  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [graphData, setGraphData] = useState([]);

  const postSectionToGetAllDataForTotalTimeManHoursMonthWise = async () => {
    // setSubSection(undefined);
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
      }
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    postSectionToGetAllDataForTotalTimeManHoursMonthWise();
  }, []);

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
                <h3>Total time Man-Hour (Month Wise)</h3>
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
                      postPerticularLineToGetDataForTotalTimeManHours(e.target.value);
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
                <button className="btn1" onClick={functionForTotalData}>
                  Total
                </button>
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
            <ManHourMonthWiseGraph xValue={x1} yValue={y1} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default TotalTimeManHourMonthWise;
