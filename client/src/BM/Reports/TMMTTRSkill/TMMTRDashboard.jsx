import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";

import { Box, FormControlLabel } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from "./MTTRTrend";
import TMProgress from "./TMProgress";
import ReportTitleBar from "../Common/ReportTitleBar";
import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import TmMttrSkillScore from "./TmMttrSkillScore";
import Checkbox from "@mui/material/Checkbox";

const TMMTRMain = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [mbdIncluded, setMbdIncluded] = React.useState(false);
  const handleChange = (event) => {
    setMbdIncluded(event.target.checked);
  };

  const MBDCheckBox = (
    <Col className="col-auto justify-content-center align-items-center d-flex">
      <FormControlLabel
        control={
          <Checkbox
            sx={{
              color: "#004b5b",
              "&.MuiCheckbox-root": { p: "4px", mr: "4px" },
              "&.Mui-checked": { color: "#004b5b" },
            }}
            checked={mbdIncluded}
            onChange={handleChange}
          />
        }
        label="Include MBD"
      />
    </Col>
  );

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="TM MTTR Skill"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
              />

              {MBDCheckBox}
            </>
          }
        />

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <MTTRTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
              mbdIncluded={mbdIncluded}
            />
          </Col>

          <Col md={12} lg={6}>
            <TMProgress {...reduceState} mbdIncluded={mbdIncluded} />
          </Col>

          <Col md={12} style={{ marginTop: "1rem" }}>
            <TmMttrSkillScore />
          </Col>

          {/* <Col
            md={12}
            style={{ marginTop: "1rem", paddingBottom: "4rem" }}
          ></Col> */}
        </Row>
      </Box>
    </Container>
  );
};

export default TMMTRMain;
