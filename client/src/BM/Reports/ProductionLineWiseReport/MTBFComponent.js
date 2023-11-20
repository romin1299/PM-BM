import React, { useEffect } from "react";

const MTBFComponent = () => {
  const getMTBFChartData = async () => {
    try {
      const res = await fetch("/getMtbfData?cellId=632c41261d1becfedab325f9", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (res?.status === 201) {
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getMTBFChartData();
  }, []);

  return <div>MTBFComponent</div>;
};

export default MTBFComponent;
