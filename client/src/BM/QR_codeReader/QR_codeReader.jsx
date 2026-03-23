import React, { useState, useEffect } from "react";
import QrReader from "react-qr-reader";
import { useNavigate } from "react-router-dom";

const QR_codeReader = () => {
  const [scanData, setScanData] = useState(false);
  const navigate = useNavigate();
  const handleScan = async (scannedMachineCode) => {
    if (scannedMachineCode) {
      setScanData(false);
      navigate(`/loginAfterScanned/${scannedMachineCode}`);
    }
  };
  const handleError = (err) => {
    console.error(err);
  };
  useEffect(() => {
    setScanData(true);
  }, []);

  return (
    <>
      <div className="containers">
        <div className="wrappers">
          <p>{scanData}</p>
          <div className="d-flex justify-content-center text-align-top-center">
            <h4>Scan QR from below scanner</h4>
          </div>
          {scanData && (
            <QrReader
              facingMode="environment"
              delay={1000}
              onScan={handleScan}
              onError={handleError}
              style={{ width: "100", height: "150" }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default QR_codeReader;
