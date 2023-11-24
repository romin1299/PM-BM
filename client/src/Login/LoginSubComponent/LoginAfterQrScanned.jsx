import React from "react";
import LoginComponent from "./LoginComponent";
import { useParams } from "react-router-dom";

const LoginAfterQrScanned = () => {
  const { machineId } = useParams();

  return (
    <>
      <main className="mains">
        <LoginComponent scannedMachineId={machineId} />
      </main>
    </>
  );
};

export default LoginAfterQrScanned;
