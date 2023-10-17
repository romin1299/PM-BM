import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import qr from "qrcode";

const ViewGeneratedQROfMachine = ({
  showQRCode,
  displayAndHide,
  selectedRow,
  setSelectedRow,
}) => {
  const printQRCodeOfTheSelectedMachine = () => {
    window.print();
  };

  const [qrCodeImage, setQRCodeImage] = useState('');

  useEffect(() => {
    if (selectedRow?.machine_code) {
      qr.toDataURL(selectedRow?.machine_code, (error, url) => {
        if (error) {
          console.error('Error generating QR code:', error);
        } else {
          setQRCodeImage(url);
        }
      });
    }
  }, [selectedRow?.machine_code]);

  return (
    <>
      <Modal show={showQRCode} centered>
        <Modal.Header>
          <Modal.Title>
            Generated QR of : {selectedRow?.machine_code}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* <div className="alert alert-danger">
            Are you sure you want to delete the CheckSheet ?
          </div> */}
          <div className="d-flex justify-content-center align-items-center">
            {/* <QRCodeSVG value={selectedRow?.machine_code} /> */}
            <img src={qrCodeImage} alt="QR Code" height={200} width={200}/>
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
          <Button
            variant="danger"
            onClick={() => {
              printQRCodeOfTheSelectedMachine();
            }}
          >
            Print
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewGeneratedQROfMachine;
