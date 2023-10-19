import React, { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";

// import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

const RequestSheetMainDashboard = () => {
  const navigate = useNavigate();

  const initialState = {
    requestSheetData: [],
    counters: {
      open_request_sheet_count: 0,
      closed_request_sheet_count: 0,
      total_request_sheet_count: 0,
    },
    message: "",

    isAddRequestSheet: false,
    isUpdateRequestSheet: false,
    showDeleteConfirmationModal: false,
  };

  const ACTION = {
    GET: "get-request-sheets",
    ADD: "add-row",
    UPDATE: "update-row",
    DELETE: "delete-popup",
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
        `/getUserDetails?tm_department=PRD&&user_type=TL%2FHOSS`, // %2F is for "/"
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

      console.log(message, users);
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
      title: "Machine",
      field: "machine",
      editable: false,
    },
    {
      title: "Problem",
      field: "problem",
      editable: false,
    },
    {
      title: "Assign",
      field: "abcd",
      editable: (_, row) => {
        console.log(row);
        return false;
      },
    },
    {
      title: "Final Activity",
      field: "",
    },
    {
      title: "End Date-Time",
      field: "",
    },
    {
      title: "PRD Quality Check",
      field: "",
    },
    {
      title: "MTD Quality Check",
      field: "",
    },
    {
      title: "Status",
      field: "",
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
            Total Request: {reduceState?.counters?.open_request_sheet_count}
          </Col>
          <Col>
            Total Request: {reduceState?.counters?.closed_request_sheet_count}
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
              onRowAdd: (newRow) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    resolve();
                  }, 500);
                  //refreshPage();
                }),

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
