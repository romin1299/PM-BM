import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container, Card } from "react-bootstrap";

import TmWiseGraph from "./PmTimeMonitoringCharts/TmWiseGraph";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";

const TotalTimeTMWise = ({ context }) => {
  const [selectedTM, setSelectedTM] = useState("");

  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const postSectionToGetAllDataForTotalTimeManHoursMonthWise = async () => {
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
            section: context.section_data,
            selectedYear
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
            section: context.section_data,
            tm_no: teamMemberNo,
            selectedYear
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
      // console.log(data?.supportingOperatorListForReportDashboard);
      setTmList(data?.supportingOperatorListForReportDashboard);

      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListForApproval();
  }, []);

  useEffect(() => {
    postSectionToGetAllDataForTotalTimeManHoursMonthWise();
  }, [selectedYear]);

  const functionForTotalData = () => {
    setSelectedTM("");
    postSectionToGetAllDataForTotalTimeManHoursMonthWise();
  };
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
                    value={selectedTM}
                    onChange={(e) => {
                      setSelectedTM(e.target.value);
                      postPerticularOperatorToGetDataForActualTimeTakenTMWise(
                        e.target.value
                      );
                    }}
                  >
                    <option selected disabled value="">
                      Please select TM
                    </option>
                    {tmList?.map((option) => {
                      return (
                        <option value={option.tm_no}>{option.tm_name}</option>
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
