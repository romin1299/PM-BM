import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Col, Container } from "react-bootstrap";

import CustomHooksForBackNavigation, {
  MuiNavigateBack,
} from "../ButtonComponents/CustomHooksForBackNavigation";
import MachineDetails from "./MachineDetails";
import BreakdownTrend from "./BreakdownTrend";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, IconButton } from "@mui/material";

const MachineHistoryComponent = () => {
  const { machine_code } = useParams();

  const navigate = useNavigate();
  const { search } = useLocation();

  return (
    <Container fluid>
      <ReportTitleBar
        title={"Machine Details"}
        PreTools={<MuiNavigateBack />}
        Toolbar={
          <Col className="col-auto">
            <Button
              className="btn bg-button"
              sx={{ paddingInline: "1rem" }}
              onClick={() => {
                navigate(
                  `/machine-history/machine-document/${machine_code}/${search}`
                );
              }}
            >
              Machine Documents
            </Button>
          </Col>
        }
      />
      {/* <CustomHooksForBackNavigation /> */}
      <MachineDetails machine_code={machine_code} search={search} />
      <BreakdownTrend search={search} />
    </Container>
  );
};

export default MachineHistoryComponent;
