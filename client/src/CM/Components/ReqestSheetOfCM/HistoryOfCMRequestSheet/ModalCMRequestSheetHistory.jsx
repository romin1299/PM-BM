import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import MaterialTable from "@material-table/core";
import tableIcons from "../../../../components/MatrialTableIcon";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../../../BM/Utils/TableUtils/MaterialTableProps";

const ModalCMRequestSheetHistory = ({ modelProp, machineId, selectedYear }) => {
  const [tableData, setTableData] = useState([]);

  const getHistoryData = async () => {
    try {
      const res = await axios.get(
        `/getCMRequestSheetHistoryData/?machineId=${machineId}&&selectedYear=${selectedYear}`,
        //&&selectedQuarter=${reduceState?.selectedQuarter}
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      setTableData(res.data?.requestSheetData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getHistoryData();
  }, [machineId, selectedYear]);

  let columns = [
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
      field: "current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
      editable: false,
    },
    {
      title: "Planned Date",
      field: "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM",
      type: "date",
      editable: false,
    },
    {
      title: "Target Date",
      field: "current_commonDataFilledByAssignUser.targetDateOfCM",
      type: "date",
      editable: false,
    },
  ];

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">CM History</Modal.Title>
      </Modal.Header>
      <Modal.Body className="container">
        <MaterialTable
          localization={{
            header: {
              actions: "Actions",
            },
          }}
          //   isLoading={loading}
          icons={tableIcons}
          columns={columns}
          data={tableData}
          title={null}
          options={{
            ...MaterialTableOptions,
            showTitle: true,
            pageSize: 5,
            maxBodyHeight: "auto",
          }}
          style={MaterialTableStyle}
          sx={MaterialTableSX}
        />
      </Modal.Body>
      <Modal.Footer className="gap-2"></Modal.Footer>
    </Modal>
  );
};

export default ModalCMRequestSheetHistory;
