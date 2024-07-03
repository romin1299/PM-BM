import React, { useState, useEffect } from "react";
import CheckSheetForImplementation from "./CheckSheetForImplementation";
import CheckSheet from "../Dashboard/CheckSheet";
import Footer from "../../components/Footer/Footer";

const GettingMachineDataForCheckSheetImplementation = ({
  machineData,
  lineName,
  closeCheckSheet,
  loggedUserType,
  selectedYear,
  showCheckSheet,
  setMachineWiseCheckSheetForImplementation,
}) => {
  const [implementationPhaseCheckSheet, setImplementationPhaseCheckSheet] =
    useState("");
  const [refKey, setRefKey] = useState(0);

  const functionToSetRefKey = () => {
    setRefKey((refKey) => refKey + 1);
  };

  // const [show, setShow] = useState(showCheckSheet);
  const handleClose = () => {
    setMachineWiseCheckSheetForImplementation("");
    closeCheckSheet();
  };
  // const handleShow = () => setShow(true);

  // console.log(show);
  const postMachineIdToGetAllDetailsOfMachine = async () => {
    try {
      const res = await fetch(`/postMachineIdToGetAllDetailsOfMachine/?machine_code=${machineData?.machine_code}&&selectedYear=${selectedYear}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {

        // setMachineDataState(data.machineData);
        loggedUserType === "Operator"
          ? setImplementationPhaseCheckSheet(
              <CheckSheetForImplementation
                // machineData={data?.machineLastData}
                machine_code={machineData?.machine_code}
                selectedYear={selectedYear}
                lineName={lineName}
                closeCheckSheet={closeCheckSheet}
                functionToSetRefKey={functionToSetRefKey}
                handleClose={handleClose}
                show={showCheckSheet}
              />
            )
          : setImplementationPhaseCheckSheet(
              <CheckSheet
                show={showCheckSheet}
                machineData={data?.machineLastData}
                lineName={lineName}
                handleClose={handleClose}
              />
            );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setImplementationPhaseCheckSheet("");
    postMachineIdToGetAllDetailsOfMachine();
  }, [refKey]);

  //   console.log(refKey);

  //   useEffect(() => {
  //     if (refKey > 0) {
  //       setImplementationPhaseCheckSheet("");

  //       setTimeout(() => {
  //         setImplementationPhaseCheckSheet(
  //           <CheckSheetForImplementation
  //             machineData={machineDataState}
  //             lineName={lineName}
  //             closeCheckSheet={closeCheckSheet}
  //             functionToSetRefKey={functionToSetRefKey}
  //           />
  //         );
  //       }, 1000);
  //     }
  //   }, []);
  //   useEffect(() => {
  //     if (machineDataState.length > 2) {
  //       setImplementationPhaseCheckSheet(
  //         <CheckSheetForImplementation
  //           machineData={machineDataState}
  //           lineName={lineName}
  //           closeCheckSheet={closeCheckSheet}
  //           functionToSetRefKey={functionToSetRefKey}
  //         />
  //       );
  //     }
  //   }, [machineDataState]);
  return (
    <>
      <div>{implementationPhaseCheckSheet}</div>
      <br />
      <br />
      <br />
      <Footer/>
    </>
  );
};

export default GettingMachineDataForCheckSheetImplementation;
