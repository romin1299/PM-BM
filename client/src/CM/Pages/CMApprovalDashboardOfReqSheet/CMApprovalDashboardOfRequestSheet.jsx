import React, { useEffect, useReducer, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import DescriptionIcon from "@mui/icons-material/Description";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import BMTitlebar from "../../../BM/Component/BMTitlebar";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../../BM/Utils/TableUtils/MaterialTableProps";
import MaterialTable from "@material-table/core";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";
import tableIcons from "../../../components/MatrialTableIcon";

import axios from "axios";
import ExistingMachineReqSheetView from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";

const CMApprovalDashboardOfRequestSheet = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const [loading, setLoading] = useState(true);

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
  };

  const [selectedCMRequestSheetPopupData, setSelectedCMRequestSheetPopupData] =
    useState(defaultState);

  const handlePopupStatus = () =>
    setSelectedCMRequestSheetPopupData(defaultState);

  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",

      onClick: (event, selectedRow) => {
        // setCmReqSheetView(true);
        // setIsEditable(true);

        setSelectedCMRequestSheetPopupData({
          isEditable: true,
          cmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
        });
      },
    }),
  ];
  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
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
      field: "requestSheetNoOfCM",
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
      title: "Activity",
      field: "cmBasicDataFilledByMTD_TL.activityOfCM",
      editable: false,
    },
    {
      title: "Date-time",
      field: "plannedDateAndTimeOfCMForTable",
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
      title: "R.S Status",
      field: "requestSheetStatusOfCM",
      editable: false,
    },
  ];
  const getApprovalRequestSheetData = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `/getMachineRequestSheetDetailsForApprovalForCM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`
      );
      console.log(response);
      if (response?.status === 201) {
        setApprovalRequestSheetDataOfCM(response?.data?.requestSheetData);
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        setApprovalRequestSheetDataOfCM([]);
      }
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
              data={approvalRequestSheetDataOfCM}
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
                pageSize: 5,
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

      {selectedCMRequestSheetPopupData?.cmReqSheetView && (
        <ExistingMachineReqSheetView
          handlePopupStatus={handlePopupStatus}
          selectedYear={reduceState?.selectedYear}
          {...selectedCMRequestSheetPopupData}
        />
      )}
    </>
  );
};

export default CMApprovalDashboardOfRequestSheet;
