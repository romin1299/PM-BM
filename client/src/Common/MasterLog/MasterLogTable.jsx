import React, { useState, useEffect } from "react";
import { Table } from "antd";

const MasterLogTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  selectedMonth,
}) => {
  const columns = [
    {
      title: "Month",
      dataIndex: "month",
    },
    {
      title: "Date",
      dataIndex: "date",
    },
    {
      title: "Cell",
      dataIndex: "cell",
    },
    {
      title: "Line",
      dataIndex: "line",
    },
    {
      title: "Machine",
      dataIndex: "machine_name",
    },
    {
      title: "Machine No",
      dataIndex: "machine_code",
    },
    {
      title: "Shift",
      dataIndex: "shift",
    },

    {
      title: "Category",
      dataIndex: "maintenanceType",
    },
    {
      title: "Time",
      dataIndex: "time",
    },
    {
      title: "Problem",
      dataIndex: "problem",
      // key: "problem",
      render: (_, { problem }) =>
        problem?.length > 1 ? (
          <ul>
            {problem?.map((item) => (
              <li>{item?.problem}</li>
            ))}
          </ul>
        ) : (
          problem?.[0]?.problem
        ),
    },
    {
      title: "Cause",
      dataIndex: "cause",
      render: (_, { cause }) =>
        cause ? (
          Object?.values(cause)?.length > 1 ? (
            <ul>
              {Object?.values(cause)?.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          ) : (
            Object?.values(cause)?.[0]
          )
        ) : (
          ""
        ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, { action }) =>
        action ? (
          <ul>
            {action?.map((item) => (
              <li>{item?.action}</li>
            ))}
          </ul>
        ) : (
          ""
        ),
    },
    {
      title: "CounterMeasure",
      dataIndex: "counterMeasure",
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (_, { category }) => (
        <ul>
          {category?.map((item) => (
            <li>
              {item?.category} - {item?.subCategory}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Is Action Temporary?",
      dataIndex: "actionTemporaryOrNot",
    },
    {
      title: "Done By",
      dataIndex: "doneBy",
      render: (_, { doneBy }) =>
        doneBy?.length > 1 ? (
          <ul>
            {doneBy?.map((item) => (
              <li>{item?.tm_name}</li>
            ))}
          </ul>
        ) : (
          doneBy?.[0]?.tm_name
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
  ];

  const [masterLogData, setMasterLogData] = useState([]);

  const getMasterLog = async () => {
    try {
      const res = await fetch(
        `/common/masterLog/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, masterLogData } = await res.json();

      if (res?.status === 201) {
        setMasterLogData(masterLogData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) getMasterLog();
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <Table
      columns={columns}
      dataSource={masterLogData}
      scroll={{ x: 2000 }}
      pagination={false}
    />
  );
};

export default MasterLogTable;
