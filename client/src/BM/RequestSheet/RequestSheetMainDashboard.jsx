import React, { useState, useEffect, useReducer, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { cyan, deepPurple, green, indigo } from "@mui/material/colors";
import { lightBlue, lightGreen, orange, red, teal } from "@mui/material/colors";

import MaterialTable, { MTableToolbar } from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import CancelIcon from "@mui/icons-material/Cancel";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RoutingContext from "../../context/routing/RoutingContext";
import { format } from "date-fns";
import MachineHistoryCard from "../HistoryCard/MachineHistoryCard";
import SummeryCard from "../HistoryCard/SummeryCard";
import moment from "moment";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import { InputAdornment, TextField } from "@mui/material";

import {
  Box,
  Button,
  Divider,
  Stack,
  Chip,
  Tooltip,
  Typography,
  Paper,
  Switch,
} from "@mui/material";
import BMTitlebar from "../Component/BMTitlebar";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../Utils/TableUtils/MaterialTableProps";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as HistoryIcon } from "../../static/svg/history.svg";
import { ReactComponent as EditSheetIcon } from "../../static/svg/edit-sheet-2.svg";
import EditSheetIconSVG from "../../static/svg/edit-sheet-2.svg";
import EditIcon from "@mui/icons-material/Edit";
import MainRequestSheetForView from "../Tabs/RequestSheetForView/MainRequestSheetForView";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import SparePartsRequestForm from "../SparePartsRequest/SparePartsRequestForm";

const RequestSheetMainDashboard = () => {
  const [loading, setLoading] = React.useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const context = useContext(RoutingContext);

  const [selectedRow, setSelectedRow] = useState();
  const [machineHistoryCardModal, setMachineHistoryCardModal] = useState(false);
  const [summeryCardModal, setSummeryCardModal] = useState(false);
  const [displayColumnOrNot, setDisplayColumnOrNot] = useState(true);
  const [sparePartsRequestModal, setSparePartsRequestModal] = useState(false);
  const [greaterValue, setGreaterValue] = useState(
    localStorage.getItem("greaterValue") 
  );
  const [lesserValue, setLesserValue] = useState(
    localStorage.getItem("lesserValue")
  );

  const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] =
    useState(false);

  const statusColorMap = {
    // Generated: "#9bcbdb",
    // Assigned: "#ffe031",
    // "Work Order Open": "#ca2626",
    // "Work Order Pending": "#F59F00",
    // "Work Order Closed": "#70b332",
    // "Fill Sheet": "#89e9eb",
    // "Under MTD TL Approval": "#c196d4",
    // "Under MTD HOSS Approval": "#c196d4",
    // "Under PRD TL Approval": "#c196d4",
    // "Under PRD HOS Approval": "#c196d4",
    // "Under MTD HOS Approval": "#c196d4",
    // "Under MTD HOD Approval": "#c196d4",
    // "Under PRD HOD Approval": "#c196d4",
    // Completed: "#3fad3f",
    // Rejected: "#ff3232",

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
    "Under MTD TL approval",
    "Under MTD HOSS approval",
    "Under PRD TL Approval",
    "Under PRD HOS Approval",
    "Under MTD HOS Approval",
    "Under MTD HOD Approval",
    "Under PRD HOD Approval",
    "Completed",
  ];

  const maintenanceTypeArrayForFilter = ["PM", "BM", "CM", "TPM"];

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

  const ACTION = {
    DELETE: "delete-popup",
    SETUP_USERS: "set-user-dropdown-value",
    UPDATE_REQUEST_SHEET: "update-request-sheet",
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

      case ACTION?.UPDATE_REQUEST_SHEET:
        return {
          ...state,
          requestSheetData: state?.requestSheetData?.map((item) =>
            item?._id === action?.requestSheet?._id
              ? action?.requestSheet
              : item
          ),
          message: action?.message,
        };

      default:
        return state;
    }
  };

  const [reduceStateForRequestSheetData, reducerDispatchForRequestSheetData] =
    useReducer(reducerForRequestSheetData, initialStateForRequestSheetData);

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

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
        }&&greaterValue=${greaterValue || 1000}&&lesserValue=${
          lesserValue || 0
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
  useEffect(()=>{
    localStorage.setItem("greaterValue", "")
    localStorage.setItem("lesserValue", "")
  },[])

  const updateRequestSheet = async (updatedRow) => {
    try {
      const res = await fetch(`/updateRequestSheet/?_id=${updatedRow?._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRow),
      });

      const { requestSheet, message } = await res.json();

      if (res.status === 201) {
        reducerDispatchForRequestSheetData({
          type: ACTION.UPDATE_REQUEST_SHEET,
          requestSheet,
          message,
        });
        return requestSheet;
      } else {
        console.log("error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRequestSheet = async (selectedRow) => {
    try {
      const res = await fetch(`/deleteRequestSheet/${selectedRow?._id}`, {
        method: "DELETE",
        // headers: {
        //   "Content-Type": "application/json",
        // },
        // body: JSON.stringify(updatedRow),
      });

      const { deletedRequestSheet, message } = await res.json();

      const updatedRequestSheetData =
        reduceStateForRequestSheetData.requestSheetData.filter(
          (row) => row._id !== selectedRow._id
        );

      if (res.status === 201) {
        let countersObj = {
          open_request_sheet_count:
            reduceStateForRequestSheetData.counters?.open_request_sheet_count -
            1,
        };

        if (selectedRow?.requestSheetStatus === "Completed") {
          countersObj = {
            closed_request_sheet_count:
              reduceStateForRequestSheetData.counters
                ?.closed_request_sheet_count - 1,
          };
        }

        reducerDispatchForRequestSheetData({
          type: ACTION.GET,
          requestSheetData: updatedRequestSheetData,
          TLHOSS_and_TM_user_list:
            reduceStateForRequestSheetData.TLHOSS_and_TM_user_list,
          counters: {
            ...reduceStateForRequestSheetData.counters,
            ...countersObj,
            total_request_sheet_count:
              reduceStateForRequestSheetData.counters
                ?.total_request_sheet_count - 1,
          },
          message,
        });
        // return updatedRequestSheetData;
      } else {
        console.log("error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reduceState?.selectedValue) getAllRequestSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedMaintenanceType,
  ]);

  const handleGenerateBMNavigation = async () => {
    navigate(`/bm/generateRequestSheetMainDashboard`);
  };

  const handleSparePartsModelState = () =>
    setSparePartsRequestModal(
      (sparePartsRequestModal) => !sparePartsRequestModal
    );

  // const conditionalBasedEditableFunctionForPRD = (_, row) => {
  //   if (
  //     context?.tm_department === "PRD" &&
  //     context?.user_type === "TL/HOSS" &&
  //     row?.assignUser
  //   ) {
  //     return true;
  //   }
  //   return false;
  // };

  const conditionalBasedEditableFunctionForMTD = (col, row) => {
    if (
      (context?.tm_department === "MTD" ||
        row?.assignUserId === context?._id ||
        row?.handOverUserId === context?._id) &&
      (row?.requestSheetStatus === RSStatusArray[1] ||
        row?.requestSheetStatus === RSStatusArray[2] ||
        row?.requestSheetStatus === RSStatusArray[3] ||
        row?.requestSheetStatus === RSStatusArray[4])
    ) {
      return true;
    }
    return false;
  };

  const dropDownComponent = ({
    value,
    onChange,
    dropDownArray,
    defaultValue,
  }) => (
    <select
      aria-label=".form-select-sm example"
      id="standard-select-currency"
      name={value}
      fullWidth
      select
      defaultValue={defaultValue}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      variant="standard"
    >
      <option selected disabled value="">
        Please select
      </option>
      {dropDownArray?.map((option) => {
        return <option value={option?._id}>{option?.tm_name}</option>;
      })}
    </select>
  );

  let displayColumnBasedOnShowAndHide = [];

  if (displayColumnOrNot)
    displayColumnBasedOnShowAndHide = [
      {
        title: "Assign",
        field: "assignUser",
        // editable: context?.tm_department === "MTD" ? "always" : "never",
        editable: (_, row) =>
          context?.tm_department === "MTD" &&
          row?.requestSheetStatus === RSStatusArray[0]
            ? true
            : false,
        editComponent: ({ value, onChange, rowData }) =>
          dropDownComponent({
            value,
            onChange,
            defaultValue: rowData?.assignUserId,
            dropDownArray:
              reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
          }),
        validate: (rowData) => {
          return rowData.assignUser === undefined &&
            rowData?.tableData?.editing === "update"
            ? { isValid: false, helperText: "Assign user cannot be empty" }
            : true;
        },
      },
      {
        title: "Handover To",
        field: "handOverUser",
        // editable: context?.tm_department === "MTD" ? "always" : "never",
        editable: (col, row) =>
          context?.tm_department === "MTD" &&
          (row?.requestSheetStatus === RSStatusArray[1] ||
            row?.requestSheetStatus === RSStatusArray[2] ||
            row?.requestSheetStatus === RSStatusArray[3] ||
            row?.requestSheetStatus === RSStatusArray[4])
            ? true
            : false,
        editComponent: ({ value, onChange, rowData }) => {
          return dropDownComponent({
            value: value,
            onChange,
            defaultValue: rowData?.handOverUserId,
            dropDownArray:
              reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
          });
        },
      },
      {
        title: "Final Action",
        field: "finalActivity",
        editable: conditionalBasedEditableFunctionForMTD,
        width: "20%",
      },
      {
        title: "H/O Time Work End", //hand-over time
        field: "handOverTime",
        width: "10%",
        headerStyle: {
          width: 90,
          minWidth: 90,
        },
        editable: conditionalBasedEditableFunctionForMTD,
        editComponent: ({ value, onChange, rowData }) => {
          return (
            // <LocalizationProvider dateAdapter={AdapterDateFns}>
            //   <MobileDateTimePicker
            //     renderInput={(props) => (
            //       <input className="text-field mt-0" value={value} {...props} />
            //     )}
            //     value={
            //       value
            //         ? typeof value === "object"
            //           ? new Date(value)
            //           : new Date(rowData?.handOverTimeForDefault)
            //         : new Date()
            //     }
            //     format="dd/MM/yyyy HH:mm"
            //     sx={{ width: "11rem" }}
            //     onChange={(handOverTime) => {
            //       onChange(handOverTime || new Date());
            //       // onChange(handOverTime.toString());
            //     }}
            //     ampm={false}
            //   />
            // </LocalizationProvider>

            <input
              type="datetime-local"
              style={{ width: "165px" }}
              // defaultValue={moment(new Date()).format("YYYY-MM-DDTHH:mm")}
              value={
                value
                  ? moment(value, "YYYY-MM-DDTHH:mm", true).isValid()
                    ? value
                    : moment(rowData?.handOverTimeForDefault).format(
                        "YYYY-MM-DDTHH:mm"
                      )
                  : moment(new Date()).format("YYYY-MM-DDTHH:mm")
              }
              onChange={(e) => onChange(e.target.value)}
            />
          );
        },
        validate: (rowData) => rowData.handOverTime !== "",
      },

      {
        title: "First Time/ Repeat",
        field: "firstTimeOrRepeat",
        width: "10%",
        editable: false,
      },
    ];
console.log("THis is ",reduceStateForRequestSheetData?.requestSheetData)
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
      width: displayColumnOrNot ? "5%" : "10%",
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
      title: "Loss Time",
      field: "lossTime",
      editable: false,
    },
    {
      title: "W.O. Status",
      field: "work_order_status",
      editable: conditionalBasedEditableFunctionForMTD,
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

  const handleMachineHistoryCardState = () => {
    setMachineHistoryCardModal(
      (machineHistoryCardModal) => !machineHistoryCardModal
    );
  };

  const handleSummeryCardState = () => {
    setSummeryCardModal((summeryCardModal) => !summeryCardModal);
  };

  const handleRequestSheetShowAndCloseState = () => {
    setRequestSheetModalOpenClose(
      (requestSheetModalOpenClose) => !requestSheetModalOpenClose
    );
  };

  let requestSheetActions = [
    // Edit Request Sheet
    (row) => ({
      icon: (props) => (
        <SvgIcon
          component={EditSheetIcon}
          sx={{
            color: props.disabled ? "inherit" : "#FF6F00",
          }}
          inheritViewBox
        />

        // <SvgIcon sx={{ color: "yellow" }}>
        //   <EditSheetIcon color="green" />
        // </SvgIcon>

        // <DescriptionIcon />
      ),
      tooltip: "Update Req-sheet",
      position: "row",
      disabled:
        (row?.assignUserId === context?._id ||
          row?.handOverUserId === context?._id) &&
        RSStatusArray.slice(2, 7).includes(row?.requestSheetStatus)
          ? false
          : true,
      onClick: (event, selectedRow) =>
        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}`,
          {
            state: {
              supportingTM:
                reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
            },
          }
        ),
    }),

    // Open Request Sheet for View
    (row) => ({
      icon: () => <VisibilityIcon className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        handleRequestSheetShowAndCloseState();
        // navigate(
        //   `/bm/view/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}`,
        //   {
        //     state: {
        //       prevPath: location?.pathname,
        //       prevPathSearch: location?.search,
        //       supportingTM:
        //         reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
        //     },
        //   }
        // );
      },
    }),

    // Open History card of selected machine for View
    (row) => ({
      icon: () => (
        <HistoryIcon />

        // <SvgIcon
        //   component={HistoryIcon}
        //   sx={{ color: "#FF6F00" }}
        //   // viewBox="0 0 22 22"
        //   inheritViewBox
        // />
      ),
      tooltip: "History Card",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        handleMachineHistoryCardState();
      },
    }),

    (rowData) => ({
      icon: () => <EditIcon />,
      tooltip: "Edit Action",
      disabled: true,
      hidden:
        context?.tm_department !== "PRD" &&
        RSStatusArray.slice(0, 6).includes(rowData?.requestSheetStatus),
    }),

    (row) => ({
      icon: () => (
        <ContactMailIcon />

        // <SvgIcon
        //   component={HistoryIcon}
        //   sx={{ color: "#FF6F00" }}
        //   // viewBox="0 0 22 22"
        //   inheritViewBox
        // />
      ),
      tooltip: "Spare Require Mail",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        handleSparePartsModelState();
      },
    }),
  ];

  if (context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus === "Yes") {
    requestSheetActions?.push({
      icon: () => <DriveFileRenameOutlineIcon className="text-primary" />,
      tooltip: "Edit After All Approval",
      position: "row",
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/edit/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}`,
          {
            state: {
              prevPath: location?.pathname,
              prevPathSearch: location?.search,
              supportingTM:
                reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
            },
          }
        );
      },
    });
  }

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
          isWithLocalStorageForFiltration="Yes"
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
            setLesserValue(e.target.value);
            localStorage.setItem("lesserValue", e.target.value);
          }}
          value={lesserValue}
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
            setGreaterValue(e.target.value);
            localStorage.setItem("greaterValue", e.target.value);
          }}
          value={greaterValue}
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
          onClick={getAllRequestSheetData}
        >
          Go
        </Button>
      </Box>
    </div>,
  ];

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
              Request Sheet Progress Monitoring
            </Typography>
          </Col>

          <Box display="flex" gap="16px" className="col-auto">
            <Button
              variant="contained"
              disableElevation
              onClick={handleGenerateBMNavigation}
              disabled={context?.tm_department !== "PRD"}
              sx={{
                fontWeight: 400,
                bgcolor: "#004b5b",
                "&:hover": { bgcolor: "#026378" },
              }}
            >
              <AddCircleIcon sx={{ mr: "8px" }} />
              Generate Request-Sheet
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSummeryCardState}
              className={`bg-button d-inline`}
              sx={{ fontWeight: 400 }}
            >
              Summary
            </Button>
          </Box>
        </Row>

        <Box display="flex" gap="16px" className="mt-3 cell p-2 overflow-auto">
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
        </Box>

        {/* Btns with new styles with mui Box */}
        {/* <Row className="mt-3 gx-3 justify-content-end">
          <Col className="col-auto">
            <Button
              variant="contained"
              disableElevation
              onClick={handleGenerateBMNavigation}
              className={
                context?.tm_department !== "PRD"
                  ? `bg-button d-inline`
                  : "d-none"
              }
              sx={{ fontWeight: 400 }}
            >
              <AddCircleIcon sx={{ mr: "8px" }} />
              Generate Request-Sheet
            </Button>
          </Col>
          <Col className="col-auto">
            <Button
              variant="contained"
              disableElevation
              onClick={handleSummeryCardState}
              className={`bg-button d-inline`}
              sx={{ fontWeight: 400 }}
            >
              Summary
            </Button>
          </Col>
        </Row> */}

        {/* <Row className="d-flex align-items-center justify-content-center cell mt-3 p-2 g-0">
          <Col lg={4} md={4}>
            <Typography
              noWrap
              variant="h4"
              component="h4"
              fontSize={25}
              fontWeight={600}
              // sx={{ mr: 3 }}
            >
              Request-Sheet Dashboard
            </Typography>
          </Col>
          <Col md={{ span: 4, offset: 4 }}>
            <Row className="text-center">
              <Col lg={4} md={4}>
                <span>
                  <b>Total Request</b>
                </span>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "center" }}
                >
                  <Chip
                    icon={<InsertDriveFileIcon />}
                    label={
                      reduceStateForRequestSheetData?.counters
                        ?.total_request_sheet_count || 0
                    }
                    color="primary"
                    sx={{ padding: 2.5, textAlign: "center", fontSize: 20 }}
                  />
                </Stack>
              </Col>
              <Col lg={4} md={4}>
                <b> Open Request</b>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "center" }}
                >
                  <Chip
                    icon={<ArrowCircleRightIcon />}
                    label={
                      reduceStateForRequestSheetData?.counters
                        ?.open_request_sheet_count || 0
                    }
                    color="secondary"
                    sx={{ padding: 2.5, textAlign: "center", fontSize: 20 }}
                  />
                </Stack>
              </Col>
              <Col lg={4} md={4}>
                <b>Closed Request</b>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "center" }}
                >
                  <Chip
                    icon={<FactCheckIcon />}
                    label={
                      reduceStateForRequestSheetData?.counters
                        ?.closed_request_sheet_count || 0
                    }
                    color="success"
                    sx={{ padding: 2.5, textAlign: "center", fontSize: 20 }}
                  />
                </Stack>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row className="justify-content-end mt-3">
          <Col className="col-auto">
            <button
              onClick={handleGenerateBMNavigation}
              className={
                context?.tm_department === "PRD"
                  ? `btn bg-button d-inline`
                  : "d-none"
              }
            >
              <AddCircleIcon /> &nbsp; Generate Request-Sheet
            </button>
          </Col>
          <Col className="col-auto">
            <button
              onClick={handleSummeryCardState}
              className={
                `btn bg-button d-inline`
                // context?.tm_department === "PRD"
                //   ? `btn bg-button d-inline`
                //   : "d-none"
              }
            >
              Summary
            </button>
          </Col>
        </Row> */}

        {/* <Row>
          <NewRequestSheetRegistration />
        </Row> */}

        <Box className="mt-1 cell p-0 border-0">
          <MaterialTable
            localization={{
              header: {
                actions: "Actions",
              },
              // toolbar: {
              //   exportCSVName: "Export some Excel format",
              //   exportPDFName: "Export as pdf!!"
              // }
            }}
            isLoading={loading}
            actions={requestSheetActions}
            icons={tableIcons}
            columns={requestSheetHeader}
            data={reduceStateForRequestSheetData?.requestSheetData}
            title={filtration}
            // tableRef={this.tableRef.current.onQueryChange()}

            editable={{
              // onRowAdd: (newRow) =>
              //   new Promise((resolve, reject) => {
              //     setTimeout(() => {
              //       resolve();
              //     }, 500);
              //     //refreshPage();
              //   }),

              isDeleteHidden: (rowData) =>
                context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus !==
                "Yes",

              isEditHidden: (rowData) =>
                (rowData?.requestSheetStatus !== RSStatusArray[0] &&
                  rowData?.requestSheetStatus !== RSStatusArray[1] &&
                  rowData?.requestSheetStatus !== RSStatusArray[2] &&
                  rowData?.requestSheetStatus !== RSStatusArray[3] &&
                  rowData?.requestSheetStatus !== RSStatusArray[4] &&
                  rowData?.requestSheetStatus !== RSStatusArray[5]) ||
                context?.tm_department === "PRD",

              onRowDelete: (selectedRow) =>
                new Promise(async (resolve, reject) => {
                  // setTimeout(() => {
                  await deleteRequestSheet(selectedRow);
                  resolve();
                  // }, 500);
                }),

              onRowUpdate: (updatedRow, oldRow) =>
                new Promise(async (resolve, reject) => {
                  await updateRequestSheet(updatedRow);
                  resolve();
                }),
            }}
            // components={{
            //   Toolbar: (props) => (
            //     <div
            //       style={{
            //         display: "flex",
            //         justifyContent: "space-between",
            //         alignItems: "center",
            //       }}
            //     >
            //       {filtration}
            //       <div style={{ width: "13rem" }}>
            //         <MTableToolbar {...props} />
            //       </div>
            //     </div>
            //   ),
            // }}
            options={{
              ...MaterialTableOptions,
              pageSize:
                reduceStateForRequestSheetData?.requestSheetData?.length > 10
                  ? 10
                  : reduceStateForRequestSheetData?.requestSheetData?.length,
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

      {machineHistoryCardModal && (
        <MachineHistoryCard
          selectedYear={reduceState?.selectedYear}
          selectedMonth={reduceState?.selectedMonth}
          selectedRow={selectedRow}
          modelProp={{
            show: machineHistoryCardModal,
            onHide: () => handleMachineHistoryCardState(),
          }}
        />
      )}
      {summeryCardModal &&
        (reduceState?.selectedSubSection || reduceState?.selectedSection) && (
          <SummeryCard
            selectedValue={
              reduceState?.selectedSubSection || reduceState?.selectedSection
            }
            flagForTogglingFilter={
              reduceState?.selectedSubSection
                ? "based-on-subSection"
                : "based-on-section"
            }
            selectedYear={reduceState?.selectedYear}
            selectedMonth={reduceState?.selectedMonth}
            modelProp={{
              show: summeryCardModal,
              onHide: () => handleSummeryCardState(),
            }}
          />
        )}

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

      {sparePartsRequestModal && (
        <SparePartsRequestForm
          selectedRow={selectedRow}
          modelProp={{
            show: sparePartsRequestModal,
            onHide: handleSparePartsModelState,
          }}
        />
      )}
    </>
  );
};

export default RequestSheetMainDashboard;
