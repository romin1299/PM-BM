import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { Container } from "react-bootstrap";

import CustomHooksForBackNavigation from "../ButtonComponents/CustomHooksForBackNavigation";
import MachineDetails from "./MachineDetails";
import BreakdownTrend from "./BreakdownTrend";

const MachineHistoryComponent = () => {
  const { machine_code } = useParams();

  const { search } = useLocation();

  return (
    <Container className="p-2">
      <CustomHooksForBackNavigation />
      <MachineDetails machine_code={machine_code} search={search}/>
      <BreakdownTrend search={search} />
    </Container>
  );
};

export default MachineHistoryComponent;
