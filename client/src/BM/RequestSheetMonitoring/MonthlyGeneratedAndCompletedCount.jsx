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
    <>
      <Table striped bordered hover>
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
    </>
  );
};

export default MonthlyGeneratedAndCompletedCount;
