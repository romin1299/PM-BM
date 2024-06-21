import React, { useState, useEffect } from "react";
import BarChart from "../../../../../BM/Reports/MTBFReport/Chart/BarChart";
import { Col } from "react-bootstrap";
import { Box, Button, InputAdornment, TextField } from "@mui/material";

const PMTimeMonitoringLastYearWiseComparison = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [yearlyTrendMachineTimeMonitoring, setYearlyTrendMachineTimeMonitoring] = useState({
    labels: [],
    data: [],
    backgroundColor: []
  });

  const yearlyTrendPmTimeMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/yearlyTrendPmTimeMonitoringData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, yearTrendMachineTimeMonitoring } = await res.json();
      if (res.status === 201) {
        setYearlyTrendMachineTimeMonitoring(yearTrendMachineTimeMonitoring);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      yearlyTrendPmTimeMonitoringData();
    }
  }, [selectedValue, selectedYear]);
  return (
    <>
      <BarChart
        title="Yearly Trend Time Monitoring"
        loading={loading}
        dataset={yearlyTrendMachineTimeMonitoring}
      />
    </>
  );
};

export default PMTimeMonitoringLastYearWiseComparison;
