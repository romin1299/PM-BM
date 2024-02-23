import React, { useReducer, useContext } from "react";
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
import RoutingContext from "../../../context/routing/RoutingContext";
const TopMachineBD = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const [
    reduceStateForDefaultCellLineMachineFilter,
    reducerDispatchForDefaultCellLineMachineFilter,
  ] = useReducer(reducer, initialState);

  const loggedUserDetails = useContext(RoutingContext);

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const baseUrlForFilteringUsingDefaultValue =
    "/getFiltrationValue/machine-level-filtration";

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
                yearFiltration
                sectionFiltration
                subSectionFiltration
                cellFiltration
                lineFiltration
                machineFiltration
                resetButtonFiltration
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
            userDetails={loggedUserDetails}
            filterValues={reduceState}
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            selectedMonth={reduceState?.selectedMonth}
          />
        </Box>

        {/* {reduceState?.flagForTogglingFilter === "based-on-machine" && ( */}
        <ReportTitleBar
          title=""
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFilteringUsingDefaultValue}
                reduceState={reduceStateForDefaultCellLineMachineFilter}
                reducerDispatch={reducerDispatchForDefaultCellLineMachineFilter}
                yearFiltration
                sectionFiltration
                subSectionFiltration
                cellFiltration
                lineFiltration
                machineFiltration
                resetButtonFiltration
              />
              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(
                      EXPORT_REPORT.TOP_MACHINE_BD_DEFAULT,
                      reduceStateForDefaultCellLineMachineFilter
                    );
                  }}
                />
              </Col>
            </>
          }
        />

        <>
          <Row className="mt-3 gx-3">
            <Col xxl={6} lg={6} md={12} className="mb-2">
              <BDCategoryAndFactor
                selectedValue={
                  reduceStateForDefaultCellLineMachineFilter?.selectedValue
                }
                flagForTogglingFilter={
                  reduceStateForDefaultCellLineMachineFilter?.flagForTogglingFilter
                }
                selectedYear={
                  reduceStateForDefaultCellLineMachineFilter?.selectedYear
                }
                selectedMonth={
                  reduceStateForDefaultCellLineMachineFilter?.selectedMonth
                }
              />
            </Col>
            <Col xxl={3} lg={6} md={12} className="mb-2">
              <MachineWiseMTTRAndMTBF
                chartFor="MTTR"
                selectedValue={
                  reduceStateForDefaultCellLineMachineFilter?.selectedValue
                }
                flagForTogglingFilter={
                  reduceStateForDefaultCellLineMachineFilter?.flagForTogglingFilter
                }
                selectedYear={
                  reduceStateForDefaultCellLineMachineFilter?.selectedYear
                }
                userDetails={loggedUserDetails}
                filterValues={reduceState}
              />
            </Col>
            <Col xxl={3} lg={6} md={12} className="mb-2">
              <MachineWiseMTTRAndMTBF
                chartFor="MTBF"
                selectedValue={
                  reduceStateForDefaultCellLineMachineFilter?.selectedValue
                }
                flagForTogglingFilter={
                  reduceStateForDefaultCellLineMachineFilter?.flagForTogglingFilter
                }
                selectedYear={
                  reduceStateForDefaultCellLineMachineFilter?.selectedYear
                }
                userDetails={loggedUserDetails}
                filterValues={reduceStateForDefaultCellLineMachineFilter}
              />
            </Col>
          </Row>
          <Row>
            <BDRSTableWithDateFiltration
              flagForTogglingFilter={
                reduceStateForDefaultCellLineMachineFilter?.flagForTogglingFilter
              }
              selectedValue={
                reduceStateForDefaultCellLineMachineFilter?.selectedValue
              }
              selectedYear={
                reduceStateForDefaultCellLineMachineFilter?.selectedYear
              }
            />
          </Row>
        </>
        {/* )} */}
      </Container>
    </>
  );
};

export default TopMachineBD;
