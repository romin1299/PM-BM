import React, { useState, useEffect } from "react";

import { Row, Col } from "react-bootstrap";

import SummeryDashboardCard from "./SummeryDashboardCard";
import NotFound from "../../Reports/ReportComponents/NotFound";
import { Navigate, useNavigate } from "react-router-dom";

import currentYear from "../DashboardComponent/currentYear";
import YearDropDown from "../DashboardComponent/YearDropDown";
import MonthDropDown from "../DashboardComponent/MonthDropDown";
import currentMonth from "../DashboardComponent/currentMonth";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import Footer from "../../../components/Footer/Footer";

import { Button, ButtonGroup } from "@mui/material";

const SummeryDashboard = () => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);

  const [summaryCardData, setSummaryCardData] = useState([]);
  const [filter, setFilter] = useState("Section");

  const navigate = useNavigate();

  const fetchAllSummeryData = async () => {
    try {
      setStateForAnimationAndNotFound(<LoadingAnimation />);
      const res = await fetch(
        `/fetchAllSummeryData/?filter=${filter}&&selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();

      if (res.status === 201) {
        setSummaryCardData(data?.finalData);
      }

      setStateForAnimationAndNotFound(<NotFound />);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllSummeryData();
  }, [selectedYear, selectedMonth, filter]);

  const SummaryCardMapping = ({ array }) => (
    <Row className=" gy-4">
      {array?.map((item1) => (
        <SummeryDashboardCard
          cartTitle={item1.name}
          data={item1}
          filter={filter}
        />
      ))}
    </Row>
  );

  return (
    <div className="container-fluid">
      <Row className=" gy-4"></Row>
      <div>
        {/* <div class=" card4 ">
          <Button onClick={backAtMainDashboard}>Back</Button>
        </div> */}

        <div class="shadow-sm cardCssForTitle card1 text-danger">
          <h4>Denso PM Planning System</h4>
        </div>
        <Row
          className="mx-2 mt-4 p-2 cell"
          // style={{ background: "#cee4ee", border: "1px solid" }}
        >
          <Col sm>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm>
            <MonthDropDown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
          <Col className="d-flex justify-content-end">
            <ButtonGroup
              size="small"
              disableElevation
              variant="outlined"
              aria-label="outlined button group"
            >
              {["Section", "Cell"]?.map((item, index) => (
                <Button
                  key={index}
                  variant={filter === item ? "contained" : "outlined"}
                  value={item}
                  onClick={(event) => {
                    setFilter(event.target.value);
                  }}
                >
                  {item}
                </Button>
              ))}
            </ButtonGroup>
          </Col>
        </Row>

        {summaryCardData?.length > 0 ? (
          summaryCardData?.map((item) => (
            <div>
              <div class="shadow-sm cardCssForSubtitle card1 text-danger d-flex align-items-center">
                <h4 style={{ marginBottom: "0rem", color: "rgb(220, 53, 69)" }}>
                  {item.plant_name}
                </h4>
              </div>

              {filter === "Section" ? (
                <SummaryCardMapping array={item?.details} />
              ) : (
                item?.sectionOrSubSectionWiseData?.map((item1) => (
                  <>
                    <div
                      class="shadow-sm cardCssForSubtitle card1 text-danger d-flex align-items-center"
                      style={{
                        marginTop: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <h5
                        style={{
                          marginBottom: "0rem",
                          color: "rgb(220, 53, 69)",
                        }}
                      >
                        {item1.nameSectionOrSubSection}
                      </h5>
                    </div>

                    <SummaryCardMapping array={item1?.details} />
                  </>
                ))
              )}
            </div>
          ))
        ) : (
          <Col className="col-lg-3 col-md-12 col-sm-12 p-5 d-flex justify-content-center d-flex align-items-center">
            {stateForAnimationAndNotFound}
          </Col>
        )}

        {/* {plantInfo?.map((item) => (
          <div>
            <div class="shadow-sm cardCssForSubtitle card1 text-danger d-flex align-items-center">
              <h4 style={{ marginBottom: "0rem", color: "rgb(220, 53, 69)" }}>
                {item.plant_name}
              </h4>
            </div>
            <Row className=" gy-4">
              {sectionInfo?.length > 0 ? (
                sectionInfo.map((item1) =>
                  item._id === item1.plant_name ? (
                    <SummeryDashboardCard
                      cartTitle={item1.section_name}
                      data={item1}
                    />
                  ) : (
                    ""
                  )
                )
              ) : (
                <Col className="col-lg-3 col-md-12 col-sm-12 p-5 d-flex justify-content-center d-flex align-items-center">
                  {stateForAnimationAndNotFound}
                </Col>
              )}
            </Row>
          </div>
        ))} */}
      </div>
      <br />
      <br />
      {/* <Footer /> */}
      <br />
      <div>
        <div id="footer" style={{ marginLeft: "-10px" }}>
          {/* <p>© 2020 <span style={{ color: "red" }}>Denso</span>. All rights reserved</p> */}
          <p style={{ marginLeft: "-70px" }}>
            © {new Date().getFullYear()}
            <span style={{ color: "#dc3545" }}>
              <b> Denso</b>
            </span>
            . All rights reserved.
          </p>
        </div>{" "}
      </div>
    </div>
  );
};

export default SummeryDashboard;
