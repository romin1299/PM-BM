import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import tableIcons from "../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import MaterialTable from "@material-table/core";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import RoutingContext from "../../context/routing/RoutingContext";
import { useNavigate } from "react-router-dom";

const ApprovalDashboardOfRequestSheet = () => {
  const loggedUserDetails = useContext(RoutingContext);
  const navigate = useNavigate();

  const [approvalRequestSheetDataOfBM, setApprovalRequestSheetDataOfBM] =
    useState([]);

  const approvalDashboardHeader = [
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
      field: "problemOccurredDateAndTimeOfBMForTable",
      editable: false,
    },

    // {
    //   title: "Assign",
    //   field: "assignUser",
    // },
    // {
    //   title: "Handover To",
    //   field: "handOverUser",
    // },
    {
      title: "Final Action",
      field: "finalActivity",
    },
    {
      title: "Loss Time",
      field: "lossTime",
    },
    {
      title: "WO Status",
      field: "work_order_status",
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
      editable: false,
    },
  ];

  const requestSheetApprovalAction = [
    {
      icon: () => <CreditCardIcon className="text-primary1"/>,
      tooltip: "History Card",
      position: "row",
      onClick: (event, selectedRow) => {
        console.log("----------", selectedRow);
      },
    },
    (row) => ({
      icon: () => <DescriptionIcon className="text-primary"/>,
      tooltip: "Update Action",
      position: "row",
      // disabled:
      //   row?.assignUserId === context?._id &&
      //   (row?.work_order_status === "Pending" ||
      //     row?.work_order_status === "Closed")
      //     ? false
      //     : true,
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?.requestSheetNoOfBM}`
        );
      },
    }),
  ];

  const getApprovalRequestSheetData = async () => {
    try {
      const res = await fetch(
        `/getMachineRequestSheetDetails/?getDataForApprovalDashboardId=${loggedUserDetails?._id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        console.log(data?.requestSheetData);
        setApprovalRequestSheetDataOfBM(data?.requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getApprovalRequestSheetData();
  }, []);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <h1>Approval Dashboard</h1>
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
            actions={requestSheetApprovalAction}
            icons={tableIcons}
            columns={approvalDashboardHeader}
            data={approvalRequestSheetDataOfBM}
            // title="User Management"
            // tableRef={this.tableRef.current.onQueryChange()}

            editable={{
              // onRowUpdate: (updatedRow, oldRow) =>
              // new Promise(async (resolve, reject) => {
              //   //   await updateRequestSheet(updatedRow);
              //   resolve();
              // }),
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

export default ApprovalDashboardOfRequestSheet;
