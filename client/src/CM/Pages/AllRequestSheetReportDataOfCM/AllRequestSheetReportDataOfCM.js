import React, { useContext, useEffect, useReducer, useState } from "react";
import {
  AppBar,
  Box,
  Dialog,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Slide,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  SvgIcon,
} from "@mui/material";
import { FaEye } from "react-icons/fa";
import { ReactComponent as EditSheetIcon } from "../../../static/svg/edit-sheet-2.svg";

import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";
import { Container, Modal } from "react-bootstrap";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import tableIcons from "../../../components/MatrialTableIcon";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../../BM/Utils/TableUtils/MaterialTableProps";
import MaterialTable from "@material-table/core";
import ExistingMachineReqSheetWithData from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";
import RoutingContext from "../../../context/routing/RoutingContext";
import MTDExistingMachineReqSheetWithData from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/MTDExistingMachineReqSheetWithData";
import HOSExistingMachineReqSheet from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/HOSExistingMachineReqSheet";

const AllRequestSheetReportDataOfCM = () => {
  const navigate = useNavigate();

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const [loading, setLoading] = useState(false);
  const [CmReqSheetView, setCmReqSheetView] = useState(false);

  const getAllCMSheetData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/getAllCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedMaintenanceType=${reduceState?.selectedMaintenanceType}`
      );
      setApprovalRequestSheetDataOfCM(response.data.reqSheetCM);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (reduceState?.selectedValue) getAllCMSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedMaintenanceType,
    CmReqSheetView,
  ]);
  const cmApprovalHeaders = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: false,
      width: "5%",
    },
    {
      title: "Line Name",
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
      title: "Req No.",
      field: "requestSheetNoOfCM",
      editable: false,
    },
    {
      title: "Category",
      field: "cmBasicDataFilledByMTD_TL.categories",
      editable: false,
    },
    {
      title: "Acivity",
      field: "cmBasicDataFilledByMTD_TL.activityOfCM",
      editable: false,
    },
    {
      title: "status",
      field: "requestSheetStatusOfCM",
      editable: false,
    },
    {
      title: "Planned Date",
      field: "plannedDateAndTimeOfCM",
      type: "date",
      editable: false,
    },
    {
      title: "Assigned To",
      render: (rowData) => {
        return rowData?.assigned_users?.length > 0
          ? rowData?.assigned_users?.map((user) => user?.tm_name).join(", ")
          : "Not Assigned";
      },
    },
  ];
  const context = useContext(RoutingContext);
  // console.log(context);

  const [greaterValue, setGreaterValue] = useState(
    localStorage.getItem("greaterValue")
  );
  const [lesserValue, setLesserValue] = useState(
    localStorage.getItem("lesserValue")
  );
  const [isEditable, setIsEditable] = useState(false);
  const [cmSelectedSheetForView, setCmSelectedSheetForView] = useState();
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
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
      icon: () => (
        <SvgIcon
          component={EditSheetIcon}
          sx={{
            color:
              (context?.user_type === "Operator" &&
                (row?.requestSheetStatusOfCM === "Generated" ||
                  row?.requestSheetStatusOfCM === "Fill Sheet" ||
                  row?.requestSheetStatusOfCM === "Rejected")) ||
              (row?.assigned_users?.length === 0 &&
                context?.user_type === "TL/HOSS")
                ? "#FF6F00"
                : "",
          }}
        />
      ),
      tooltip: "Update Req-sheet",
      position: "row",
      // disabled: row?.requestSheetStatusOfCM === "Generated" ? false : true,
      disabled:
        (context?.user_type === "Operator" &&
          (row?.requestSheetStatusOfCM === "Generated" ||
            row?.requestSheetStatusOfCM === "Fill Sheet" ||
            row?.requestSheetStatusOfCM === "Rejected")) ||
        (row?.assigned_users?.length === 0 && context?.user_type === "TL/HOSS")
          ? false
          : true,
      // disabled:
      //   row?.assignUserId === context?._id &&
      //   (row?.work_order_status === "Pending" ||
      //     row?.work_order_status === "Closed")
      //     ? false
      //     : true,
      onClick: (event, selectedRow) => {
        // console.log(event, selectedRow);
        setCmReqSheetView(true);
        setIsEditable(true);
        setCmSelectedSheetForView(selectedRow);
      },
    }),
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        // console.log(event, selectedRow);
        setCmReqSheetView(true);
        setIsEditable(false);
        setCmSelectedSheetForView(selectedRow);
      },
    }),
  ];

  // ============== This might change in CM =================
  const RSStatusArray = [
    "Generated",
    "Assigned",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Fill Sheet",
    "Rejected",
    "Under MTD TL approval",
    "Under MTD HOSS approval",
    "Under PRD TL Approval",
    "Under PRD HOS Approval",
    "Under MTD HOS Approval",
    "Under MTD HOD Approval",
    "Under PRD HOD Approval",
    "Completed",
  ];
  const maintenanceTypeArrayForFilter = ["PM", "BM", "CM", "TPM"];
  // ==============================================================

  const filtration = [
    <div className="d-flex justify-content-between">
      <Box sx={{ mx: "10px", my: "10px" }}>
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
          machineFiltration
          RSStatusArray={RSStatusArray}
          RSStatusFiltration
          maintenanceTypeArrayForFilter={maintenanceTypeArrayForFilter}
          maintenanceTypeFiltration
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
      {/* <Box display="flex" alignItems="center">
        <Tooltip title="Show/Hide Column">
          <Switch
            size="medium"
            checked={displayColumnOrNot}
            onClick={() =>
              setDisplayColumnOrNot((displayColumnOrNot) => !displayColumnOrNot)
            }
          />
        </Tooltip>
      </Box> */}
      <Box
        component="form"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}

        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          placeholder="From"
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&gt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setLesserValue(e.target.value);
            localStorage.setItem("lesserValue", e.target.value);
          }}
          value={lesserValue}
        />
        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          placeholder="To"
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&lt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setGreaterValue(e.target.value);
            localStorage.setItem("greaterValue", e.target.value);
          }}
          value={greaterValue}
        />
        <Button
          // size="small"
          disableElevation
          className="bg-button text-center"
          variant="contained"
          style={{
            minWidth: "25px",
            height: "33px",
            paddingInline: "10px",
          }}
          // onClick={getAllRequestSheetData} //This will be used when we will use the api
        >
          Go
        </Button>
      </Box>
    </div>,
    // "sd;kfgksn"
  ];
  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
  });
  return (
    <>
      <Container fluid>
        <Grid
          container
          className="cell py-2 px-3 mt-3 gap-2 g-0 align-items-center"
        >
          <Grid item xs={12} display={"flex"} justifyContent={"space-between"}>
            <Typography
              noWrap
              variant="h4"
              component="h4"
              fontSize={25}
              fontWeight={600}
              sx={{ mr: 3 }}
            >
              CM Reports
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12} className="mt-1 cell p-0 border-0">
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
              title={filtration}
              isLoading={loading}
              actions={requestSheetApprovalAction}
              icons={tableIcons}
              columns={cmApprovalHeaders}
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
                showTitle: true,
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
          </Grid>
        </Grid>
      </Container>
      {CmReqSheetView && (
        // <Dialog
        //   fullScreen
        //   open={CmReqSheetView}
        //   TransitionComponent={Transition}
        // >
        //   <AppBar sx={{ position: "relative" }}>
        //     <Toolbar>
        //       <IconButton
        //         edge="start"
        //         color="inherit"
        //         onClick={() => setCmReqSheetView(false)}
        //         aria-label="close"
        //       >
        //         <CloseIcon />
        //       </IconButton>
        //       {/* <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
        //         Sound
        //       </Typography>
        //       <Button autoFocus color="inherit" onClick={handleClose}>
        //         save
        //       </Button> */}
        //     </Toolbar>
        //   </AppBar>
        // </Dialog>
        <>
          <Modal
            show={CmReqSheetView}
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
              {(cmSelectedSheetForView?.requestSheetStatusOfCM ===
                "Generated" ||
                cmSelectedSheetForView?.requestSheetStatusOfCM ===
                  "Fill Sheet" ||
                cmSelectedSheetForView?.requestSheetStatusOfCM === "Rejected" ||
                cmSelectedSheetForView?.requestSheetStatusOfCM ===
                  "Completed") && (
                <div>
                  <ExistingMachineReqSheetWithData
                    cmSelectedSheetForView={cmSelectedSheetForView}
                    isEditable={isEditable}
                    setCmReqSheetView={setCmReqSheetView}
                  />
                </div>
              )}
              {cmSelectedSheetForView?.requestSheetStatusOfCM ===
                "Under MTD TL/HOSS Approval" && (
                <div>
                  <MTDExistingMachineReqSheetWithData
                    cmSelectedSheetForView={cmSelectedSheetForView}
                    isEditable={isEditable}
                    setCmReqSheetView={setCmReqSheetView}
                  />
                </div>
              )}
              {(cmSelectedSheetForView?.requestSheetStatusOfCM ===
                "Under MTD HOS Approval" ||
                cmSelectedSheetForView?.requestSheetStatusOfCM ===
                  "Under PRD TL Approval") && (
                <div>
                  <HOSExistingMachineReqSheet
                    cmSelectedSheetForView={cmSelectedSheetForView}
                    isEditable={isEditable}
                    setCmReqSheetView={setCmReqSheetView}
                  />
                </div>
              )}
            </Modal.Body>
          </Modal>
        </>
      )}
    </>
  );
};

export default AllRequestSheetReportDataOfCM;
