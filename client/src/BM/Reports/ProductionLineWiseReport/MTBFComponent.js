import React, { useState, useEffect } from "react";

const MTBFComponent = ({ selectedValue, flagForCellAndLineToggle }) => {
  const [mtbfData, setMtbfData] = useState({
    labels: [],
    data: [],
    target: [],
  });
  const getMTBFChartData = async () => {
    try {
      const res = await fetch(
        `/getMtbfData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getMtbfData/${flagForCellAndLineToggle}/${selectedValue}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, getMtbf } = await res.json();

      if (res?.status === 201) {
        console.log(getMtbf);
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
