import React, { useEffect, useReducer, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import tableIcons from "../../../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import MaterialTable from "@material-table/core";
import RequestSheetOfLTPM from "./RequestSheetOfLTPM";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../../../BM/Utils/TableUtils/MaterialTableProps";
import BMTitlebar from "../../../../BM/Component/BMTitlebar";
import ChartsToolbar from "../../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import axios from "axios";
import { FaEye } from "react-icons/fa";

const DashboardOfLTPM = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [loading, setLoading] = useState(true);
  const [openCloseLTPM, setOpenCloseLTPM] = useState(false);
  const [selectedRow, setSelectedRow] = useState([]);

  const [displayLineWiseDataOfLTPM, setDisplayLineWiseDataOfLTPM] = useState(
    []
  );

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const approvalDashboardHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: false,
      width: "5%",
    },
    {
      title: "Product",
      field: "cellName",
      editable: false,
    },
    {
      title: "Line",
      field: "lineName",
      editable: false,
    },
  ];

  const openCloseModalOfLTPM = () => {
    setOpenCloseLTPM(!openCloseLTPM);
  };

  const actionOfLTPM = [
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        setOpenCloseLTPM(true);
        openCloseModalOfLTPM();
      },
    }),
  ];

  const getAllLTPMLineWiseSheetData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/LTPM/getLineWiseLTPM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedMaintenanceType=${reduceState?.selectedMaintenanceType}`
      );
      // console.log(response);
      setDisplayLineWiseDataOfLTPM(response?.data?.listOfLine);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    reduceState?.selectedValue && getAllLTPMLineWiseSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedMaintenanceType,
  ]);
  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="LTPM Dashboard"
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
              actions={actionOfLTPM}
              icons={tableIcons}
              columns={approvalDashboardHeader}
              data={displayLineWiseDataOfLTPM}
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
                // exportMenu: [
                //   {
                //     label: "Export PDF",
                //     exportFunc: (cols, data) =>
                //       ExportPdf(
                //         cols,
                //         data,
                //         `Approval List of Request-Sheet ${moment().format(
                //           "DD-MM-YYYY"
                //         )}`
                //       ),
                //   },
                //   {
                //     label: "Export CSV",
                //     exportFunc: (cols, data) =>
                //       ExportCsv(
                //         cols,
                //         data,
                //         `Approval List of Request-Sheet ${moment().format(
                //           "DD-MM-YYYY"
                //         )}`
                //       ),
                //   },
                // ],
              }}
              style={MaterialTableStyle}
              sx={MaterialTableSX}
            />
          </Col>
        </Row>
      </Container>

      {openCloseLTPM && (
        <RequestSheetOfLTPM
          openCloseModalOfLTPM={openCloseModalOfLTPM}
          openCloseLTPM={openCloseLTPM}
          selectedRow={selectedRow}
        />
      )}
    </>
  );
};

export default DashboardOfLTPM;
