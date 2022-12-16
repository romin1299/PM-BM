import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container, Card } from "react-bootstrap";

import MonthWiseGraph from "./PmTimeMonitoringCharts/MonthWiseGraph";

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
    // marker: {
    //   color: "green",
    // },
    hoverinfo: "y+name",
  };

  const layout = {
    // title: {
    //   text: "bar trace with colorscales for both marker color and marker line color",
    // },
    // xaxis: {
    //   type: "linear",
    //   range: [-0.5, 39.5],
    //   autorange: true,
    // },
    // yaxis: {
    //   type: "linear",
    //   range: [0, 41.05263157894737],
    //   autorange: true,
    // },
    // height: 598,
    // width: 1080,
    autosize: true,
    showlegend: false,
  };

  // {
  //   title: {
  //     text: "",
  //     font: {
  //       size: 15,
  //     },
  //     xref: "paper",
  //     x: 0.0,
  //   },

  //   barmode: "stack",

  //   xaxis: {
  //     //   tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
  //     //   tickvals: showValueInXAxis.position,
  //     //   ticktext: showValueInXAxis.label,

  //     title: {
  //       text: "Month",
  //       font: {
  //         // family: 'Courier New, monospace',
  //         size: 14,
  //         color: "#000",
  //       },
  //     },
  //   },

  //   yaxis: {
  //     title: {
  //       text: "Total Time",
  //       font: {
  //         // family: 'Courier New, monospace',
  //         size: 14,
  //         color: "#000",
  //       },
  //     },
  //     range: [0, 1],
  //     zeroline: false,
  //     showline: false,
  //     autotick: true,
  //     ticks: "",
  //     showticklabels: false,
  //   },
  //   // Change background color here ...
  //   // paper_bgcolor: "green",
  //   // plot_bgcolor: "blue",
  //   legend: { x: 0.3, y: "4", orientation: "h" },
  // };

  let data = [
    {
      // texttemplate: "%{x}",
      marker: {
        // color: ["red"],
        // color: colorArr.map((color) => {
        //   return color;
        // }),
        color: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39,
        ],

        // Blackbody,Bluered,Blues,Cividis,Earth,Electric,Greens,Greys,Hot,Jet,Picnic,Portland,Rainbow,RdBu,Reds,Viridis,YlGnBu,YlOrRd.

        // colorscale: "Blackbody",
        colorscale: "Bluered",
        // colorscale: "Electric",
        // colorscale: "Picnic",
        // colorscale: "YlGnBu",
        // colorscale: "Earth",
        // colorscale: [
        //   ["0.0", "rgb(165,0,38)"],
        //   ["0.111111111111", "rgb(215,48,39)"],
        //   ["0.222222222222", "rgb(244,109,67)"],
        //   ["0.333333333333", "rgb(253,174,97)"],
        //   ["0.444444444444", "rgb(254,224,144)"],
        //   ["0.555555555556", "rgb(224,243,248)"],
        //   ["0.666666666667", "rgb(171,217,233)"],
        //   ["0.777777777778", "rgb(116,173,209)"],
        //   ["0.888888888889", "rgb(69,117,180)"],
        //   ["1.0", "rgb(49,54,149)"],
        // ],

        // z: [
        //   [5.625, 6.25, 8.125, 11.25, 15.625],
        //   [2.5, 3.125, 5, 8.125, 12.5],
        //   [0.625, 1.25, 3.125, 6.25, 10.625],
        //   [0, 0.625, 2.5, 5.625, 10],
        // ],

        // colorscale: [
        //   [0.25, "rgb(31,120,180)"],
        //   [0.45, "rgb(178,223,138)"],
        //   [0.65, "rgb(51,160,44)"],
        //   [0.85, "rgb(251,154,153)"],
        //   [1, "rgb(227,26,28)"],
        // ],

        // line: {
        //   width: 2,
        //   color: [
        //     0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        //     19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
        //     36, 37, 38, 39,
        //   ],
        //   colorscale: "blue",
        //   cmin: 0,
        //   cmax: 39,
        // },

        cmin: 0,
        cmax: 20,
      },
      x: x1,
      y: y1,
      type: "bar",
    },
  ];

  return (
    <>
      <div
      //   style={{ backgroundColor: "white" }}
      >
        <Container>
          <Row className="pt-2 cell">
            <Row>
              <Col
              // className="cell"
              // style={{ backgroundColor: "white" }}
              >
                <h3>Total time month wise</h3>
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
          </Row>
        </Container>
        <div>
          {/* <Plot
            data={data}
            layout={layout}
            config={{ displayModeBar: false }}
            style={{ width: "100%", height: "100%" }}
          /> */}

          <Card className="d-flex justify-content-center align-items-center">
            <MonthWiseGraph xValue={x1} yValue={y1} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default TotalMonthWiseGraph;
