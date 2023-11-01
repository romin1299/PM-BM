import React, { useEffect, useState } from "react";
import PRDRequestSheet from "./PRDRequestSheet";
import MTDRequestSheet from "./MTDRequestSheet";
import { useParams, useNavigate } from "react-router-dom";
function MyTable() {
  const navigate = useNavigate();
  const { machine_code, generateType } = useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");

  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsOnScanningRequest/${generateType}/?machine_code=${machine_code}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        if (generateType === "scanned") {
          navigate("/", { replace: true });
        } else {
          navigate("/bm/generateRequestSheetMainDashboard", { replace: true });
        }
      } else {
        const { machine } = await res.json();
        // setMachine(machine);
        console.log(machine);

        setMachineDetails(machine);
        // setSelectedAttendee(breakDownAttendedBy);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  return (
    <>
      <PRDRequestSheet selectedMachineDetails={selectedMachineDetails} />
      <MTDRequestSheet selectedMachineDetails={selectedMachineDetails}/>
    </>
  );
}

export default MyTable;
