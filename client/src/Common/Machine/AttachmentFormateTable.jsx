import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import FileDownload from "js-file-download";

import MaterialTable from "@material-table/core";
import DownloadIcon from "@mui/icons-material/Download";
import tableIcons from "../../components/MatrialTableIcon";

import AddNewAttachmentModal from "./AddNewAttachmentModal";
import CustomHooksForBackNavigation, {
  MuiNavigateBack,
} from "../ButtonComponents/CustomHooksForBackNavigation";
import { Col, Container, Row } from "react-bootstrap";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box, Typography } from "@mui/material";
import { Link, Paper } from "@material-ui/core";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../BM/Utils/TableUtils/MaterialTableProps";
import { MachineNameTypography } from "./MachineDocument";

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
  const [attachmentDetails, setAttachmentDetails] = useState([]);
  let { page, machine_code } = useParams();

  const { state } = useLocation();
  const machineName = state?.selectedMachineDetails?.machine_name;

  const pageDetails = pageInfo?.[page];

  const [handleShowAddNewAttachmentModal, setHandleShowAddNewAttachmentModal] =
    useState(false);

  const handleEventsForAttachmentModal = () => {
    setHandleShowAddNewAttachmentModal(
      (handleShowAddNewAttachmentModal) => !handleShowAddNewAttachmentModal
    );
  };

  const handleDownloadDocument = async (_, selectedRow) => {
    const res = await axios({
      url: `/downloadAttachment/${pageDetails?.schemaVar}/${selectedRow?.attached_file}`,
      method: "GET",
      responseType: "blob",
    });
    if (res.status === 201) {
      FileDownload(res.data, selectedRow?.attached_file);
    }
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
      width: 100,
    },
    {
      title: "Attachment",
      field: "attached_file",
    },
    {
      title: "Preview",
      field: "attached_file",
      render: (rowData) => {
        const { attached_file } = rowData;
        const path = `/${pageDetails?.schemaVar}/`;

        // Check if the file type is an image
        const isImage =
          attached_file.match(/\.(jpeg|jpg|gif|png|ico)$/) != null;

        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100px"
            minHeight="50px"
            overflow="hidden"
            boxShadow="-2px -2px 4px 0px rgba(0, 0, 0, 0.06), 2px 2px 4px 0px rgba(0, 0, 0, 0.06), -2px -2px 4px 0px rgba(0, 0, 0, 0.06) inset"
            mt={1}
            mb={1}
          >
            <Link
              target="_blank"
              href={`http://52.66.210.221:7000/${pageDetails?.schemaVar}/${attached_file}`}
              underline="hover"
            >
              {/* Render image if it's an image file, otherwise display file type */}
              {isImage ? (
                <img
                  style={{
                    maxWidth: "100px",
                    maxHeight: "100px",
                    borderRadius: "3px",
                  }}
                  src={path + attached_file}
                  alt=""
                />
              ) : (
                <Typography variant="h6">
                  {attached_file.split(".").pop().toUpperCase()}
                </Typography>
              )}
            </Link>
          </Box>
        );
      },
    },
  ];

  const actions = [
    {
      icon: () => <button className="btn bg-button">Upload document</button>,
      tooltip: "Upload document",
      isFreeAction: true,
      onClick: handleEventsForAttachmentModal,
    },
    {
      icon: () => <DownloadIcon />,
      tooltip: "Download document",
      position: "row",
      onClick: handleDownloadDocument,
    },
  ];

  return (
    <Container fluid>
      <ReportTitleBar
        title={pageDetails?.name}
        PreTools={<MuiNavigateBack />}
        Toolbar={
          <MachineNameTypography
            machineCode={machine_code}
            machineName={machineName}
          />
        }
      />

      {/* <CustomHooksForBackNavigation /> */}

      <Box className="mt-1 cell p-0 border-0">
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
            ...MaterialTableOptions,
            pageSize: 5,

            headerStyle: {
              position: "sticky",
              top: "0",
              fontWeight: "bold",
              fontSize: "14px",
              marginTop: "10px",

              backgroundColor: "#0fa3b1", // 6eaebd33, "004b5b", "E3F2FD", f3f3f3
              // color: "#fff", // 004b5b, 000, 000, 000
            },
            rowStyle: {
              fontSize: 16,
              fontFamily: "Roboto, Helvetica, Arial, sans-serif",

              // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
              // color:"rgba(255,255,255,0.8)",
              borderRadius: "5px",
              border: "1px solid rgba(255,255,255)",
              WebkitBackdropFilter: "blur( 2px )",
              background: "rgba(255,255,255,0.1)",
            },
            // actionsCellStyle: {
            //   backgroundColor: "#fefefe",
            // },
          }}
          style={MaterialTableStyle}
          sx={MaterialTableSX}
        />
      </Box>

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
