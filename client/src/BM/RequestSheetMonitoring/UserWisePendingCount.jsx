import { Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";

const UserWisePendingCount = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  allMonths,
}) => {
  const [UserWisePendingApprovalCount, setUserWisePendingApprovalCount] =
    useState([
      {
        _id: "",
        data: [
          {
            userId: "",
            userName: "",
            array: [
              {
                month: "",
                count: 0,
              },
            ],
          },
        ],
      },
    ]);
  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/user-wise-pending-count/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, UserWisePendingApprovalCount } = await res.json();

      if (res?.status === 201) {
        setUserWisePendingApprovalCount(UserWisePendingApprovalCount);
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
    <Box className="cell p-3 mt-3 rounded-2">
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table bordered hover className="m-0">
          <thead>
            <tr style={{ background: "#0fa3b1" }}>
              <th>User Type</th>
              <th>TM Name</th>
              {allMonths?.map((item, index) => (
                <th
                  key={index}
                  style={{ background: "#0fa3b1", textAlign: "center" }}
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {UserWisePendingApprovalCount?.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td rowSpan={item?.data?.length + 1}>{item?._id}</td>
                </tr>

                {item?.data?.map((item1, index) => (
                  <tr key={index}>
                    <td>{item1?.userName}</td>

                    {item1?.array?.map((item2, index) => (
                      <td key={index} style={{ textAlign: "center" }}>
                        {item2?.count}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default UserWisePendingCount;
