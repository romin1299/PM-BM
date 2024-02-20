import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import Box from "@mui/material/Box";

import { useDropzone } from "react-dropzone";
import styled from "styled-components";
import { Typography } from "@mui/material";

const thumbsContainer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 10,
};

const thumb = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",

  minWidth: "60px",
  minHeight: "50px",

  boxSizing: "border-box",
  borderRadius: 2,
  border: "1px solid #eaeaea",

  marginBottom: 8,
  marginRight: 8,
  padding: 4,
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  // overflow: "hidden",
};

const img = {
  display: "block",
  width: "100%",
  maxWidth: "200px",
  maxHeight: "100px",
};

const getColor = (props) => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragReject) {
    return "#ff1744";
  }
  if (props.isFocused) {
    return "#2196f3";
  }
  return "#eeeeee";
};

const DropzoneContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${(props) => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border 0.24s ease-in-out;
`;

const AddNewAttachmentModal = ({
  handleShowAddNewAttachmentModal,
  closeModal,
  machine_code,
  pageDetails,
  setAttachmentDetails,
}) => {
  const handleClose = () => {
    setFiles([]);
    closeModal();
  };

  const handleAddNewAttachment = async (data) => {
    console.log("data:", data);
    try {
      const formData = new FormData();

      for (let i = 0; i < data?.length; i++) {
        formData.append("attached_files", data?.[i]);
      }

      const res = await fetch(
        `/addNewAttachment/${pageDetails?.schemaVar}/?machine_code=${machine_code}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const { message, attachmentDetails } = await res.json();

      if (res.status === 201) {
        setAttachmentDetails(attachmentDetails);
      }

      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const [files, setFiles] = useState([]);
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      // accept: {
      //   "image/*": [],
      // },
      onDrop: (acceptedFiles) => {
        setFiles(
          acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            })
          )
        );
      },
    });

  // Filter files based on file type
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

  const imageThumbs = imageFiles.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img
          src={file.preview}
          style={img}
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
          alt="preview"
        />
      </div>
    </div>
  ));

  const otherFileList = otherFiles.map((file, index) => {
    let fileSize;
    if (file.size < 1024 * 1024) {
      // File size is less than 1MB, display in KB
      fileSize = (file.size / 1024).toFixed(2) + " KB";
    } else {
      // File size is 1MB or more, display in MB
      fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    }
    return (
      <li key={index}>
        {file.name} - {fileSize}
      </li>
    );
  });

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  return (
    <Modal
      show={handleShowAddNewAttachmentModal}
      onHide={handleClose}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Upload Document
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DropzoneContainer
          {...getRootProps({ isFocused, isDragAccept, isDragReject })}
        >
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </DropzoneContainer>

        {files.length > 0 && (
          <Box mt={2}>
            {imageFiles.length > 0 && (
              <div>
                <Typography variant="h6" gutterBottom>
                  Images Selected
                </Typography>
                <div style={thumbsContainer}>{imageThumbs}</div>
              </div>
            )}
            {otherFiles.length > 0 && (
              <div>
                <Typography variant="h6" gutterBottom>
                  Files Selected
                </Typography>
                <Typography component="ul">
                  {otherFileList.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </Typography>
              </div>
            )}
          </Box>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          onClick={() => {
            handleAddNewAttachment(files);
          }}
        >
          submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNewAttachmentModal;
