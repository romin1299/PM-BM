import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import qr from "qrcode";
import { jsPDF } from "jspdf";
import { useForm } from "react-hook-form";

const DownloadLineWiseCustomizedQRCodeOfMachine = ({
  showQRCode,
  displayAndHideModalOfLineWiseMachineQR,
  selectedRow,
  setSelectedRow,
  machine,
  line,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {},
  });
  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };

  const downloadQRCodeOfMachineData = async (customQRCodeDataForLineWise) => {
    const doc = new jsPDF();

    // Define the dimensions for the table
    const startX = 5;
    const startY = 5;
    const spacing = 5;

    const startTextX = 7;
    const startTextY = 5;
    const textSpacing = 5;

    // Create an async function to generate a QR code
    const generateQRCode = async (data) => {
      return new Promise((resolve, reject) => {
        qr.toDataURL(
          data,
          { type: "image/jpeg", errorCorrectionLevel: "M" },
          (err, url) => {
            if (err) {
              reject(err);
            } else {
              resolve(url);
            }
          }
        );
      });
    };

    // Iterate through QR code data using forEach
    for (let index = 0; index < machine.length; index++) {
      const data = machine[index]?.machine_code;
      const col = index % parseInt(customQRCodeDataForLineWise?.numberOfColumn);
      const row = Math.floor(
        index / parseInt(customQRCodeDataForLineWise?.numberOfColumn)
      );
      const x =
        startX +
        col * (parseInt(customQRCodeDataForLineWise?.customWidth) + spacing);
      const y =
        startY +
        row * (parseInt(customQRCodeDataForLineWise?.customHeight) + spacing);

      const textX =
        startTextX +
        col *
          (parseInt(customQRCodeDataForLineWise?.customWidth) + textSpacing);
      const textY =
        startTextY +
        row *
          (parseInt(customQRCodeDataForLineWise?.customHeight) + textSpacing);
      // Generate the QR code as a data URL and add to the PDF
      const qrCodeDataURL = await generateQRCode(data);
      doc.text(data, textX, textY);
      doc.addImage(
        qrCodeDataURL,
        "JPEG",
        x,
        y,
        parseInt(customQRCodeDataForLineWise?.customWidth),
        parseInt(customQRCodeDataForLineWise?.customHeight)
      );
    }

    // Add a new page if needed
    if (
      machine?.length >=
      customQRCodeDataForLineWise?.numberOfRow *
        parseInt(customQRCodeDataForLineWise?.numberOfColumn)
    ) {
      doc.addPage();
    }

    // Save the PDF
    doc.save(`${line}_Machine_QR_${timeStamp()}`);
    displayAndHideModalOfLineWiseMachineQR();
    reset();
  };

  return (
    <>
      <Modal show={showQRCode} centered>
        <form onSubmit={handleSubmit(downloadQRCodeOfMachineData)}>
          <Modal.Header>
            <Modal.Title>Generate QR of : {line}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Enter the number of rows:</Form.Label>
              <Form.Control
                type="number"
                //   value={customHeight}
                //   onChange={handleHeightChange}
                {...register("numberOfRow", {
                  required: "Please enter number of rows",
                })}
                min="1"
                max="500"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Enter the number of columns:</Form.Label>
              <Form.Control
                type="number"
                //   value={customHeight}
                //   onChange={handleHeightChange}
                {...register("numberOfColumn", {
                  required: "Please enter number of column",
                })}
                min="1"
                max="500"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Custom Height:</Form.Label>
              <Form.Control
                type="number"
                //   value={customHeight}
                //   onChange={handleHeightChange}
                {...register("customHeight", {
                  required: "Please enter custom height",
                })}
                min="1"
                max="500"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Custom Width:</Form.Label>
              <Form.Control
                type="number"
                //   value={customWidth}
                //   onChange={handleWidthChange}
                {...register("customWidth", {
                  required: "Please enter custom width",
                })}
                min="1"
                max="500"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="btn-reset"
              variant="danger"
              onClick={() => {
                displayAndHideModalOfLineWiseMachineQR();
                setSelectedRow();
                reset();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Download
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default DownloadLineWiseCustomizedQRCodeOfMachine;
