import { Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";
import { useLocation } from "react-router-dom";
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

  const location = useLocation();
  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/generated-and-completed-count/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&inWhichSection=${location?.pathname?.split("/")?.[1]}`,
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
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table bordered hover className="m-0">
          <thead>
            <tr>
              <th style={{ background: "#0fa3b1" }}>Status</th>
              {allMonths?.map((item, index) => (
                <th
                  style={{ background: "#0fa3b1", textAlign: "center" }}
                  key={index}
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          {monthlyCountData?.map((item, index) => (
            <tbody key={index}>
              <tr>
                <th style={{ background: "#b5e2fa" }}>{item?.label}</th>
                {item?.data?.map((item, index) => (
                  <td key={index} style={{ textAlign: "center" }}>
                    {item}
                  </td>
                ))}
              </tr>
            </tbody>
          ))}
        </Table>
      </Box>
    </Box>
  );
};

export default MonthlyGeneratedAndCompletedCount;
