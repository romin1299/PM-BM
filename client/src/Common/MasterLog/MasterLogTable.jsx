import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Table, ConfigProvider, Space, Button } from "antd";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import MainRequestSheetForView from "../../BM/Tabs/RequestSheetForView/MainRequestSheetForView";
import ViewNoLossBDEntryForm from "../../BM/NoLossBDDataEntry/ViewNoLossBDEntryForm";
import moment from "moment";
import Loading from "../../components/Loading/Loading";

/**
 * How many more rows to put in the DOM each time the user reaches the bottom.
 *
 * Every row the API returns stays in memory, so the filters, the CSV export
 * and the row counts all still see the whole log - only the number of rows
 * handed to antd grows. The plant view returns about 19,500 rows, and
 * rendering all of them at once is roughly 450,000 table cells, which is what
 * left the page unresponsive after the data had already arrived.
 *
 * antd's own `virtual` table is not an option here: it positions rows by a
 * fixed height, and these rows vary - Problem, Cause, Action, Category and
 * Done By all render bullet lists - so they would clip and overlap.
 */
const ROWS_PER_CHUNK = 150;

/**
 * How far down the loaded rows the user has to be before the next chunk is
 * added, as a fraction of the scrollable content.
 *
 * Measured against the bottom edge of the visible area, so 0.75 means "three
 * quarters of what is loaded has been scrolled past". Fetching at three
 * quarters rather than at the bottom leaves a screenful or so still to scroll
 * through while the next rows are put in place, so the scroll does not stop.
 */
const SCROLL_TRIGGER_RATIO = 0.75;

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

  const [handleAllModals, handleAllModalsDispatch] = useReducer(
    reducer,
    initialState
  );

  // const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] =
  //   useState(false);

  // const [noLossBMEntryModalOpenClose, seNoLossBMEntryModalOpenClose] =
  //   useState(false);

  // Stable, so the column list below can be held in a memo: useReducer's
  // dispatch never changes identity.
  const handleRequestSheetShowAndCloseState = useCallback(() => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_RS });
  }, []);

  const handleNoLossBMEntryShowAndCloseState = useCallback(() => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_NO_LOSS_BD });
  }, []);

  const handleNoLossBMEntryDeleteShowAndCloseState = useCallback(() => {
    handleAllModalsDispatch({ type: ACTION?.OPEN_CLOSE_NO_LOSS_BD_DELETE });
  }, []);

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

  /**
   * Rebuilt only when something it reads changes.
   *
   * antd compares the column list by identity to decide what to re-render, and
   * this list carries the three filter trees - shifts, the plant's category
   * tree and the whole MTD name list - so handing it a fresh array on every
   * render had the table rebuild every header and dropdown each time.
   */
  const columns = useMemo(
    () => [
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
      width: 250,
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
        // A CM raised from a New-Machine modification request ends with the
        // requesting department's two approvals.
        {
          value: "Under PED TL Approval",
          text: "Under PED TL Approval",
        },
        {
          value: "Under PED HOS Approval",
          text: "Under PED HOS Approval",
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
    ],
    [
      plantShiftsData,
      plantCategories,
      supportingTMList,
      selectedYear,
      navigate,
      handleRequestSheetShowAndCloseState,
      handleNoLossBMEntryShowAndCloseState,
    ],
  );

  /**
   * What the user has picked in the column dropdowns, as antd reports it.
   *
   * antd filters whatever dataSource it is handed, so with only part of the
   * rows given to it, it would filter only that part and a search would miss
   * everything further down the log. The dropdowns themselves are untouched -
   * same options, same tree search, same Reset - and their own onFilter
   * predicates are applied below, over every row.
   */
  const [columnFilters, setColumnFilters] = useState({});
  const [visibleRowCount, setVisibleRowCount] = useState(ROWS_PER_CHUNK);
  const tableWrapperRef = useRef(null);

  const handleTableChange = useCallback((pagination, filters) => {
    setColumnFilters(filters ?? {});
  }, []);

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(
      ([, values]) => values && values.length
    );
    if (!activeFilters.length) return masterLogData ?? [];

    // antd keys a column's filter by its key, falling back to its dataIndex
    const tests = activeFilters.map(([columnKey, values]) => {
      const column = columns.find(
        (candidate) => (candidate.key ?? candidate.dataIndex) === columnKey
      );
      // several values picked in one column match any of them, and separate
      // columns must all match - the same way antd applies them
      return (row) =>
        !column?.onFilter || values.some((value) => column.onFilter(value, row));
    });

    return (masterLogData ?? []).filter((row) =>
      tests.every((test) => test(row))
    );
  }, [masterLogData, columnFilters, columns]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleRowCount),
    [filteredRows, visibleRowCount]
  );

  // A new filter, or a new fetch, starts the scroll from the top again.
  useEffect(() => setVisibleRowCount(ROWS_PER_CHUNK), [filteredRows]);

  /**
   * Read inside the scroll handler so that it does not have to be torn down
   * and re-attached every time the row count changes.
   */
  const filteredRowCountRef = useRef(0);
  filteredRowCountRef.current = filteredRows.length;

  useEffect(() => {
    const tableBody =
      tableWrapperRef.current?.querySelector(".ant-table-body");
    if (!tableBody) return;

    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = tableBody;

      // Nothing to measure against before the rows have been laid out; treat
      // that as "at the end" so a short table still tops itself up.
      const scrolledPast =
        scrollHeight > 0 ? (scrollTop + clientHeight) / scrollHeight : 1;

      if (scrolledPast < SCROLL_TRIGGER_RATIO) return;

      setVisibleRowCount((count) =>
        count >= filteredRowCountRef.current ? count : count + ROWS_PER_CHUNK
      );
    };

    tableBody.addEventListener("scroll", onScroll, { passive: true });
    return () => tableBody.removeEventListener("scroll", onScroll);
  }, [loading]);

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
              flagForTogglingFilter={flagForTogglingFilter}
              selectedValue={selectedValue}
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
              <div ref={tableWrapperRef}>
                <Table
                  columns={columns}
                  dataSource={visibleRows}
                  scroll={{ x: 2500, y: 700 }}
                  pagination={false}
                  bordered
                  onChange={handleTableChange}
                  footer={() =>
                    filteredRows.length === (masterLogData?.length ?? 0)
                      ? `Showing ${visibleRows.length} of ${filteredRows.length} rows`
                      : `Showing ${visibleRows.length} of ${filteredRows.length} matching rows (${masterLogData?.length ?? 0} in total)`
                  }
                />
              </div>
            </ConfigProvider>
          </Box>
        </>
      )}
    </>
  );
};

export default MasterLogTable;
