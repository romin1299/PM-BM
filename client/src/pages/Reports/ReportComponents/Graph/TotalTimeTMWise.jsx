import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container, Card } from "react-bootstrap";

import TmWiseGraph from "./PmTimeMonitoringCharts/TmWiseGraph";

const TotalTimeTMWise = () => {
  const [selectedTM, setSelectedTM] = useState("");

  const functionForTotalData = () => {
    setSelectedTM("");
  };

  const y1 = [23, 45, 67, 30, 40, 50, 60, 70, 80, 90, 20, 30];
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
      console.log(data?.supportingOperatorListForReportDashboard);
      setTmList(data?.supportingOperatorListForReportDashboard);

      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListForApproval();
  }, []);
  return (
    <>
      <div>
        <Container>
          <Row className="pt-2 cell">
            <Row>
              <Col
              // className="cell"
              // style={{ backgroundColor: "white" }}
              >
                <h3>Actual time taken TM wise</h3>
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
                    value={selectedTM}
                    onChange={(e) => setSelectedTM(e.target.value)}
                  >
                    <option selected disabled value="">
                      Please select TM
                    </option>
                    {tmList?.map((option) => {
                      return (
                        <option value={option._id}>{option.tm_name}</option>
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
            <TmWiseGraph xValue={x1} yValue={y1} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default TotalTimeTMWise;
