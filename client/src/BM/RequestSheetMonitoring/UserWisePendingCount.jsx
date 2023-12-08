import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";

const UserWisePendingCount = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  allMonths
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

      const { message,  UserWisePendingApprovalCount } =
        await res.json();

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
    <>
      <Table striped bordered hover>
        <tr>
          <th>User Type</th>
          <th>TM Name</th>
          {allMonths?.map((item) => (
            <th>{item}</th>
          ))}
        </tr>
        {UserWisePendingApprovalCount?.map((item) => (
          <>
            <tr>
              <td rowSpan={item?.data?.length + 1}>{item?._id}</td>
            </tr>
            {item?.data?.map((item1) => (
              <tr>
                <td>{item1?.userName}</td>
                {item1?.array?.map((item2) => (
                  <td>{item2?.count}</td>
                ))}
              </tr>
            ))}
          </>
        ))}
      </Table>
    </>
  );
};

export default UserWisePendingCount;
