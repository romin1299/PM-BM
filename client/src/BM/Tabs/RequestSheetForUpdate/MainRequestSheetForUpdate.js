import React, { useEffect, useState, useContext } from "react";
import PRDRequestSheetForUpdate from "./PRDRequestSheetForUpdate";
import MTDRequestSheetForUpdate from "./MTDRequestSheetForUpdate";
import { useParams, useNavigate } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import MTDRequestSheet from '../RequestSheet/MTDRequestSheet'

function MyTable() {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  const { machine_code, requestSheetNoOfBM, generateType } = useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");
  const [requestSheetDataOfBM, setRequestSheetDataOfBM] = useState("");

  const [approvalListOfBM, setApprovalListOfBM] = useState([]);
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
        const { machine, requestSheetApprovalList } = await res.json();
        // setMachine(machine);
        // console.log(machine);

        setMachineDetails(machine);
        setApprovalListOfBM(requestSheetApprovalList);
        // setSelectedAttendee(breakDownAttendedBy);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getRequestSheetDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineRequestSheetDetails/?requestSheetNoOfBM=${requestSheetNoOfBM}`,
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
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        console.log(data?.requestSheetData);
        setRequestSheetDataOfBM(data?.requestSheetData?.[0])
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  useEffect(() => {
    getRequestSheetDetails();
  }, [requestSheetNoOfBM]);

  return (
    <>
      <PRDRequestSheetForUpdate
        // selectedMachineDetails={selectedMachineDetails}
        requestSheetDataOfBM={requestSheetDataOfBM}
        // approvalListOfBM={approvalListOfBM}
      />

      {/* need to add condition for PRD not able add data on MTD part */}
      <MTDRequestSheet
        selectedMachineDetails={selectedMachineDetails}
        approvalListOfBM={approvalListOfBM}
        requestSheetDataOfBM={requestSheetDataOfBM}
      />
    </>
  );
}

export default MyTable;
