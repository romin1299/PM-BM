import React from "react";
import { useParams } from "react-router-dom";
import LoginCard from "./LoginCard";

const LoginAfterQrScanned = () => {
  const { machineId } = useParams();

  return (
    <>
      <main className="mains">
        <div className="containers">
          <div
            className="wrappers"
            style={{ maxWidth: "350px", padding: "20px" }}
          >
            <LoginCard scannedMachineId={machineId} />
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginAfterQrScanned;
