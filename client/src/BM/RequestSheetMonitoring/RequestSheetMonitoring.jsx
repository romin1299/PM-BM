import React, { useEffect } from "react";

import RequestSheetMonitoringBarChart from "./RequestSheetMonitoringBarChart";

const RequestSheetMonitoring = () => {
  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/63317de11d1becfedab3381c`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { data } = await res.json();

      if (res?.status === 201) {
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getRequestSheetMonitoringData();
  }, []);

  return (
    <>
      <RequestSheetMonitoringBarChart />
    </>
  );
};

export default RequestSheetMonitoring;
