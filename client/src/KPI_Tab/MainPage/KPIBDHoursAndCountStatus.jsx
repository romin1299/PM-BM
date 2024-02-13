import React, { useState, useEffect } from "react";
import {  Col } from "react-bootstrap";

const KPIBDHoursAndCountStatus = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
}) => {
  const styleObjAndClassNameForSpanValue = {
    className: "border d-flex justify-content-center align-items-center",
    style: { fontSize: "12px", fontWeight: "bold" },
  };

  const [BDHoursStatus, setBDHoursStatus] = useState({
    annualBDTarget: 0,
    BDActual: 0,
  });

  const [BDCountStatus, setBDCountStatus] = useState({
    annualMBDCount: 0,
    MBDActualAndMinorBdCount: {
      minorCount: 0,
      majorCount: 0,
    },
  });

  const getBdCountStatus = async () => {
    try {
      const res = await fetch(
        `/getBdCountStatus/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BDCountStatus } = await res.json();

      if (res?.status === 201) {
        setBDCountStatus(BDCountStatus);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBdHoursStatus = async () => {
    try {
      const res = await fetch(
        `/getBdHoursStatus/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BDHoursStatus } = await res.json();

      if (res?.status === 201) {
        setBDHoursStatus(BDHoursStatus);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getBdHoursStatus();

      if (flagForTogglingFilter !== "based-on-line") {
        getBdCountStatus();
      }
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          MBD Target
        </span>
        <span {...styleObjAndClassNameForSpanValue}>
          {BDCountStatus?.annualMBDCount}
        </span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          MBD Actual
        </span>
        <span {...styleObjAndClassNameForSpanValue}>
          {BDCountStatus?.MBDActualAndMinorBdCount?.majorCount}
        </span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          BD Target
        </span>
        <span {...styleObjAndClassNameForSpanValue}>
          {BDHoursStatus?.annualBDTarget}
        </span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          BD Actual
        </span>
        <span {...styleObjAndClassNameForSpanValue}>
          {BDHoursStatus?.BDActual}
        </span>
      </Col>
    </>
  );
};

export default KPIBDHoursAndCountStatus;
