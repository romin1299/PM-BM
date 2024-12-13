import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GeneratedExistingMachineRequestSheetByMTD from "./GeneratedExistingMachineRequestSheetByMTD";

const ExistingMachineRequestSheet = () => {
  const { machine_code, selectedYear } = useParams();
  const navigate = useNavigate();

  const [selectedMachineData, setSelectedMachineData] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);

  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsForRequestSheetOfCM/?machine_code=${machine_code}&&current_year=${selectedYear}`,
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
        navigate("/", { replace: true });
      } else {
        const { machine, TLHOSS_and_TM_user_list } = await res.json();
        setSelectedMachineData(machine);
        setSupportingTMList(TLHOSS_and_TM_user_list);

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
      <div className="p-2">
        <div id="request-sheet-target" className="border border-dark">
          <GeneratedExistingMachineRequestSheetByMTD
            selectedMachineData={selectedMachineData}
            assignTMList={supportingTMList}
          />
        </div>
      </div>
    </>
  );
};

export default ExistingMachineRequestSheet;
