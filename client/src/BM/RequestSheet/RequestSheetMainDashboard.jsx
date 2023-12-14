import React, { useState, useEffect, useReducer, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { RadioGroup } from "@mui/material";
import TextField from "@material-ui/core/TextField";

import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DescriptionIcon from "@mui/icons-material/Description";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import CancelIcon from "@mui/icons-material/Cancel";

import RoutingContext from "../../context/routing/RoutingContext";

import MachineHistoryCard from "../HistoryCard/MachineHistoryCard";

import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  Box,
  Button,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import BMTitlebar from "../Component/BMTitlebar";
import { MaterialTableOptions } from "../Utils/TableUtils/MaterialTableProps";

import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

const RequestSheetMainDashboard = () => {
  const navigate = useNavigate();

  const context = useContext(RoutingContext);

  const [selectedRow, setSelectedRow] = useState();
  const [machineHistoryCardModal, setMachineHistoryCardModal] = useState(false);
  const statusColorMap = {
    "Generated": "#9bcbdb",
    "Assigned": "#ffe031",
    "Work Order Open": "#70b332",
    "Work Order Pending": "#F59F00",
    "Work Order Closed": "#ca2626",
    "Fill Sheet": "#89e9eb",
    "Under MTD TL Approval": "#c196d4",
    "Under MTD HOSS Approval": "#c196d4",
    "Under PRD TL Approval": "#c196d4",
    "Under PRD HOS Approval": "#c196d4",
    "Under MTD HOS Approval": "#c196d4",
    "Under MTD HOD Approval": "#c196d4",
    "Under PRD HOD Approval": "#c196d4",
    "Completed": "#3fad3f",
    "Rejected": "#ff3232",
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
      }
    } catch (error) {
      console.log(error);
    }
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
      context?.tm_department === "MTD" &&
      (col?.field === "work_order_status"
        ? row?.requestSheetStatus !== statusArray[0]
        : row?.requestSheetStatus === statusArray[1])
    ) {
      return true;
    }
    return false;
  };

  const dropDownComponent = ({ value, onChange, dropDownArray }) => (
    <select
      aria-label=".form-select-sm example"
      id="standard-select-currency"
      name={value}
      fullWidth
      select
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
        <button className="btn" style={{ background: statusColorMap[rowData.requestSheetStatus], fontSize: "12px", cursor:"auto"}}>
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
      editComponent: ({ value, onChange }) =>
        dropDownComponent({
          value,
          onChange,
          dropDownArray:
            reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
        }),
    },
    {
      title: "Handover To",
      field: "handOverUser",
      // editable: context?.tm_department === "MTD" ? "always" : "never",
      editable: (_, row) =>
        context?.tm_department === "MTD" &&
        row?.requestSheetStatus === statusArray[0]
          ? true
          : false,
      editComponent: ({ value, onChange }) =>
        dropDownComponent({
          value,
          onChange,
          dropDownArray:
            reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
        }),
    },
    {
      title: "Final Action",
      field: "finalActivity",
      editable: conditionalBasedEditableFunctionForMTD,
      width: "20%",
      validate: rowData => rowData.finalActivity !== '',
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
      editComponent: ({ value, onChange }) => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MobileDateTimePicker
            renderInput={(props) => (
              <input className="text-field mt-0" value={value} {...props} />
            )}
            value={value}
            onChange={(handOverTime) => {
              onChange(handOverTime);
              // onChange(handOverTime.toString());
            }}
          />
        </LocalizationProvider>
      ),
      validate: rowData => rowData.handOverTime !== '',
      width: "10%",
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
      editComponent: ({ value, onChange }) => (
        <select
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="work_order_status"
          fullWidth
          select
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
      validate: rowData => rowData.work_order_status !== '',
    },
  ];

  const handleMachineHistoryCardState = () => {
    setMachineHistoryCardModal(
      (machineHistoryCardModal) => !machineHistoryCardModal
    );
  };
  const requestSheetActions = [
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
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",
      disabled:
        row?.assignUserId === context?._id &&
        (row?.work_order_status === "Pending" ||
          row?.work_order_status === "Closed")
          ? false
          : true,
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}`,
          {
            state: {
              supportingTM:
                reduceStateForRequestSheetData?.TLHOSS_and_TM_user_list,
            },
          }
        );
      },
    }),
  ];

  const filtration = [
    <ChartsToolbar
      baseUrlForFiltering={baseUrlForFiltering}
      reduceState={reduceState}
      reducerDispatch={reducerDispatch}
      monthFiltration
    />,
  ];

  return (
    <>
      <Container fluid>
        <Row className="d-flex align-items-center justify-content-center cell mt-3 p-1 gap-2 g-0">
          <Col>
            <BMTitlebar title="Request-Sheet Work Order" />
          </Col>
          <Col>
            <Row className="d-flex align-items-center justify-content-center p-2">


              <Col>
                <Box className="cell rounded-0 p-1 bg-button text-white">
                  <div className="d-flex align-items-center">
                    <InsertDriveFileIcon /> &nbsp;&nbsp;{" "}
                    <p>
                      Total Request: &nbsp;
                      {
                        reduceStateForRequestSheetData?.counters
                          ?.total_request_sheet_count
                      }
                    </p>
                  </div>
                </Box>
              </Col>
              <Col>
                <Box className="cell p-1 rounded-0 bg-dang text-white">
                  <div className="d-flex align-items-center">
                    <ArrowCircleRightIcon /> &nbsp;&nbsp;{" "}
                    <p>
                      Open Request:{" "}
                      {
                        reduceStateForRequestSheetData?.counters
                          ?.open_request_sheet_count
                      }
                    </p>
                  </div>
                </Box>
              </Col>
              <Col>
                <Box className="cell p-1 rounded-0 bg-succ text-white">
                  <div className="d-flex align-items-center">
                    <CancelIcon /> &nbsp;&nbsp;{" "}
                    <p>
                      Closed Request:{" "}
                      {
                        reduceStateForRequestSheetData?.counters
                          ?.closed_request_sheet_count
                      }
                    </p>
                  </div>
                </Box>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row className="d-flex justify-content-end p-2">
              <Col lg={4} md={12} sm={12} className="d-flex justify-content-end">
                <button
                  onClick={handleGenerateBMNavigation}
                  className={
                    context?.tm_department === "PRD"
                      ? `btn bg-button d-inline`
                      : "d-none"
                  }
                  style={{ marginTop: "1rem" }}
                >
                  <AddCircleIcon /> &nbsp; Generate New Request-Sheet
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

                onRowDelete: (selectedRow) =>
                  new Promise((resolve, reject) => {
                    setTimeout(() => {
                      resolve();
                    }, 500);
                  }),

                onRowUpdate: (updatedRow, oldRow) =>
                  new Promise(async (resolve, reject) => {
                    await updateRequestSheet(updatedRow);
                    resolve();
                  }),
              }}
              options={{ ...MaterialTableOptions, showTitle: true }}
            />
          </Col>
        </Row>
      </Container>

      {machineHistoryCardModal && (
        <MachineHistoryCard
          selectedRow={selectedRow}
          modelProp={{
            show: machineHistoryCardModal,
            onHide: () => setMachineHistoryCardModal(false),
          }}
        />
      )}
    </>
  );
};

export default RequestSheetMainDashboard;
