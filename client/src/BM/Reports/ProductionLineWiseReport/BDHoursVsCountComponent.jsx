import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";

import BDHoursVsCountChart from "./Charts/BDHoursVsCountChart";
import FilterComponent from "./FilterComponent";

const BDHoursVsCountComponent = ({
  flagForCellAndLineToggle,
  selectedValue,
}) => {
  const initialState = {
    labels: [],

    BDhours: [
      {
        groupId: "",
        sumOfBDhours: [],
      },
    ],

    BDCount: [
      {
        groupId: "",
        count: [],
      },
    ],

    totalBDCount: [
      {
        groupId: "",
        count: [],
      },
    ],

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-BDHours-vs-count-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        let obj = {};
        if (action?.purpose === "hours-filter") {
          obj = {
            BDhours: action?.BDHoursVsCountData?.BDhours,
          };
        } else if (action?.purpose === "count-filter") {
          obj = {
            BDCount: action?.BDHoursVsCountData?.BDCount,
          };
        } else {
          obj = {
            totalBDCount: action?.BDHoursVsCountData?.BDCount,
            BDhours: action?.BDHoursVsCountData?.BDhours,
          };
        }
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          labels: action?.labels,
          ...obj,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getBDhoursVsCountReportData = async ({ purpose, data }) => {
    try {
      const res = await fetch(
        `/getBDhoursVsCountDataFunction/${purpose}/${flagForCellAndLineToggle}/63317dbe1d1becfedab337e4`,
        // `/getBDhoursVsCountDataFunction/${flagForCellAndLineToggle}/${selectedValue}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const { message, labels, BDHoursVsCountData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          labels,
          BDHoursVsCountData,
          purpose,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  console.log(reduceState);

  useEffect(() => {
    if (selectedValue) {
      getBDhoursVsCountReportData({
        purpose: "by-default",
        data: {},
      });
    }
  }, [selectedValue]);

  return (
    <Container fluid>
      <Row>
        <Col>
          <FilterComponent
            getBDhoursVsCountReportData={getBDhoursVsCountReportData}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={6}>
          <BDHoursVsCountChart
            totalBDCount={reduceState?.totalBDCount}
            BDCount={reduceState?.BDCount}
            BDhours={reduceState?.BDhours}
            labels={reduceState?.labels}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default BDHoursVsCountComponent;
