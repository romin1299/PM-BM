import { Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";

const MonthlyGeneratedAndCompletedCount = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  allMonths,
}) => {
  const [monthlyCountData, setMonthlyCountData] = useState([
    {
      label: "",
      data: [],
    },
  ]);
  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/generated-and-completed-count/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, generatedAndCompletedStatusMonthlyData } =
        await res.json();

      if (res?.status === 201) {
        setMonthlyCountData(generatedAndCompletedStatusMonthlyData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getRequestSheetMonitoringData();
    }
  }, [selectedValue, flagForTogglingFilter, selectedYear]);

  return (
    <Box className="cell p-3 rounded-2">
      <Table striped bordered hover className="m-0">
        <tr>
          <th>Status</th>
          {allMonths?.map((item) => (
            <th>{item}</th>
          ))}
        </tr>

        {monthlyCountData?.map((item) => (
          <tr>
            <th>{item?.label}</th>
            {item?.data?.map((item) => (
              <td>{item}</td>
            ))}
          </tr>
        ))}
      </Table>
    </Box>
  );
};

export default MonthlyGeneratedAndCompletedCount;
