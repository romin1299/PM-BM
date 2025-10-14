import React, { useEffect, useReducer, useState } from "react";
import MaterialTable from "@material-table/core";
import { Col, Container, Row } from "react-bootstrap";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../Utils/TableUtils/MaterialTableProps";
import moment from "moment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import tableIcons from "../../components/MatrialTableIcon";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import { cyan, deepPurple, green, indigo, yellow } from "@mui/material/colors";
import { lightBlue, lightGreen, orange, red, teal } from "@mui/material/colors";
import CircleIcon from "@mui/icons-material/Circle";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import MainRequestSheetForView from "../Tabs/RequestSheetForView/MainRequestSheetForView";

const AllTheRequestSheetOfBMatOnePlacePlantWise = () => {
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState();
  const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] =
    useState(false);
  const [displayColumnOrNot, setDisplayColumnOrNot] = useState(true);

  const [betweenValue, setBetweenValue] = useState({
    greaterValue: localStorage.getItem("greaterValue"),
    lesserValue: localStorage.getItem("lesserValue"),
  });

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const ACTION = {
    SETUP_USERS: "set-user-dropdown-value",
  };

  const reducerForRequestSheetData = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          requestSheetData: action?.requestSheetData,
          TLHOSS_and_TM_user_list: action?.TLHOSS_and_TM_user_list,
          // MTD_or_PRD_user_list: action?.MTD_or_PRD_user_list,
          counters: action?.counters,
          message: action?.message,
        };

      default:
        return state;
    }
  };

  const initialStateForRequestSheetData = {
    requestSheetData: [],
    counters: {
      open_request_sheet_count: 0,
      closed_request_sheet_count: 0,
      total_request_sheet_count: 0,
    },
    message: "",
    emptyDataSourceMessage: false,
    // MTD_or_PRD_user_list: [],
    TLHOSS_and_TM_user_list: [],
  };

  const [reduceStateForRequestSheetData, reducerDispatchForRequestSheetData] =
    useReducer(reducerForRequestSheetData, initialStateForRequestSheetData);

  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";

  const statusColorMap = {
    Generated: lightBlue["A700"],
    Assigned: cyan["A400"],
    "Work Order Open": red["A400"],
    "Work Order Pending": orange["A200"],
    "Work Order Closed": lightGreen["A700"],
    "Fill Sheet": lightBlue["A100"],
    "Under MTD TL Approval": deepPurple[300],
    "Under MTD HOSS Approval": indigo[300],
    "Under PRD TL Approval": indigo[500],
    "Under PRD HOS Approval": cyan[300],
    "Under MTD HOS Approval": cyan[500],
    "Under MTD HOD Approval": teal[300],
    "Under PRD HOD Approval": teal[500],
    Completed: green["A700"],
    Rejected: "#e05050",
  };

  const RSStatusArray = [
    "Generated",
    "Assigned",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Fill Sheet",
    "Rejected",
    "Under MTD TL Approval",
    "Under MTD HOSS Approval",
    "Under PRD TL Approval",
    "Under PRD HOS Approval",
    "Under MTD HOS Approval",
    "Under MTD HOD Approval",
    "Under PRD HOD Approval",
    "Completed",
  ];
  const maintenanceTypeArrayForFilter = ["PM", "BM", "CM", "TPM"];

  const currentStatusOfRequestSheet = [
    {
      title: "Repair Under Progress",
      icon: <CircleIcon sx={{ color: red[500] }} />,
      count: reduceStateForRequestSheetData?.counters?.repairUnderProgress,
    },
    {
      title: "Waiting For Spare",
      icon: <CircleIcon sx={{ color: yellow[700] }} />,
      count: reduceStateForRequestSheetData?.counters?.waitingForSpare,
    },
    {
      title: "Machine Running",
      icon: <CircleIcon sx={{ color: green[500] }} />,
      count: reduceStateForRequestSheetData?.counters?.machineRunning,
    },
  ];

  const filtration = [
    <div className="d-flex">
      <Box sx={{ mx: "10px", my: "10px" }}>
        <ChartsToolbar
          baseUrlForFiltering={baseUrlForFiltering}
          reduceState={reduceState}
          reducerDispatch={reducerDispatch}
          monthFiltration
          yearFiltration
          sectionFiltration
          subSectionFiltration
          cellFiltration
          lineFiltration
          machineFiltration
          RSStatusArray={RSStatusArray}
          RSStatusFiltration
          maintenanceTypeArrayForFilter={maintenanceTypeArrayForFilter}
          maintenanceTypeFiltration
          resetButtonFiltration
          currentStatusOfRequestSheet={currentStatusOfRequestSheet}
          currentStatusOfRSFiltration
        />
      </Box>

      <Box display="flex" alignItems="center">
        <Tooltip title="Show/Hide Column">
          <Switch
            size="medium"
            checked={displayColumnOrNot}
            onClick={() =>
              setDisplayColumnOrNot((displayColumnOrNot) => !displayColumnOrNot)
            }
          />
        </Tooltip>
      </Box>

      <Box
        component="form"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}

        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          placeholder="From"
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&gt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setBetweenValue({ ...betweenValue, lesserValue: e.target.value });
            localStorage.setItem("lesserValue", e.target.value);
          }}
          value={betweenValue?.lesserValue}
        />
        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          placeholder="To"
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&lt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setBetweenValue({ ...betweenValue, greaterValue: e.target.value });
            localStorage.setItem("greaterValue", e.target.value);
          }}
          value={betweenValue?.greaterValue}
        />
        <Button
          // size="small"
          disableElevation
          className="bg-button"
          variant="contained"
          sx={{
            minWidth: "30px",
            height: "32px",
            paddingInline: "10px",
          }}
          //   onClick={getAllRequestSheetData}
        >
          Go
        </Button>
      </Box>
    </div>,
  ];

  let displayColumnBasedOnShowAndHide = [];

  if (displayColumnOrNot)
    displayColumnBasedOnShowAndHide = [
      {
        title: "Assign",
        field: "assignUser",
        editable: false,
      },
      {
        title: "Handover To",
        field: "handOverUser",
        editable: false,
      },
      {
        title: "Final Action",
        field: "finalActivity",
        editable: false,
        width: "20%",
      },
      {
        title: "H/O Time Work End", //hand-over time
        field: "handOverTime",
        idth: "10%",
        headerStyle: {
          width: 90,
          minWidth: 90,
        },
      },
      {
        title: "First Time/ Repeat",
        field: "firstTimeOrRepeat",
        width: "10%",
        editable: false,
      },
    ];

  const requestSheetHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: false,
      width: "5%",
    },
    {
      title: "Request No",
      field: "requestSheetNoOfBM",
      editable: false,
      //   width: displayColumnOrNot ? "5%" : "10%",
    },
    {
      title: "Product",
      field: "cell",
      editable: false,
    },
    {
      title: "Line",
      field: "line",
      editable: false,
    },
    {
      title: "Machine No",
      field: "machineNo",
      editable: false,
    },
    {
      title: "Machine Name",
      field: "machineName",
      editable: false,
    },
    {
      title: "Problem",
      field: "problem",
      editable: false,
      width: "25%",
    },
    {
      title: "Date-time",
      field: "problemOccurredDateAndTimeOfBM",
      editable: false,
      width: "15%",
    },
    {
      title: "Maintenance Type",
      field: "maintenanceType",
      editable: false,
      width: "5%",
      cellStyle: {
        textAlign: "center",
      },
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
      editable: false,
      cellStyle: {
        textAlign: "center",
      },
      render: (rowData) => (
        <button
          className="btn"
          style={{
            background: statusColorMap[rowData.requestSheetStatus],
            fontSize: "12px",
            cursor: "auto",
          }}
        >
          {rowData.requestSheetStatus}
        </button>
      ),
      width: "15%",
    },
    ...displayColumnBasedOnShowAndHide,
    {
      title: "Current Status",
      field: "currentStatusOfBD.status",
      editable: false,
      cellStyle: {
        textAlign: "center",
      },
      render: (rowData) =>
        rowData?.currentStatusOfBD?.status === "Repair Under Progress" ? (
          <CircleIcon sx={{ color: red[500] }} />
        ) : rowData?.currentStatusOfBD?.status === "Waiting For Spare" ? (
          <CircleIcon sx={{ color: yellow[700] }} />
        ) : rowData?.currentStatusOfBD?.status === "Machine Running" ? (
          <CircleIcon sx={{ color: green[500] }} />
        ) : (
          ""
        ),
    },
    {
      title: "Estimated Time",
      field: "currentStatusOfBD.estimatedTime",
    },
    {
      title: "Reason",
      field: "currentStatusOfBD.remarks",
    },
    {
      title: "Loss Time",
      field: "lossTime",
      editable: false,
    },
    {
      title: "W.O. Status",
      field: "work_order_status",
      //   editable: conditionalBasedEditableFunctionForMTD,
      editComponent: ({ value, onChange, rowData }) => (
        <select
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="work_order_status"
          fullWidth
          select
          defaultValue={rowData?.work_order_status}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {["Open", "Pending", "Closed"].map((option) => {
            return <option value={option}>{option}</option>;
          })}
        </select>
      ),
      validate: (rowData) => rowData.work_order_status !== "",
    },
  ];

  const handleRequestSheetShowAndCloseState = () => {
    setRequestSheetModalOpenClose(
      (requestSheetModalOpenClose) => !requestSheetModalOpenClose
    );
  };

  let requestSheetActions = [
    // Open Request Sheet for View
    (row) => ({
      icon: () => <VisibilityIcon className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        handleRequestSheetShowAndCloseState();
      },
    }),
  ];

  const getAllRequestSheetData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/getRequestSheetData/${reduceState?.flagForTogglingFilter}/${
          reduceState?.selectedValue
        }/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${
          reduceState?.selectedMonth
        }&&selectedRSStatus=${
          reduceState?.selectedRSStatus
        }&&selectedMaintenanceType=${
          reduceState?.selectedMaintenanceType
        }&&selectedCurrentStatusOfRS=${
          reduceState?.selectedCurrentStatusOfRS
        }&&greaterValue=${betweenValue?.greaterValue || 1000}&&lesserValue=${
          betweenValue?.lesserValue || 0
        }`,
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
        requestSheetData,
        counters,
        TLHOSS_and_TM_user_list,
        // MTD_or_PRD_user_list,
      } = await res.json();

      if (res?.status === 201) {
        reducerDispatchForRequestSheetData({
          type: ACTION.GET,
          requestSheetData,
          TLHOSS_and_TM_user_list,
          // MTD_or_PRD_user_list,
          counters,
          message,
        });
      } else {
        reducerDispatchForRequestSheetData({
          type: ACTION.GET,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (reduceState?.selectedValue) getAllRequestSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedMaintenanceType,
    reduceState?.selectedCurrentStatusOfRS,
  ]);

  return (
    <>
      <Container fluid>
        <Row className="cell py-2 px-3 mt-3 gap-2 g-0 align-items-center">
          <Col className="d-flex align-items-center gap-2">
            <Typography
              noWrap
              variant="h4"
              component="h4"
              fontSize={25}
              fontWeight={600}
              sx={{ mr: 3 }}
            >
              Plant Breakdown Status
            </Typography>
          </Col>
        </Row>
        <Box
          display="flex"
          className="mt-3 cell p-2 overflow-auto justify-content-between"
        >
          <div className="d-flex gap-2">
            {[
              {
                title: "Total Requests",
                value:
                  reduceStateForRequestSheetData?.counters
                    ?.total_request_sheet_count || 0,
                backgroundColor: "#c7defb",
              },
              {
                title: "Open Requests",
                value:
                  reduceStateForRequestSheetData?.counters
                    ?.open_request_sheet_count || 0,
                backgroundColor: "#feb4b4ba", // d6c7fbba, e1c7fb , d6c7fb
              },
              {
                title: "Closed Requests",
                value:
                  reduceStateForRequestSheetData?.counters
                    ?.closed_request_sheet_count || 0,
                backgroundColor: "#c6efce",
              },
            ].map((item) => (
              <Box className="col-auto">
                <Paper
                  variant="outlined"
                  sx={{
                    backgroundColor: item.backgroundColor,
                    // maxWidth: "100px",
                    p: "4px",
                    px: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="div"
                    textAlign="center"
                    // width={120}
                    fontWeight={500}
                    // color={"#15005c"}
                    // pt={"4px"}
                    // mb={"2px"}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="h5"
                    component="h5"
                    textAlign="center"
                    fontWeight={600}
                    // pb={"4px"}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </div>
          <div className="d-flex gap-2 m-3">
            {currentStatusOfRequestSheet.map((value) => (
              <Box className="col-auto">
                <Paper
                  variant="outlined"
                  sx={{
                    p: "4px",
                    px: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="div"
                    textAlign="center"
                    // width={120}
                    fontWeight={600}
                    // color={"#15005c"}
                    // pt={"4px"}
                    // mb={"2px"}
                  >
                    {value?.icon} &nbsp;
                    {value.title} {" - "}
                    {value?.count}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </div>
        </Box>
        <Box className="mt-1 cell p-0 border-0">
          <MaterialTable
            localization={{
              header: {
                actions: "Actions",
              },
            }}
            isLoading={loading}
            actions={requestSheetActions}
            icons={tableIcons}
            columns={requestSheetHeader}
            data={reduceStateForRequestSheetData?.requestSheetData}
            title={filtration}
            options={{
              ...MaterialTableOptions,
              pageSize: 50,
              maxBodyHeight: "auto",
              showTitle: true,
              // actionsCellStyle: {
              //   direction: "rtl",
              // },
              exportMenu: [
                {
                  label: "Export PDF",
                  exportFunc: (cols, data) =>
                    ExportPdf(
                      cols,
                      data,
                      `All requestSheet ${moment().format("DD-MM-YYYY")}`
                    ),
                },
                {
                  label: "Export CSV",
                  exportFunc: (cols, data) =>
                    ExportCsv(
                      cols,
                      data,
                      `All requestSheet ${moment().format("DD-MM-YYYY")}`
                    ),
                },
              ],
            }}
            style={MaterialTableStyle}
            sx={MaterialTableSX}
          />
        </Box>
      </Container>

      {requestSheetModalOpenClose && (
        <MainRequestSheetForView
          selectedYear={reduceState?.selectedYear}
          machine_code={selectedRow?.machineNo}
          requestSheetID={selectedRow?._id}
          modelProp={{
            show: requestSheetModalOpenClose,
            onHide: () => handleRequestSheetShowAndCloseState(),
          }}
        />
      )}
    </>
  );
};

export default AllTheRequestSheetOfBMatOnePlacePlantWise;
