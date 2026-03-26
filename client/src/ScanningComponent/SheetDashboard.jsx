import React, { useEffect } from "react";

import { useParams } from "react-router-dom";

const SheetDashboard = () => {
  const { machineCode, sheetType } = useParams();

  const getSheetDataBasedOnScanning = async () => {
    try {
      const res = await fetch(
        `/getDataBasedOnScanningRequest/${sheetType}/${machineCode}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSheetDataBasedOnScanning();
  }, []);

  return <div>SheetDashboard</div>;
};

export default SheetDashboard;
