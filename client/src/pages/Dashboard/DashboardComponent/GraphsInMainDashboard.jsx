import React, { useState, useEffect, useContext } from "react";

import { MonthlyTrendGraph } from "./MainDashboardGraph/MonthlyTrendGraph";
import CurrentMonthStatusGraph from "./MainDashboardGraph/CurrentMonthStatusGraph";

import RoutingContext from "../../../context/routing/RoutingContext";
import TextField from "@material-ui/core/TextField";

// import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";
import {
  Card,
  Button,
  ListGroup,
  Row,
  Col,
  Table,
  Container,
} from "react-bootstrap";

const GraphsInMainDashboard = ({
  sections,
  subSection,
  allDataSectionWise,
  currentMonthGraphAndTableData,
  annualGraph,
}) => {
  // console.log(annualGraph)
  const context = useContext(RoutingContext);

  const [remarks, setRemarks] = useState("");
  const [fetchedRemarks, setFetchedRemarks] = useState("");

  // const [loadingAnimation, setLoadingAnimation] = useState(
  //   <LoadingAnimation />
  // );

  // useEffect(() => {
  //   setLoadingAnimation(<NotFound />);
  // }, [currentMonthGraphAndTableData]);
  // console.log(
  //   context.section_data,
  //   allDataSectionWise?.sectionInfo?.[0].dashboardLevel
  // );

  const postRemarksSectionWise = async (sectionValue) => {
    // console.log("=================", context.section_data);
    try {
      const res = await fetch("/submitRemarksForMainDashboardSectionWise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: sectionValue,
          remarks,
          subSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        setFetchedRemarks("");
        fetchRemarks();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postRemarksSubSectionWise = async (subSectionValue) => {
    try {
      const res = await fetch("/submitRemarksForMainDashboardSubSectionWise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remarks,
          subSection: subSectionValue
            ? subSectionValue
            : context.subSection_data[0],
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        setFetchedRemarks("");
        fetchRemarks();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRemarksSectionWise = async () => {
    // console.log("==============================> : fetchRemarksSectionWise");
    try {
      const res = await fetch("/fetchRemarksForMainDashboardSectionWise", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      setFetchedRemarks(data?.sectionInfo?.remarksOnMainDashboard);

      if (res.status === 400 || res.status === 422 || !data) {
        return res.status(422).send("Data not received !!!");
      }
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
  };

  // console.log("-------------------------->", context);
  const fetchRemarksSubSectionWise = async () => {
    // console.log("fetchRemarksSubSectionWise : <===========================");

    try {
      const res = await fetch("/fetchRemarksForMainDashboardSubSectionWise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subSection: subSection ? subSection : context.subSection_data[0],
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data);
        setFetchedRemarks(data?.subSectionInfo?.remarksOnMainDashboard);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRemarks = async () => {
    // if (allDataSectionWise?.sectionInfo.length > 0) {
    // }
    if (allDataSectionWise?.sectionInfo?.[0].dashboardLevel === "Yes") {
      fetchRemarksSectionWise();
    } else {
      console.log(sections, subSection);
      if (sections === undefined && subSection === "") {
        fetchRemarksSubSectionWise();
      } else if (subSection) {
        fetchRemarksSubSectionWise();
      }

      // fetchRemarksSubSectionWise();
    }
  };

  useEffect(() => {
    setRemarks("");
    setFetchedRemarks("");
    fetchRemarks();
  }, [
    allDataSectionWise?.sectionInfo?.[0].dashboardLevel,
    sections,
    subSection,
  ]);

  let TableData = [
    {
      name: "Completed",
      bgColor: "table-success",
      // colorClass: "#789c50",
      value: currentMonthGraphAndTableData?.sumVariableForTotalCompleted,
    },
    {
      name: "Ongoing",
      bgColor: "table-warning",
      // colorClass: "#ddb14d",
      value: currentMonthGraphAndTableData?.sumVariableForTotalOngoing,
    },
    {
      name: "Pending(Current Month)",
      // colorClass: "table-danger",
      value:
        currentMonthGraphAndTableData?.sumVariableForTotalSchedule -
        currentMonthGraphAndTableData?.sumVariableForTotalCompleted -
        currentMonthGraphAndTableData?.sumVariableForTotalOngoing,
    },
    {
      name: "Pending(Previous Month)",
      // colorClass: "table-danger",
      value: currentMonthGraphAndTableData?.sumVariableForTotalPreviousPending,
    },
  ];

  let TableDataOfCharts = [
    {
      name: "Completed",
      bgColor: "table-success",
      // colorClass: "#789c50",
      value: currentMonthGraphAndTableData?.sumVariableForTotalCompleted,
    },
    {
      name: "Ongoing",
      bgColor: "table-warning",
      // colorClass: "#ddb14d",
      value: currentMonthGraphAndTableData?.sumVariableForTotalOngoing,
    },
    {
      name: "Pending",
      // colorClass: "table-danger",
      value:
        currentMonthGraphAndTableData?.sumVariableForTotalSchedule +
        currentMonthGraphAndTableData?.sumVariableForTotalPreviousPending -
        currentMonthGraphAndTableData?.sumVariableForTotalCompleted -
        currentMonthGraphAndTableData?.sumVariableForTotalOngoing,
    },
  ];

  let Data = {
    name: "Planned",
    bgColor: "table-primary",
    // colorClass: "#5bc0de",
    value: currentMonthGraphAndTableData?.sumVariableForTotalSchedule,
  };
  return (
    <div className="m-2">
      {/* <Container className="d-flex justify-content-center align-items-center"></Container> */}
      <Row className="d-flex justify-content-center align-items-center">
        <div className="cell">
          <MonthlyTrendGraph annualGraph={annualGraph} />
        </div>
      </Row>
      <Row className="d-flex justify-content-center align-items-center">
        <div className="cell">
          <Row>
            <Col className="d-flex justify-content-center align-items-center">
              <div style={{ width: "20rem" }}>
                {currentMonthGraphAndTableData?.sumVariableForTotalSchedule ? (
                  <CurrentMonthStatusGraph TableData={TableDataOfCharts} />
                ) : (
                  // <div className="p-3">{loadingAnimation}</div>
                  <div className="m-3">
                    <NotFound />
                    {/* <h2>No PM schedule</h2> */}
                  </div>
                )}
              </div>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center align-items-center pt-2">
              <Table bordered hover size="sm" style={{ fontSize: "12px" }}>
                <tbody>
                  <tr
                    // style={{ background: Data.bgColor }}
                    className={Data.bgColor}
                  >
                    <td>{Data.name}</td>
                    <td>{Data.value}</td>
                  </tr>
                  {TableData.map((item) => (
                    <tr
                      // style={{ background: item.bgColor }}
                      className={item.bgColor}
                    >
                      <td>{item.name}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </div>
      </Row>
      <Row
        className="d-flex justify-content-center align-items-center"
        style={{ fontSize: "12px" }}
      >
        {fetchedRemarks ? (
          <div className="cell">
            <Col>
              Remarks: <span>{fetchedRemarks}</span>
            </Col>
            {/* <Row>
              <Col className="col-9">
                <span>{fetchedRemarks}</span>
              </Col>
            </Row> */}
          </div>
        ) : (
          ""
        )}
        {allDataSectionWise?.sectionInfo?.[0].dashboardLevel === "Yes" ? (
          <div className="cell">
            <Col className="pwd-container2">
              <div className=" d-flex justify-content-center align-items-center ">
                Remarks:{" "}
              </div>
              <TextField
                style={{ paddingLeft: "0.6rem" }}
                //   InputProps={{ disableUnderline: true }}
                fullWidth
                id="remarks"
                name="remarks"
                //   label="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Col>

            <Col>
              <Button
                variant="contained"
                fullWidth
                type="submit"
                className="btn-primary mt-2"
                style={{ fontSize: "12px" }}
                onClick={() => {
                  postRemarksSectionWise(context.section_data);
                }}
              >
                Submit
              </Button>
            </Col>
          </div>
        ) : context?.subSection_data?.includes(subSection) ? (
          <div className="cell">
            <Col className="pwd-container2">
              <div className=" d-flex justify-content-center align-items-center mt-2">
                Remarks:{" "}
              </div>
              <TextField
                style={{ paddingLeft: "0.6rem" }}
                //   InputProps={{ disableUnderline: true }}
                fullWidth
                id="remarks"
                name="remarks"
                //   label="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Col>
            <Col>
              <Button
                variant="contained"
                fullWidth
                type="submit"
                className="btn-primary mt-2"
                onClick={() => {
                  postRemarksSubSectionWise(subSection);
                }}
              >
                Submit
              </Button>
            </Col>
          </div>
        ) : sections === undefined && subSection === "" ? (
          <div className="cell">
            <Col className="pwd-container2">
              <div className=" d-flex justify-content-center align-items-center mt-2">
                Remarks:{" "}
              </div>
              <TextField
                style={{ paddingLeft: "0.6rem" }}
                //   InputProps={{ disableUnderline: true }}
                fullWidth
                id="remarks"
                name="remarks"
                //   label="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Col>
            <Col>
              <Button
                variant="contained"
                fullWidth
                type="submit"
                className="btn-primary mt-2"
                onClick={() => {
                  postRemarksSubSectionWise(subSection);
                }}
              >
                Submit
              </Button>
            </Col>
          </div>
        ) : (
          ""
        )}
      </Row>
    </div>
  );
};

export default GraphsInMainDashboard;
