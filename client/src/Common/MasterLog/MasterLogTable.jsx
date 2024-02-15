import React, { useState, useEffect, useContext } from "react";
import { Table } from "antd";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useLocation, useNavigate } from "react-router-dom";

const MasterLogTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  selectedMonth,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [masterLogData, setMasterLogData] = useState([]);

  const [plantShiftsData, setPlantShiftsData] = useState([]);
  const [plantCategories, setPlantCategories] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  // const getListOfTheTLAndOperatorForNoLossBDEntryForm = async () => {
  //   try {
  //     const res = await fetch(
  //       `/getListOfTheTLAndOperatorForNoLossBDEntryForm`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       }
  //     );
  //     const data = await res.json();
  //     if (res.status === 404) {
  //       console.log("error", data?.message);
  //     } else {
  //       setSupportingTMList(data?.TLHOSS_and_TM_user_list);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   const fetchShiftData = async () => {
  //     const url = "/getAllShifts";

  //     try {
  //       const res = await axios.get(url, {
  //         withCredentials: true,
  //         credentials: "include",
  //       });

  //       // console.log("fetch shifts res:", res);
  //       setPlantShiftsData(res?.data?.getShifts);
  //       setPlantCategories(res?.data?.categories);
  //     } catch (error) {
  //       console.log("error:", error);
  //     }
  //   };

  //   fetchShiftData();
  //   getListOfTheTLAndOperatorForNoLossBDEntryForm();
  // }, []);

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

      const {
        message,
        getShifts,
        categories,
        TLHOSS_and_TM_user_list,
        masterLogData,
      } = await res.json();

      if (res?.status === 201) {
        setPlantShiftsData(getShifts);
        setPlantCategories(categories);
        setSupportingTMList(TLHOSS_and_TM_user_list);
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
      filters: [
        {
          value: "PM",
          text: "PM",
        },
        {
          value: "BM",
          text: "BM",
        },
        {
          value: "CM",
          text: "CM",
        },
        {
          value: "BD with No Loss",
          text: "BD with No Loss",
        },
        {
          value: "Documentation",
          text: "Documentation",
        },
        {
          value: "PRD Support",
          text: "PRD Support",
        },
        {
          value: "PED Support",
          text: "PED Support",
        },
      ],
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record?.maintenanceType?.startsWith(value),
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
      filters: [
        {
          value: "Completed",
          text: "Completed",
        },
        {
          value: "Generated",
          text: "Generated",
        },
        {
          value: "Assigned",
          text: "Assigned",
        },
        {
          value: "Work Order Open",
          text: "Work Order Open",
        },
        {
          value: "Work Order Pending",
          text: "Work Order Pending",
        },

        {
          value: "Work Order Closed",
          text: "Work Order Closed",
        },
        {
          value: "Fill Sheet",
          text: "Fill Sheet",
        },
        {
          value: "Under MTD TL Approval",
          text: "Under MTD TL Approval",
        },
        {
          value: "Under MTD HOSS Approval",
          text: "Under MTD HOSS Approval",
        },
        {
          value: "Under PRD TL Approval",
          text: "Under PRD TL Approval",
        },
        {
          value: "Under PRD HOS Approval",
          text: "Under PRD HOS Approval",
        },
        {
          value: "Under MTD HOS Approval",
          text: "Under MTD HOS Approval",
        },
        {
          value: "Under MTD HOD Approval",
          text: "Under MTD HOD Approval",
        },
        {
          value: "Under PRD HOD Approval",
          text: "Under PRD HOD Approval",
        },

        {
          value: "Current Plan",
          text: "Current Plan",
        },
        {
          value: "Scheduled",
          text: "Scheduled",
        },

        {
          value: "Ongoing",
          text: "Ongoing",
        },
        {
          value: "No Completion",
          text: "No Completion",
        },
        {
          value: "Done with delay",
          text: "Done with delay",
        },
        {
          value: "PM Skip",
          text: "PM Skip",
        },
      ],
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record?.status?.startsWith(value),
    },
    {
      title: "View",
      dataIndex: "",
      render: (value) =>
        ["PM", "BM"]?.includes(value?.maintenanceType) && (
          <VisibilityIcon
            className="text-primary"
            role="button"
            onClick={async () => {
              if (value?.maintenanceType === "PM") {
                const res = await axios.get(
                  `/getMachineWithSelectedYear/${value?._id}/?checkSheet_data.current_year=${selectedYear}`
                );

                navigate("/viewCheckSheet", {
                  state: {
                    selectedRowForViewForm: res.data?.machine,
                  },
                });
              } else if (value?.maintenanceType === "BM") {
                navigate(
                  `/bm/view/request-sheet/${value?.machine_code}/${value?._id}/${selectedYear}`,
                  {
                    state: {
                      prevPath: location?.pathname,
                      prevPathSearch: location?.search,
                    },
                  }
                );
              }
            }}
          />
        ),
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
