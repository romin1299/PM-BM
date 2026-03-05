import React, { useState } from "react";
import { Box } from "@mui/material";
import { Table } from "reactstrap";

const MonthlyGeneratedAndCompletedCountTable = () => {
  const [monthlyCountData, setMonthlyCountData] = useState([
    {
      label: "",
      data: [],
    },
  ]);

  return (
    <Box className="cell p-2 rounded-2">
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
              {[
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
                "Jan",
                "Feb",
                "Mar",
              ]?.map((item, index) => (
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

export default MonthlyGeneratedAndCompletedCountTable;
