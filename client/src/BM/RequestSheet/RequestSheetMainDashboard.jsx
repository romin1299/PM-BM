import React, { useState, useEffect, useReducer, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { RadioGroup } from "@mui/material";
import TextField from "@material-ui/core/TextField";

import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";

import RoutingContext from "../../context/routing/RoutingContext";
// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";
import DescriptionIcon from "@mui/icons-material/Description";

const RequestSheetMainDashboard = () => {
  const navigate = useNavigate();

  const context = useContext(RoutingContext);

  const initialState = {
    requestSheetData: [],
    counters: {
      open_request_sheet_count: 0,
      closed_request_sheet_count: 0,
      total_request_sheet_count: 0,
    },
    message: "",

    userDropdown: [],

    isAddRequestSheet: false,
    isUpdateRequestSheet: false,
    showDeleteConfirmationModal: false,
  };

  const ACTION = {
    GET: "get-request-sheets",
    ADD: "add-row",
    UPDATE: "update-row",
    DELETE: "delete-popup",
    SETUP_USERS: "set-user-dropdown-value",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          requestSheetData: action?.requestSheetData,
          counters: action?.counters,
          message: action?.message,
        };

      case ACTION?.ADD:
        return {
          ...state,
          isAddRequestSheet: !state?.isAddRequestSheet,
        };

      case ACTION?.DELETE:
        return {
          ...state,
          showDeleteConfirmationModal: !state?.showDeleteConfirmationModal,
        };

      case ACTION?.UPDATE:
        return {
          ...state,
          isUpdateRequestSheet: !state?.isUpdateRequestSheet,
        };

      case ACTION?.SETUP_USERS:
        return {
          ...state,
          userDropdown: action?.users,
        };

      default:
        return state;
    }
    // if (action?.type === ACTION?.GET) {
    //   return {
    //     ...state,
    //     requestSheetData: action?.requestSheetData,
    //     message: action?.message,
    //   };
    // } else if (action?.type === ACTION?.ADD) {
    //   return {
    //     ...state,
    //     isAddLocation: !state?.isAddLocation,
    //   };
    // } else if (action?.type === ACTION?.DELETE) {
    //   return {
    //     ...state,
    //     showDeleteConfirmationModal: !state?.showDeleteConfirmationModal,
    //   };
    // } else if (action?.type === ACTION?.UPDATE) {
    //   return {
    //     ...state,
    //     isUpdateLocation: !state?.isUpdateLocation,
    //   };
    // } else {
    //   return state;
    // }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getAllRequestSheetData = async () => {
    try {
      const res = await fetch(`/getRequestSheetData`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { message, requestSheetData, counters } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          requestSheetData,
          counters,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getUserDetails = async () => {
    try {
      const res = await fetch(
        context?.tm_department === "MTD" && context?.user_type === "TL/HOSS"
          ? `/getUserDetails?user_type=Operator`
          : `/getUserDetails?tm_department=MTD&&user_type=TL%2FHOSS`, // %2F is for "/"
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, users } = await res.json();

      reducerDispatch({
        type: ACTION.SETUP_USERS,
        users,
      });
      console.log(message, users);
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

      const data = await res.json();

      if (res.status === 201) {
        console.log(data);
      } else {
        console.log("error", data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllRequestSheetData();
    getUserDetails();
  }, []);

  const handleGenerateBMNavigation = async () => {
    navigate(`/bm/generateRequestSheetMainDashboard`);
  };

  const conditionalBasedEditableFunctionForPRD = (_, row) => {
    if (
      context?.tm_department === "PRD" &&
      context?.user_type === "TL/HOSS" &&
      row?.Operator
    ) {
      return true;
    }
    return false;
  };

  const dropDownComponent = ({ value, onChange }) => (
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
      {reduceState?.userDropdown?.map((option) => {
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
    },
    {
      title: "Date-time",
      field: "problemOccurredDateAndTimeOfBM",
      editable: false,
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
      editable: false,
    },
    {
      title: "Assign",
      field: "Operator",
      editable:
        context?.tm_department === "MTD" && context?.user_type === "TL/HOSS"
          ? "always"
          : "never",
      editComponent: dropDownComponent,
    },
    {
      title: "Final Activity",
      field: "finalActivity",
      editable: conditionalBasedEditableFunctionForPRD,
    },
    {
      title: "End Date-Time",
      field: "problemOccurredDateAndTimeOfBM",
      editComponent: ({ value, onChange }) => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MobileDateTimePicker
            renderInput={(props) => (
              <input className="text-field mt-0" value={value} {...props} />
            )}
            value={value}
            onChange={(problemOccurredDateAndTimeOfBM) => {
              onChange(problemOccurredDateAndTimeOfBM.toString());
            }}
          />
        </LocalizationProvider>
      ),
      editable: conditionalBasedEditableFunctionForPRD,
    },
    {
      title: "PRD Quality Check",
      field: "PRDUser",
      editable: conditionalBasedEditableFunctionForPRD,
      editComponent: ({ value, onChange }) => (
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          style={{ marginTop: "0.2rem" }}
        >
          <div>
            <input
              type="radio"
              name="PRDUser"
              value="Yes"
              onChange={(e) => onChange(e.target.value)}
            />
            <span for="html" className="m-2">
              Yes
            </span>
            <input
              type="radio"
              name="PRDUser"
              value="No"
              onChange={(e) => onChange(e.target.value)}
            />
            <span for="html" className="m-2">
              No
            </span>
          </div>
        </RadioGroup>
      ),
    },
    {
      title: "MTD Quality Check",
      field: "MTDUser",
      editable: conditionalBasedEditableFunctionForPRD,
      editComponent: dropDownComponent,
    },
    {
      title: "Status",
      field: "statusPRD_TL",
      editable: conditionalBasedEditableFunctionForPRD,
      editComponent: ({ value, onChange }) => (
        <select
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="statusPRD_TL"
          fullWidth
          select
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {["NG", "Under Observation", "OK"].map((option) => {
            return <option value={option}>{option}</option>;
          })}
        </select>
      ),
    },
  ];

  const requestSheetActions = [
    {
      icon: () => <CreditCardIcon />,
      tooltip: "History Card",
      position: "row",
      onClick: (event, selectedRow) => {
        console.log("----------", selectedRow);
      },
    },
    (row) => ({
      icon: () => <DescriptionIcon />,
      tooltip: "Update Action",
      position: "row",
      disabled:
        row?.assignUserId === context?._id &&
        (row?.work_order_status === "Pending" ||
          row?.work_order_status === "Closed")
          ? false
          : true,
      onClick: (event, selectedRow) => {
        console.log("----------", selectedRow);
        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?.requestSheetNoOfBM}`
        );
      },
    }),
  ];

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <h1>RequestSheetMainDashboard</h1>
          </Col>
        </Row>
        {/* <Row>
          <NewRequestSheetRegistration />
        </Row> */}
        <Row className="d-flex align-items-center justify-content-center">
          <Col className="d-flex align-items-center justify-content-center">
            <button
              onClick={handleGenerateBMNavigation}
              className={
                context?.tm_department === "PRD"
                  ? `btn bg-button d-inline`
                  : "d-none"
              }
              style={{ marginTop: "1rem" }}
            >
              Generate BM
            </button>
          </Col>

          <Col>
            Total Request: {reduceState?.counters?.total_request_sheet_count}
          </Col>
          <Col>
            Open Request: {reduceState?.counters?.open_request_sheet_count}
          </Col>
          <Col>
            Closed Request: {reduceState?.counters?.closed_request_sheet_count}
          </Col>
        </Row>

        <Row>
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
            data={reduceState?.requestSheetData}
            // title="User Management"
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
                new Promise((resolve, reject) => {
                  const index = oldRow.tableData.id;
                  // const updatedRows = [...subSectionList.subSectionsInfo];
                  // updatedRows[index] = updatedRow;

                  updateRequestSheet(updatedRow);

                  setTimeout(() => {
                    resolve();
                  }, 500);
                }),
            }}
            options={{
              showTitle: false,
              paging: false,
              sorting: true,
              search: true,
              filtering: false,
              exportButton: true,
              exportAllData: true,
              draggable: false,
              actionsColumnIndex: -1,
              pageSize: 10,
              pageSizeOptions: false,
              paginationType: "stepped",
              addRowPosition: "first",
              headerStyle: {
                position: "sticky",
                top: "0",
                fontWeight: "bold",
              },
              maxBodyHeight: "70vh",
              rowStyle: {
                // fontStyle:'bold'

                boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                // color:"rgba(255,255,255,0.8)",
                borderRadius: "5px",
                border: "1px solid rgba(255,255,255)",
                WebkitBackdropFilter: "blur( 2px )",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(5px)",
              },
              headerStyle: {
                fontSize: "14px",
                fontWeight: "bold",
              },
            }}
          />
        </Row>
      </Container>
    </>
  );
};

export default RequestSheetMainDashboard;
