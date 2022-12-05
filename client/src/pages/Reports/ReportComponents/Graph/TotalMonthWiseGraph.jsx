import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container } from "react-bootstrap";

const TotalMonthWiseGraph = ({ context }) => {
  const [allDataSectionWise, setAllDataSectionWise] = useState([]);

  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log(data);
        setAllDataSectionWise(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard();
  }, []);

  const [selectedLine, setSelectedLine] = useState("");

  const functionForTotalData = () => {
    setSelectedLine("");
  };

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
    // marker: {
    //   color: "green",
    // },
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
      <div
      //   style={{ backgroundColor: "white" }}
      >
        <Container>
          <Row>
            <Col style={{ backgroundColor: "white" }}>
              <h3>Total time month wise</h3>
            </Col>
          </Row>
          <Row className="pt-2">
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
                  onChange={(e) => setSelectedLine(e.target.value)}
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

export default TotalMonthWiseGraph;
