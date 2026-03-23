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
import MonthlyGeneratedAndCompletedCount from "../../../BM/RequestSheetMonitoring/MonthlyGeneratedAndCompletedCount";
import NewMachineRequestForViewAndUpdate from "../NewMachineCMRequestReport/NewMachineRequestForViewAndUpdate";

const ApprovalDashboardOfNewMachineCM = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const [loading, setLoading] = useState(true);

  const defaultState = {
    newMachineCmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
    isOtherFieldsEditableOrNot: "No",
  };

  const [
    selectedNewMachineCMRequestSheetPopupData,
    setSelectedNewMachineCMRequestSheetPopupData,
  ] = useState(defaultState);

  const handlePopupStatus = () =>
    setSelectedNewMachineCMRequestSheetPopupData(defaultState);

  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",

      onClick: (event, selectedRow) => {
        // setCmReqSheetView(true);
        // setIsEditable(true);

        setSelectedNewMachineCMRequestSheetPopupData({
          ...selectedNewMachineCMRequestSheetPopupData,
          isEditable: true,
          newMachineCmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
          machine_code: selectedRow?.machineNo,
        });
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
  const [approvalRequestSheetDataOfNewMachineCM, setApprovalRequestSheetDataOfNewMachineCM] =
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
      field: "requestSheetNoOfNewMachineCM",
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
      title: "Scope of CM",
      field: "newMachineRequestFilledByPED.scopeOfCM",
      editable: false,
    },
    {
      title: "Date-time",
      field: "newMachineRequestFilledByPED.requestOn",
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
      field: "statusOfNewRequestOfCM",
      editable: false,
    },
  ];
  const getApprovalRequestSheetData = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `/newMachineGetMachineRequestSheetDetailsForApprovalForCM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}`
      );
      // console.log(response);
      if (response?.status === 201) {
        setApprovalRequestSheetDataOfNewMachineCM(response?.data?.requestSheetData);
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        setApprovalRequestSheetDataOfNewMachineCM([]);
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
    selectedNewMachineCMRequestSheetPopupData,
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
              // monthFiltration
              yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              resetButtonFiltration
              // quarterFiltration
              isWithLocalStorageForFiltration="Yes"
            />
          }
        />
        <Row className="mt-3 gap-2 g-0">
          {/* <MonthlyGeneratedAndCompletedCount
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            allMonths={allMonths}
          /> */}
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
              data={approvalRequestSheetDataOfNewMachineCM}
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

      {selectedNewMachineCMRequestSheetPopupData?.newMachineCmReqSheetView && (
        <NewMachineRequestForViewAndUpdate
          handlePopupStatus={handlePopupStatus}
          selectedYear={reduceState?.selectedYear}
          {...selectedNewMachineCMRequestSheetPopupData}
        />
      )}
    </>
  );
};

export default ApprovalDashboardOfNewMachineCM;
