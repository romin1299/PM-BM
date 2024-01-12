import React, { useEffect, useState, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";

import BDHoursVsCountChart from "./Charts/BDHoursVsCountChart";
import FilterComponent from "./FilterComponent";
import { Box, Divider, Typography } from "@mui/material";

import { MonthDropdown } from "../ManHourReport/SubComponents/LineSelectionDropdown";
import { FilterMenu } from "../MTTRReport/SubComponents/FilterMenu";
import { DynamicFiltersMenu } from "./DynamicFiltersMenu";
import ChartTitleBar from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";

const BDHoursVsCountComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  // selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = useState();

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
            BDCount: [
              {
                groupId: "",
                count: [],
              },
            ],
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
    setLoading(true);

    try {
      const res = await fetch(
        // `/getBDhoursVsCountDataFunction/${purpose}/${flagForTogglingFilter}/63317dbe1d1becfedab337e4/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        `/getBDhoursVsCountDataFunction/${purpose}/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
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

    setLoading(false);
  };

  // console.log(reduceState);

  useEffect(() => {
    if (selectedValue) {
      getBDhoursVsCountReportData({
        purpose: "by-default",
        data: {},
      });
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="BD Hours Vs Count"
        Toolbar={
          <Col className="col-auto d-flex gap-2">
            <DynamicFiltersMenu
              getBDhoursVsCountReportData={getBDhoursVsCountReportData}
              selectedValue={selectedValue}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
            <MonthDropdown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
        }
      />

      {loading ? (
        <Loading height={300} />
      ) : (
        <>
          <FilterComponent
            getBDhoursVsCountReportData={getBDhoursVsCountReportData}
            selectedValue={selectedValue}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
          <BDHoursVsCountChart
            totalBDCount={reduceState?.totalBDCount}
            BDCount={reduceState?.BDCount}
            BDhours={reduceState?.BDhours}
            labels={reduceState?.labels}
          />
        </>
      )}
    </Box>
  );
};

export default BDHoursVsCountComponent;
