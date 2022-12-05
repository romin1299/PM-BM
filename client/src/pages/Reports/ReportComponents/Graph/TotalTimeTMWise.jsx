import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container } from "react-bootstrap";

const TotalTimeTMWise = () => {
  const [selectedTM, setSelectedTM] = useState("");

  const functionForTotalData = () => {
    setSelectedTM("");
  };

  const dummyTm = ["TM-1", "TM-2", "TM-3", "TM-4", "TM-5"];
  const y1 = [23, 45, 67, 30, 40, 50, 60, 70, 80, 90, 20, 30];
  const x1 = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
  return (
    <>
      <div>
        <Container>
          <Row>
            <Col style={{ backgroundColor: "white" }}>
              <h3>Actual time taken TM wise</h3>
            </Col>
            <Col></Col>
          </Row>
          <Row className="pt-2">
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
                  {dummyTm.map((option) => {
                    return <option value={option}>{option}</option>;
                  })}
                </select>
              </div>
            </Col>
            <Col>
              <button className="btn1" onClick={functionForTotalData}>
                Total
              </button>
            </Col>
            <Col></Col>
          </Row>
        </Container>
        <div className="pt-2">
          <Plot
            data={[trace1]}
            layout={layout}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </>
  );
};

export default TotalTimeTMWise;
