import React, { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

const QRReaderByQrScanner = ({ handleScan }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => handleScan(result),
      {
        // onDecodeError: (error) => console.error(error),
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScanner.start();

    return () => {
      qrScanner.stop();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ width: "100%" }} />
    </div>
  );
};

export default QRReaderByQrScanner;
