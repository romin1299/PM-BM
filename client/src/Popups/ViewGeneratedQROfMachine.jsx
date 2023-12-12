import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import qr from "qrcode";

const ViewGeneratedQROfMachine = ({
  showQRCode,
  displayAndHide,
  selectedRow,
  setSelectedRow,
}) => {
  const [qrCodeImage, setQRCodeImage] = useState("");
  const [customHeight, setCustomHeight] = useState(200); // Default height
  const [customWidth, setCustomWidth] = useState(200); // Default width
  const [isGenerating, setIsGenerating] = useState(false);

  const printQRCodeOfTheSelectedMachine = () => {
    window.print();
  };

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsGenerating(true);

        if (selectedRow?.machine_code) {
          const url = await qr.toDataURL(selectedRow?.machine_code, {
            width: customWidth,
            height: customHeight,
          });
          setQRCodeImage(url);
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (showQRCode && !isGenerating) {
      generateQRCode();
    }
  }, [showQRCode, selectedRow?.machine_code, customHeight, customWidth, isGenerating]);

  const handleHeightChange = (e) => {
    setCustomHeight(e.target.value);
  };

  const handleWidthChange = (e) => {
    setCustomWidth(e.target.value);
  };

  const downloadQRCode = () => {
    if (!isGenerating) {
      const canvas = document.createElement("canvas");
      canvas.width = customWidth;
      canvas.height = customHeight;
      const ctx = canvas.getContext("2d");

      const image = new Image();
      image.src = qrCodeImage;
      image.onload = () => {
        ctx.drawImage(image, 0, 0, customWidth, customHeight);

        const link = document.createElement("a");
        link.href = canvas.toDataURL();
        link.download = `QRCode_${customWidth}x${customHeight}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }
  };


  return (
    <>
      <Modal show={showQRCode} centered>
        <Modal.Header>
          <Modal.Title>
            Generated QR of : {selectedRow?.machine_code}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Custom Height:</Form.Label>
            <Form.Control
              type="number"
              value={customHeight}
              onChange={handleHeightChange}
              min="1"
              max="500"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Custom Width:</Form.Label>
            <Form.Control
              type="number"
              value={customWidth}
              onChange={handleWidthChange}
              min="1"
              max="500"
            />
          </Form.Group>

          <div className="d-flex justify-content-center align-items-center">
            <img
              src={qrCodeImage}
              alt="QR Code"
              height={customHeight}
              width={customWidth}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn-reset"
            onClick={() => {
              displayAndHide();
              setSelectedRow();
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={printQRCodeOfTheSelectedMachine}>
            Print
          </Button>
          <Button variant="primary" onClick={downloadQRCode}>
            Download
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewGeneratedQROfMachine;
