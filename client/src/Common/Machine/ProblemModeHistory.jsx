import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../BM/Utils/TableUtils/MaterialTableProps";

const ProblemModeHistory = ({
  machineId,
  machineCode,
  problemMode,
  modelProp,
  loading = false,
  filters = null,
}) => {
  const [problemModeData, setProblemModeData] = useState([]);

  const getAllDataBasedOnParticularProblemMode = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetHistoryBasedOnMachine/?machineId=${machineId}&&problemMode=${problemMode}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { requestSheetData } = await res.json();
      if (res.status === 201) {
        setProblemModeData(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  let addFieldsForProblemModeHistory = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
    },
    {
      title: "Product",
      field: "cell",
    },
    {
      title: "Line",
      field: "line",
    },
    {
      title: "Machine No",
      field: "machineNo",
    },
    {
      title: "Machine Name",
      field: "machineName",
    },
    {
      title: "Request No",
      field: "requestSheetNoOfBM",
    },
    {
      title: "Final Action",
      field: "finalActivity",
    },
    {
      title: "Action and Counter Measure",
      field: "actionAndCounterMeasureStep",
      render: (rowData) =>
        rowData?.actionAndCounterMeasureStep?.map((value) => (
          <p>{value?.action}</p>
        )),
    },
    {
      title: "Date-Time",
      field: "problemOccurredDateAndTimeOfBM",
    },
    {
      title: "Loss Time",
      field: "loss_time",
    },
    {
      title: "Work Order Status",
      field: "work_order_status",
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
    },
  ];

  useEffect(() => {
    getAllDataBasedOnParticularProblemMode();
  }, [machineId]);

  return (
    <>
      <Modal
        {...modelProp}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Problem Mode: <b>{problemMode}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="container">
          <MaterialTable
            localization={{
              header: {
                actions: "Actions",
              },
            }}
            isLoading={loading}
            // actions={requestSheetActions}
            icons={tableIcons}
            columns={addFieldsForProblemModeHistory}
            data={problemModeData}
            title={filters}
            options={{
              ...MaterialTableOptions,
              showTitle: true,
              pageSize: 5,
              maxBodyHeight: "auto",
              // exportMenu: [
              //   {
              //     label: "Export PDF",
              //     exportFunc: (cols, data) =>
              //       ExportPdf(
              //         cols,
              //         data,
              //         `${downloadFileName} ${moment().format("DD-MM-YYYY")}`
              //       ),
              //   },
              //   {
              //     label: "Export CSV",
              //     exportFunc: (cols, data) =>
              //       ExportCsv(
              //         cols,
              //         data,
              //         `${downloadFileName} ${moment().format("DD-MM-YYYY")}`
              //       ),
              //   },
              // ],
            }}
            style={MaterialTableStyle}
            sx={MaterialTableSX}
          />
        </Modal.Body>
        <Modal.Footer className="gap-2"></Modal.Footer>
      </Modal>
    </>
  );
};

export default ProblemModeHistory;
