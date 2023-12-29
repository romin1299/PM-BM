import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";

import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from "./MTTRTrend";
import TMProgress from "./TMProgress";
import ReportTitleBar from "../Common/ReportTitleBar";
import {
  ACTION,
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import TmMttrSkillScore from "./TmMttrSkillScore";
import Checkbox from "@mui/material/Checkbox";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

const TMMTRMain = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [mbdIncluded, setMbdIncluded] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState(2);
  const handleChange = (event) => {
    setMbdIncluded(event.target.checked);
  };

  // const MBDCheckBox = (
  //   <Col className="col-auto justify-content-center align-items-center d-flex">
  //     <FormControlLabel
  //       control={
  //         <Checkbox
  //           sx={{
  //             color: "#004b5b",
  //             "&.MuiCheckbox-root": { p: "4px", mr: "4px", ml: "10px" },
  //             "&.Mui-checked": { color: "#004b5b" },
  //           }}
  //           checked={mbdIncluded}
  //           onChange={handleChange}
  //         />
  //       }
  //       label="Include MBD"
  //     />
  //   </Col>
  // );

  const TimeFilterInput = (
    <Col className="col-auto">
      <Box
        component="form"
        sx={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {/* <p style={{ fontSize: "1rem" }}>Time:</p> */}
        <Typography variant="body1" fontSize={16}>
          Time:
        </Typography>
        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "6rem",
            pl: 0,
            "& .MuiInputBase-input": {
              bgcolor: "white",
              // border: "1px solid gray",
            },
            "&.MuiFormControl-root": {
              bgcolor: "#c9c6c65c",
              // border: "1px solid gray",
            },
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiTypography-root": { m: 0, fontSize: 14 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            endAdornment: <InputAdornment position="end">Hr</InputAdornment>,
          }}
          size="small"
          onChange={(e) => {
            setTimeFilter(e.target.value);
          }}
          value={timeFilter}
        />
        <Button
          // size="small"
          disableElevation
          className="bg-button"
          variant="contained"
          sx={{
            minWidth: "30px",
            height: "32px",
            paddingInline: "10px",
          }}
          // onClick={getMachineWiseMTTRTrendData}
        >
          Go
        </Button>
      </Box>
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

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.TM_MTTR_SKILL, {
                      ...reduceState,
                      mbdIncluded,
                    });
                  }}
                />
              </Col>

              {/* {MBDCheckBox} */}
              {TimeFilterInput}
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
