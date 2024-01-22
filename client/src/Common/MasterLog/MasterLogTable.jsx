import React, { useState, useEffect } from "react";
import { Table } from "antd";
import axios from "axios";

const MasterLogTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  selectedMonth,
}) => {
  const [masterLogData, setMasterLogData] = useState([]);

  const [plantShiftsData, setPlantShiftsData] = useState([]);
  const [plantCategories, setPlantCategories] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  const getListOfTheTLAndOperatorForNoLossBDEntryForm = async () => {
    try {
      const res = await fetch(
        `/getListOfTheTLAndOperatorForNoLossBDEntryForm`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        setSupportingTMList(data?.TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchShiftData = async () => {
      const url = "/getAllShifts";

      try {
        const res = await axios.get(url, {
          withCredentials: true,
          credentials: "include",
        });

        // console.log("fetch shifts res:", res);
        setPlantShiftsData(res?.data?.getShifts);
        setPlantCategories(res?.data?.categories);
      } catch (error) {
        console.log("error:", error);
      }
    };

    fetchShiftData();
    getListOfTheTLAndOperatorForNoLossBDEntryForm();
  }, []);

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
      filters: plantShiftsData?.map((obj) => ({
        value: obj?.shiftName,
        text: obj.shiftName,
      })),

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record?.shift?.startsWith(value),
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

      // filters: masterLogData?.map(
      //   (obj) =>
      //     obj?.problem?.length > 0 &&
      //     obj?.problem?.map((obj1) => ({
      //       value: obj1?.problem,
      //       text: obj1?.problem,
      //     }))
      // ),
      // filterMode: "tree",
      // filterSearch: true,
      // onFilter: (value, record) => record?.problem?.startsWith(value),
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
      title: "Counter Measure",
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
      filters: plantCategories?.map((obj) => ({
        value: obj?.name,
        text: obj.name,
        children: obj?.subCategories?.map((objSub) => ({
          value: objSub?.name,
          text: objSub.name,
        })),
      })),

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => {
        if (
          record?.category?.filter((obj) => {
            if (obj?.subCategory === value) return obj;
          })?.length > 0
        ) {
          return record;
        }
      },
    },
    {
      title: "Is Action Temporary?",
      dataIndex: "actionTemporaryOrNot",
      filters: [
        {
          value: "Yes",
          text: "Yes",
        },
        {
          value: "No",
          text: "No",
        },
      ],

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) =>
        record?.actionTemporaryOrNot?.startsWith(value),
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
      filters: supportingTMList?.map((obj) => ({
        value: obj?.tm_name,
        text: obj.tm_name,
      })),

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => {
        if (
          record?.doneBy?.filter((obj) => {
            console.log(typeof obj?.tm_name, value);
            if ((obj?.tm_name).toLowerCase() === value.toLowerCase())
              return obj;
          })?.length > 0
        ) {
          return record;
        }
      },
    },
    {
      title: "Status",
      dataIndex: "status",
    },
  ];

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
