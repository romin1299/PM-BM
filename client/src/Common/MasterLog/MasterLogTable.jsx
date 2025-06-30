import React, { useState, useEffect, useReducer } from "react";
import { Table, ConfigProvider, Space, Button } from "antd";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import MainRequestSheetForView from "../../BM/Tabs/RequestSheetForView/MainRequestSheetForView";
import ViewNoLossBDEntryForm from "../../BM/NoLossBDDataEntry/ViewNoLossBDEntryForm";
import moment from "moment";
import Loading from "../../components/Loading/Loading";

const MasterLogTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  selectedMonth,
  setCsvDataOfMasterLog,
  selectedDateForFilter,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [masterLogData, setMasterLogData] = useState([]);

  const [plantShiftsData, setPlantShiftsData] = useState([]);
  const [plantCategories, setPlantCategories] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRow, setSelectedRow] = useState();

  const initialState = {
    requestSheetModalOpenClose: false,
    noLossBMEntryModalOpenClose: false,
    noLossBMEntryModalDeleteOpenClose: false,
  };

  const ACTION = {
    OPEN_CLOSE_RS: "request-sheet-open-close",
    OPEN_CLOSE_NO_LOSS_BD: "no-loss-bd-open-close",
    OPEN_CLOSE_NO_LOSS_BD_DELETE: "no-loss-bd-open-close-delete",
  };

  const reducer = (state, action) => {
    if (action?.type === ACTION?.OPEN_CLOSE_RS) {
      return {
        ...state,
        requestSheetModalOpenClose: !state?.requestSheetModalOpenClose,
      };
    } else if (action?.type === ACTION?.OPEN_CLOSE_NO_LOSS_BD) {
      return {
        ...state,
        noLossBMEntryModalOpenClose: !state?.noLossBMEntryModalOpenClose,
      };
    } else if (action?.type === ACTION?.OPEN_CLOSE_NO_LOSS_BD_DELETE) {
      return {
        ...state,
        noLossBMEntryModalDeleteOpenClose:
          !state?.noLossBMEntryModalDeleteOpenClose,
      };
    } else {
      return state;
    }
  };

  const [handleAllModals, handleAllModalsDispatch] = useReducer(
    reducer,
    initialState
  );

  // const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] =
  //   useState(false);

  // const [noLossBMEntryModalOpenClose, seNoLossBMEntryModalOpenClose] =
  //   useState(false);

  const handleRequestSheetShowAndCloseState = () => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_RS });
  };

  const handleNoLossBMEntryShowAndCloseState = () => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_NO_LOSS_BD });
  };

  const handleNoLossBMEntryDeleteShowAndCloseState = () => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_NO_LOSS_BD_DELETE });
  };

  const getMasterLog = async () => {
    setLoading(true);
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

        let csvMasterLogData = [];
        for (let i = 0; i < masterLogData.length; i++) {
          csvMasterLogData.push({
            ...masterLogData[i],
            problem: masterLogData[i]?.problem?.map((data) => data?.problem),
            action: masterLogData[i]?.action?.map((data) => data?.action),
            doneBy: masterLogData[i]?.doneBy?.map((data) => data?.tm_name),
          });
        }

        setCsvDataOfMasterLog(csvMasterLogData);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: "Sr. No.",
      render: (value, item, idx) => {
        return ++idx;
      },
      width: 70,
    },
    {
      title: "Month",
      dataIndex: "month",
      width: 90,
    },
    {
      title: "Date",
      dataIndex: "date",
      width: 120,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }) => (
        <div style={{ padding: 8 }}>
          <Space>
            <input
              type="date"
              value={selectedKeys}
              onChange={(e) => setSelectedKeys([e.target.value])}
              allowClear={true}
            />
          </Space>
          <Space>
            <Button
              // type="link"
              style={{ width: 90 }}
              size="small"
              onClick={() => {
                confirm({ closeDropdown: false });
              }}
            >
              Filter
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSelectedKeys([]);
                close();
              }}
            >
              close
            </Button>
          </Space>

          <Space>
            <Button
              type="link"
              onClick={() => {
                setSelectedKeys([]);
                confirm({ closeDropdown: false });
                clearFilters();
                close();
              }}
              size="small"
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      // filterMode: "tree",
      // filterSearch: true,
      onFilter: (value, record) => {
        return (
          (moment(record["date"], "DD-MM-YYYY", true).isValid()
            ? record["date"]
            : moment(record["date"], ["D/M/YYYY h:mm a", "DD-MM-YYYY"]).format(
                "DD-MM-YYYY"
              )) === moment(value).format("DD-MM-YYYY")
        );
      },
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
      width: 90,
    },

    {
      title: "Category",
      dataIndex: "maintenanceType",
      width: 120,
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
          value: "CM Entry",
          text: "CM Entry",
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
        {
          value: "TPM",
          text: "TPM",
        },
      ],
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record?.maintenanceType?.startsWith(value),
    },
    {
      title: "Time",
      dataIndex: "time",
      width: 80,
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
      title: "First Time/ Repeat",
      dataIndex: "firstTimeOrRepeat",
      filters: [
        {
          value: "First Time",
          text: "First Time",
        },
        {
          value: "Repeat",
          text: "Repeat",
        },
      ],

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record?.firstTimeOrRepeat?.startsWith(value),
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
      width: 70,
      fixed: "right",

      render: (value) => (
        // ["PM", "BM"]?.includes(value?.maintenanceType) &&
        <>
          <div className="d-flex justify-content-center align-items-center">
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
                } else if (
                  value?.maintenanceType === "BM" ||
                  value?.maintenanceType === "CM"
                ) {
                  // navigate(
                  //   `/bm/view/request-sheet/${value?.machine_code}/${value?._id}/${selectedYear}`,
                  //   {
                  //     state: {
                  //       prevPath: location?.pathname,
                  //       prevPathSearch: location?.search,
                  //     },
                  //   }
                  // );
                  setSelectedRow(value);
                  handleRequestSheetShowAndCloseState();
                } else {
                  // navigate(
                  //   `/bm/view/update-view-otherBDLoss/${value?.machine_code}/${value?._id}/${selectedYear}`
                  // );
                  setSelectedRow(value);
                  handleNoLossBMEntryShowAndCloseState();
                }
              }}
            />
            {/* {!["PM", "BM"]?.includes(value?.maintenanceType) && (
              <DeleteOutline className="text-danger" />
            )} */}
          </div>
        </>
      ),
    },
  ];

  const removeDataFromMaster = (idOfDeletedSheet) => {
    setMasterLogData(
      masterLogData?.filter((key) => key._id !== idOfDeletedSheet)
    );
  };

  useEffect(() => {
    if (selectedValue) {
      getMasterLog();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  // const filterDataBasedOnSelectedDate = () => {
  //   console.log(selectedDateForFilter);
  //   let filteredData = masterLogData?.filter(
  //     (data) =>
  //       (moment(data?.date, "DD-MM-YYYY", true).isValid()
  //         ? data?.date
  //         : moment(data?.date, ["D/M/YYYY h:mm a", "DD-MM-YYYY"]).format(
  //             "DD-MM-YYYY"
  //           )) === moment(selectedDateForFilter).format("DD-MM-YYYY")
  //   );

  //   console.log(filteredData);
  // };

  return (
    <>
      {loading ? (
        <Box mt={2}>
          <Loading height={200} />
        </Box>
      ) : (
        <>
          {handleAllModals?.requestSheetModalOpenClose && (
            <MainRequestSheetForView
              selectedYear={selectedYear}
              machine_code={selectedRow?.machine_code}
              requestSheetID={selectedRow?._id}
              modelProp={{
                show: handleAllModals?.requestSheetModalOpenClose,
                onHide: () => handleRequestSheetShowAndCloseState(),
              }}
            />
          )}
          {handleAllModals?.noLossBMEntryModalOpenClose && (
            <ViewNoLossBDEntryForm
              selectedYear={selectedYear}
              machine_code={selectedRow?.machine_code}
              noLossBDRequestSheetID={selectedRow?._id}
              modelProp={{
                show: handleAllModals?.noLossBMEntryModalOpenClose,
                onHide: () => handleNoLossBMEntryShowAndCloseState(),
              }}
              modelPropForDelete={{
                show: handleAllModals?.noLossBMEntryModalDeleteOpenClose,
                onHide: () => handleNoLossBMEntryDeleteShowAndCloseState(),
              }}
              supportingTMList={supportingTMList}
              plantCategories={plantCategories}
              plantShiftsData={plantShiftsData}
              removeDataFromMaster={removeDataFromMaster}
            />
          )}
          <Box
            sx={{
              "& .ant-dropdown-trigger": {
                "&:hover": { bgcolor: "#ffcdcd66" },
                "& > .anticon .svg": { width: "1.4em", height: "1.4em" },
              },
              "& .ant-dropdown-trigger.active": {
                color: "#004fbf",
                bgcolor: "#b2d2ff8a",
              },
              "& .ant-table-cell > ul": {
                margin: "0px",
                padding: "0px",
                paddingLeft: "1rem",
              },
            }}
          >
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerBg: "#0fa3b1",
                    fontWeightStrong: 700,
                    borderColor: "#9f9f9f",
                    headerFilterActiveBg: "rgb(255, 230, 230)",
                    headerFilterHoverBg: "rgb(255, 255, 255)",
                    fontSize: 18,
                    fontSizeIcon: 15,
                    fontSizeSM: 15,
                    opacityLoading: 2.65,
                  },
                },
              }}
            >
              <Table
                columns={columns}
                dataSource={masterLogData}
                scroll={{ x: 2500, y: 700 }}
                pagination={false}
                bordered
              />
            </ConfigProvider>
          </Box>
        </>
      )}
    </>
  );
};

export default MasterLogTable;
