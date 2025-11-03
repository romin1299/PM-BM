import React, { useContext, useEffect, useState, useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";
import tableIcons from "../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import MaterialTable from "@material-table/core";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import RoutingContext from "../../context/routing/RoutingContext";
import { useNavigate } from "react-router-dom";
import BMTitlebar from "../Component/BMTitlebar";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../Utils/TableUtils/MaterialTableProps";

import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";

import MonthlyGeneratedAndCompletedCount from "../RequestSheetMonitoring/MonthlyGeneratedAndCompletedCount";

import {
  reducer,
  initialState,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";

const ApprovalDashboardOfRequestSheet = () => {
  const [loading, setLoading] = React.useState(true);

  const loggedUserDetails = useContext(RoutingContext);
  const navigate = useNavigate();

  const [approvalRequestSheetDataOfBM, setApprovalRequestSheetDataOfBM] =
    useState([]);

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
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
    // {
    //   icon: () => <CreditCardIcon className="text-primary1" />,
    //   tooltip: "History Card",
    //   position: "row",
    //   onClick: (event, selectedRow) => {
    //     console.log("----------", selectedRow);
    //   },
    // },
    (row) => ({
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",
      hidden: loggedUserDetails?.tm_no === "9999",
      // disabled:
      //   row?.assignUserId === context?._id &&
      //   (row?.work_order_status === "Pending" ||
      //     row?.work_order_status === "Closed")
      //     ? false
      //     : true,
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/update/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${reduceState?.selectedYear}?flagForTogglingFilter=${reduceState?.flagForTogglingFilter}&selectedValue=${reduceState?.selectedValue}`
        );
      },
    }),
  ];

  const allMonths = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  const getApprovalRequestSheetData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getMachineRequestSheetDetailsForApproval/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&getDataForApprovalDashboardId=${loggedUserDetails?._id}`,
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
        setApprovalRequestSheetDataOfBM(data?.requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (reduceState?.selectedValue) getApprovalRequestSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
  ]);

  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="Approval Dashboard"
          Toolbar={
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
              isWithLocalStorageForFiltration="Yes"
            />
          }
        />
        <Row className="mt-3 gap-2 g-0">
          <MonthlyGeneratedAndCompletedCount
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            allMonths={allMonths}
          />
        </Row>
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
              actions={requestSheetApprovalAction}
              icons={tableIcons}
              columns={approvalDashboardHeader}
              data={approvalRequestSheetDataOfBM}
              // title="User Management"
              // tableRef={this.tableRef.current.onQueryChange()}

              editable={
                {
                  // onRowUpdate: (updatedRow, oldRow) =>
                  // new Promise(async (resolve, reject) => {
                  //   //   await updateRequestSheet(updatedRow);
                  //   resolve();
                  // }),
                }
              }
              options={{
                ...MaterialTableOptions,
                pageSize: 50,
                exportMenu: [
                  {
                    label: "Export PDF",
                    exportFunc: (cols, data) =>
                      ExportPdf(
                        cols,
                        data,
                        `Approval List of Request-Sheet ${moment().format(
                          "DD-MM-YYYY"
                        )}`
                      ),
                  },
                  {
                    label: "Export CSV",
                    exportFunc: (cols, data) =>
                      ExportCsv(
                        cols,
                        data,
                        `Approval List of Request-Sheet ${moment().format(
                          "DD-MM-YYYY"
                        )}`
                      ),
                  },
                ],
              }}
              style={MaterialTableStyle}
              sx={MaterialTableSX}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ApprovalDashboardOfRequestSheet;
