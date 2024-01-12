import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  reducer,
  initialState,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

import TopMachineBDComponent from "./TopMachineBDComponent";
import BDCategoryAndFactor from "./BDCategoryAndFactor";
import MachineWiseMTTRAndMTBF from "./MachineWiseMTTRAndMTBF";
import ReportTitleBar from "../Common/ReportTitleBar";
import { Box } from "@mui/system";
import BDRSTableWithDateFiltration from "../Common/BDRSTableWithDateFiltration";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

const TopMachineBD = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  return (
    <>
      <Container fluid>
        <ReportTitleBar
          title="Top Machine Breakdown"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
                machineFiltration
              />
              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(
                      EXPORT_REPORT.TOP_MACHINE_BREAKDOWN,
                      reduceState
                    );
                  }}
                />
              </Col>
            </>
          }
        />

        <Box mt={2}>
          <TopMachineBDComponent
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            selectedMonth={reduceState?.selectedMonth}
          />
        </Box>

        {reduceState?.flagForTogglingFilter === "based-on-machine" && (
          <>
            <Row className="mt-3 gx-3">
              <Col xxl={6} lg={6} md={12} className="mb-2">
                <BDCategoryAndFactor
                  selectedValue={reduceState?.selectedValue}
                  flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                  selectedYear={reduceState?.selectedYear}
                  selectedMonth={reduceState?.selectedMonth}
                />
              </Col>
              <Col xxl={3} lg={6} md={12} className="mb-2">
                <MachineWiseMTTRAndMTBF
                  chartFor="MTTR"
                  selectedValue={reduceState?.selectedValue}
                  flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                  selectedYear={reduceState?.selectedYear}
                />
              </Col>
              <Col xxl={3} lg={6} md={12} className="mb-2">
                <MachineWiseMTTRAndMTBF
                  chartFor="MTBF"
                  selectedValue={reduceState?.selectedValue}
                  flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                  selectedYear={reduceState?.selectedYear}
                />
              </Col>
            </Row>
            <Row>
              <BDRSTableWithDateFiltration
                flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                selectedValue={reduceState?.selectedValue}
              />
            </Row>
          </>
        )}
      </Container>
    </>
  );
};

export default TopMachineBD;
