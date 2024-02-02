import React, { useState, useEffect, useReducer, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { cyan, deepPurple, green, indigo } from "@mui/material/colors";
import { lightBlue, lightGreen, orange, red, teal } from "@mui/material/colors";

import MaterialTable from "@material-table/core";
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
import {
  Box,
  Button,
  Divider,
  Stack,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import BMTitlebar from "../Component/BMTitlebar";
import { MaterialTableOptions } from "../Utils/TableUtils/MaterialTableProps";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

const RequestSheetMainDashboard = () => {
  const [loading, setLoading] = React.useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const context = useContext(RoutingContext);

  const [selectedRow, setSelectedRow] = useState();
  const [machineHistoryCardModal, setMachineHistoryCardModal] = useState(false);
  const [summeryCardModal, setSummeryCardModal] = useState(false);

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
  };

  const statusArray = [
    "Generated",
    "Assigned",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Fill Sheet",
    "Under MTD TL approval",
    "Under MTD HOSS approval",
    "Under MTD HOS approval",
  ];

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

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const getAllRequestSheetData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getRequestSheetData/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`,
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
        reducerDispatchForRequestSheetData({
          type: ACTION.GET,
          requestSheetData: updatedRequestSheetData,
          TLHOSS_and_TM_user_list:
            reduceStateForRequestSheetData.TLHOSS_and_TM_user_list,
          counters: reduceStateForRequestSheetData.counters,
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
  ]);

  const handleGenerateBMNavigation = async () => {
    navigate(`/bm/generateRequestSheetMainDashboard`);
  };

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
      (row?.requestSheetStatus === statusArray[1] ||
        row?.requestSheetStatus === statusArray[2] ||
        row?.requestSheetStatus === statusArray[3] ||
        row?.requestSheetStatus === statusArray[4])
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
      width: "20%",
    },
    {
      title: "Date-time",
      field: "problemOccurredDateAndTimeOfBM",
      editable: false,
      width: "10%",
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
      editable: false,
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
    },
    {
      title: "Assign",
      field: "assignUser",
      // editable: context?.tm_department === "MTD" ? "always" : "never",
      editable: (_, row) =>
        context?.tm_department === "MTD" &&
        row?.requestSheetStatus === statusArray[0]
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
    },
    {
      title: "Handover To",
      field: "handOverUser",
      // editable: context?.tm_department === "MTD" ? "always" : "never",
      editable: (col, row) =>
        context?.tm_department === "MTD" &&
        (row?.requestSheetStatus === statusArray[1] ||
          row?.requestSheetStatus === statusArray[2] ||
          row?.requestSheetStatus === statusArray[3] ||
          row?.requestSheetStatus === statusArray[4])
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
      validate: (rowData) => rowData.finalActivity !== "",
    },
    // {
    //   title: "MTD Quality Check",
    //   field: "MTDUser",
    //   editable: context?.tm_department === "MTD" ? "always" : "never",
    //   editComponent: ({ value, onChange }) => (
    //     <Multiselect
    //       displayValue="tm_name"
    //       className="col-9 "
    //       options={reduceState?.MTD_or_PRD_user_list}
    //       onSelect={async (selectedList) => {
    //         await onChange(selectedList);
    //       }}
    //       onRemove={async (selectedList) => {
    //         await onChange(selectedList);
    //       }}
    //       style={{
    //         multiselectContainer: {
    //           width: "15rem",
    //         },
    //       }}
    //     />
    //   ),
    // },
    {
      title: "H/O Time Work End", //hand-over time
      field: "handOverTime",
      editable: conditionalBasedEditableFunctionForMTD,
      editComponent: ({ value, onChange, rowData }) => {
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileDateTimePicker
              renderInput={(props) => (
                <input className="text-field mt-0" value={value} {...props} />
              )}
              value={
                value
                  ? typeof value === "object"
                    ? new Date(value)
                    : new Date(rowData?.handOverTimeForDefault)
                  : new Date()
              }
              format="dd/MM/yyyy hh:mm"
              sx={{ width: "11rem" }}
              onChange={(handOverTime) => {
                onChange(handOverTime || new Date());
                // onChange(handOverTime.toString());
              }}
            />
          </LocalizationProvider>
        );
      },
      validate: (rowData) => rowData.handOverTime !== "",
      width: "20%",
    },
    {
      title: "Loss Time",
      field: "lossTime",
      editable: false,
    },
    // {
    //   title: "PRD Quality Check",
    //   field: "PRDUser",
    //   editable: conditionalBasedEditableFunctionForPRD,
    //   editComponent: ({ value, onChange }) =>
    //     dropDownComponent({
    //       value,
    //       onChange,
    //       dropDownArray: reduceState?.MTD_or_PRD_user_list,
    //     }),
    //   // editComponent: ({ value, onChange }) => (
    //   //   <RadioGroup
    //   //     row
    //   //     aria-labelledby="demo-row-radio-buttons-group-label"
    //   //     name="row-radio-buttons-group"
    //   //     style={{ marginTop: "0.2rem" }}
    //   //   >
    //   //     <div>
    //   //       <input
    //   //         type="radio"
    //   //         name="PRDUser"
    //   //         value="Yes"
    //   //         onChange={(e) => onChange(e.target.value)}
    //   //       />
    //   //       <span for="html" className="m-2">
    //   //         Yes
    //   //       </span>
    //   //       <input
    //   //         type="radio"
    //   //         name="PRDUser"
    //   //         value="No"
    //   //         onChange={(e) => onChange(e.target.value)}
    //   //       />
    //   //       <span for="html" className="m-2">
    //   //         No
    //   //       </span>
    //   //     </div>
    //   //   </RadioGroup>
    //   // ),
    // },
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

  let requestSheetActions = [
    {
      icon: () => <CreditCardIcon className="text-primary1" />,
      tooltip: "History Card",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        handleMachineHistoryCardState();
      },
    },
    (row) => ({
      icon: () => (
        <DescriptionIcon
          className={
            row?.work_order_status === "Open"
              ? "text-secondary"
              : "text-primary"
          }
        />
      ),
      tooltip: "Update",
      position: "row",
      disabled:
        (row?.assignUserId === context?._id ||
          row?.handOverUserId === context?._id) &&
        (row?.work_order_status === "Pending" ||
          row?.work_order_status === "Closed")
          ? false
          : true,
      hidden: row?.assignUserId === context?._id ? false : true,
      onClick: (event, selectedRow) => {
        console.log("selectedRow:", selectedRow);

        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}`,
          {
            state: {
              supportingTM:
                reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
            },
          }
        );
      },
    }),

    (row) => ({
      icon: () => <VisibilityIcon className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/view/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}`,
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
    }),
  ];

  if (context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus === "Yes") {
    requestSheetActions?.push({
      icon: () => <DriveFileRenameOutlineIcon className="text-primary" />,
      tooltip: "Edit",
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
    <Box m={2}>
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
        resetButtonFiltration
      />
    </Box>,
  ];
  return (
    <>
      <Container fluid>
        <Row className="d-flex align-items-center justify-content-center cell mt-3 p-2 g-0">
          <Col lg={4} md={4}>
            <Typography
              noWrap
              variant="h4"
              component="h4"
              fontSize={25}
              fontWeight={600}
              // sx={{ mr: 3 }}
            >
              Request-Sheet Work Order
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
              <AddCircleIcon /> &nbsp; Generate New Request-Sheet
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
        </Row>

        {/* <Row>
          <NewRequestSheetRegistration />
        </Row> */}

        <Row>
          <Col>
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
                  context?.userType !== "TL/HOSS" &&
                  context?.tm_department !== "MTD",

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
              options={{
                ...MaterialTableOptions,
                maxBodyHeight: "auto",
                showTitle: true,
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
            />
          </Col>
        </Row>
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
    </>
  );
};

export default RequestSheetMainDashboard;
