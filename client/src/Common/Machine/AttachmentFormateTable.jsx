import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import MaterialTable from "@material-table/core";
import tableIcons from "../../components/MatrialTableIcon";

import AddNewAttachmentModal from "./AddNewAttachmentModal";
import CustomHooksForBackNavigation, {
  MuiNavigateBack,
} from "../ButtonComponents/CustomHooksForBackNavigation";
import { Container } from "react-bootstrap";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";

const pageInfo = {
  // "bm-history": {
  //   name: "BM History",
  // },

  // "pm-history": {
  //   name: "PM History",
  // },

  "product-drawing": {
    name: "Product Drawing",
    schemaVar: "product_drawings",
  },

  "jigs-mcs": {
    name: "Jigs MCS",
    schemaVar: "jigs_mcs",
  },

  "machine-manuals": {
    name: "Machine Manuals",
    schemaVar: "machine_manuals",
  },

  "jigs-dws": {
    name: "Jigs Dws(Mech/Elec)",
    schemaVar: "jigs_dws",
  },

  "mech-dws": {
    name: "Mech. Drawings",
    schemaVar: "mechanical_drawings",
  },

  "ele-dws": {
    name: "Electric Drawings",
    schemaVar: "electrical_drawings",
  },

  "machine-poka-yoke": {
    name: "Machine Poka-Yoke",
    schemaVar: "machine_poka_yoke",
  },

  spare: {
    name: "Consumable & Spare",
    schemaVar: "spare",
  },

  oms: {
    name: "OMS",
    schemaVar: "oms",
  },

  "other-documents": {
    name: "Other Documents",
    schemaVar: "other_documents",
  },
};

const AttachmentFormateTable = () => {
  let { page, machine_code } = useParams();

  const pageDetails = pageInfo?.[page];

  const [attachmentDetails, setAttachmentDetails] = useState([]);

  const [handleShowAddNewAttachmentModal, setHandleShowAddNewAttachmentModal] =
    useState(false);

  const handleEventsForAttachmentModal = () => {
    setHandleShowAddNewAttachmentModal(
      (handleShowAddNewAttachmentModal) => !handleShowAddNewAttachmentModal
    );
  };

  const getAttachmentDetails = async () => {
    try {
      const res = await fetch(
        `/getAttachmentDetails/${pageDetails?.schemaVar}/?machine_code=${machine_code}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { attachmentDetails } = await res.json();
      if (res.status === 201) {
        setAttachmentDetails(attachmentDetails);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAttachmentDetails();
  }, [machine_code]);

  const handleDeleteAttachment = async (row) => {
    try {
      const res = await fetch(
        `/deleteAttachment/${pageDetails?.schemaVar}/${row?._id}/?machine_code=${machine_code}`,
        {
          method: "DELETE",
        }
      );

      const { message, attachmentDetails } = await res.json();

      if (res.status === 201) {
        setAttachmentDetails(attachmentDetails);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const columns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
    },
    {
      title: "Attachment",
      field: "attached_file",
    },
  ];

  const actions = [
    {
      icon: () => <button className="btn bg-button">Upload document</button>,
      tooltip: "Upload document",
      isFreeAction: true,
      onClick: handleEventsForAttachmentModal,
    },
  ];

  return (
    <Container fluid>
      <ReportTitleBar title={machine_code} PreTools={<MuiNavigateBack />} />

      {/* <CustomHooksForBackNavigation /> */}

      <div className="mt-3">
        <MaterialTable
          localization={{
            header: {
              actions: "Actions",
            },
          }}
          actions={actions}
          icons={tableIcons}
          columns={columns}
          data={attachmentDetails}
          editable={{
            onRowDelete: (selectedRow) =>
              new Promise((resolve, reject) => {
                handleDeleteAttachment(selectedRow);
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
            // pageSizeOptions: false,  //commented because showing warning in console: invalid prop
            paginationType: "stepped",
            addRowPosition: "first",
            headerStyle: {
              position: "sticky",
              top: "0",
              fontWeight: "bold",
              fontSize: "14px",
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
        />
      </div>

      <AddNewAttachmentModal
        handleShowAddNewAttachmentModal={handleShowAddNewAttachmentModal}
        closeModal={handleEventsForAttachmentModal}
        machine_code={machine_code}
        pageDetails={pageDetails}
        setAttachmentDetails={setAttachmentDetails}
      />
    </Container>
  );
};

export default AttachmentFormateTable;
