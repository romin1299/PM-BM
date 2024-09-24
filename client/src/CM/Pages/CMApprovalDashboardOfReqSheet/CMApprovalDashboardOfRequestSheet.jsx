import React, { useContext, useEffect, useReducer, useState } from "react";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
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
import Loading from "../../../components/Loading/Loading";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";
import tableIcons from "../../../components/MatrialTableIcon";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import RoutingContext from "../../../context/routing/RoutingContext";
import ExistingMachineReqSheetWithData from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";

const CMApprovalDashboardOfRequestSheet = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const loggedUserDetails = useContext(RoutingContext);
  const { register, handleSubmit, watch, errors } = useForm({});
  const [loading, setLoading] = useState(true);
  const [cmSelectedSheetForView, setCmSelectedSheetForView] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [cmReqSheetView, setCmReqSheetView] = useState(false);

  const navigate = useNavigate();
  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",

      onClick: (event, selectedRow) => {
        console.log(selectedRow);
        setCmSelectedSheetForView(selectedRow);
        setCmReqSheetView(true);
        setIsEditable(true);
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
    // setLoading(true);

    try {
      const res = await fetch(
        `/getMachineRequestSheetDetailsForApprovalForCM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&getDataForApprovalDashboardId=${loggedUserDetails?._id}`,
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
      console.log(data);
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        setApprovalRequestSheetDataOfCM(data?.requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }

    // setLoading(false);
  };
  useEffect(() => {
    getApprovalRequestSheetData();
  }, []);
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
              // isLoading={Loading}
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
      <Modal
        show={cmReqSheetView}
        fullscreen
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            CM Request-Sheet
          </Modal.Title>
          <Button
            variant="secondary"
            onClick={() => setCmReqSheetView(false)}
            sx={{
              backgroundColor: "#B02A37",
              color: "#F2F2F2",
              "&:hover": {
                backgroundColor: "#B02A37",
                cursor: "pointer",
              },
            }}
          >
            Close
          </Button>
        </Modal.Header>
        <Modal.Body>
          <div>
            <ExistingMachineReqSheetWithData
              cmSelectedSheetForView={cmSelectedSheetForView}
              isEditable={isEditable}
              setCmReqSheetView={setCmReqSheetView}
            />
            
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CMApprovalDashboardOfRequestSheet;
