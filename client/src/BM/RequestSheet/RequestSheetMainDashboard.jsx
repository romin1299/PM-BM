import React, { useState, useEffect, useReducer, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { RadioGroup } from "@mui/material";
import TextField from "@material-ui/core/TextField";
import { Multiselect } from "multiselect-react-dropdown";

import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DescriptionIcon from "@mui/icons-material/Description";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";

import RoutingContext from "../../context/routing/RoutingContext";

// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

const RequestSheetMainDashboard = () => {
  const navigate = useNavigate();

  const context = useContext(RoutingContext);

  const statusArray = [
    "Generated",
    "Assigned",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Fill sheet",
    "Under MTD TL approval",
    "Under MTD HOSS approval",
    "Under MTD HOS approval",
  ];

  const initialState = {
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

  const reducer = (state, action) => {
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

      const {
        message,
        requestSheetData,
        counters,
        TLHOSS_and_TM_user_list,
        // MTD_or_PRD_user_list,
      } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
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
        reducerDispatch({
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
    getAllRequestSheetData();
  }, []);

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
          dropDownArray: reduceState?.TLHOSS_and_TM_user_list,
        }),
    },
    {
      title: "Final Action",
      field: "finalActivity",
      editable: conditionalBasedEditableFunctionForMTD,
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
      title: "H/O Time", //hand-over time
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
              onChange(handOverTime.toString());
            }}
          />
        </LocalizationProvider>
      ),
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
      title: "Work Order Status",
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
        row?.work_order_status === "Pending" ||
        row?.work_order_status === "Closed"
          ? false
          : true,
      onClick: (event, selectedRow) => {
        console.log("----------", selectedRow);
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
              className="btn bg-button"
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
                new Promise(async (resolve, reject) => {
                  await updateRequestSheet(updatedRow);
                  resolve();
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
