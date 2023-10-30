import "../../App.css";
import { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Container from "../../components/Container/Container";
import RightNavbar from "../../components/RightNavbar/RightNavbar";
import NavContext from "../../context/NavContext";
import AdminDashboard from "../../pages/Admin/AdminDashboard";

import RoutingContext from "../../context/routing/RoutingContext";
import ContextAPI from "../../context/ContextAPI/ContextAPI";
import Profile from "../../pages/Profile";

import AdminCreationDashboard from "../../pages/Admin/AdminCreationDashboard";
// import CheckSheet from "./pages/Dashboard/CheckSheet";

// plant dashboard

import PlantCreation from "../../pages/Plant/PlantCreation";
import SectionPage from "../../pages/Plant/SectionPage";
import CreationDashboardForPlant from "../../pages/Plant/CreationDashboardForPlant";
import UserAssign from "../../pages/Plant/UserAssign";
import SixMonthApprovalDashboard from "../../pages/Plant/SixMonthApprovalDashboard";

//Section Dashboard
import SectionDashboard from "../../pages/Section/SectionDashboard";
import OperatorDashboard from "../../pages/Operator/OperatorDashboard";
import UserAssignSection from "../../pages/Section/UserAssignSection";
import CreationDashboardForSection from "../../pages/Section/CreationDashboardForSection";
import CheckSheetDashboard from "../../pages/Section/CheckSheetDashboard";
import ChecksheetCreationDashboard from "../../pages/Section/Checksheet/ChecksheetCreationDashboard";
import CheckSheetForm from "../../pages/Section/Checksheet/ChecksheetForm";
// import CheckSheetApprovalDashboardForTL from "./pages/Section/Checksheet/ChecksheetApprovalDashboardForTL";
// import CheckSheetApprovalDashboardForHOS from "./pages/Section/Checksheet/ChecksheetApprovalDashboardForHOS";
import ChecksheetFormApprovalForHOSAndHOD from "../../pages/Section/Checksheet/ChecksheetFormApprovalForHOSAndHOD";
import ChecksheetFormApprovalForTL from "../../pages/Section/Checksheet/ChecksheetFormApprovalForTL";
import BackupDataOfCheckSheet from "../../pages/Section/Checksheet/BackupDataOfCheckSheet";
import ShowBackupChecksheetTableData from "../../pages/Section/Checksheet/ShowBackupChecksheetTableData";

//TL dashboard For Planning phase
import PlanningPhaseTable from "../../pages/Section/Checksheet/Planning/PlanningPhaseTable";
import PMSheetApproval from "../../pages/Section/Checksheet/PMSheetApproval";
import PmAllReportDashboard from "../../pages/Reports/PmAllReportDashboard";
import OpenAbnormalityTrack from "../../pages/Reports/OpenAbnormalityTracking";
import MTDTLandHOSChecksheetCreationDashboard from "../../pages/Section/Checksheet/MTDTLandHOSChecksheetCreationDashboard";
import CreationDashboardForTLHOSS from "../../pages/MTD_TL_HOSS/CreationDashboardForTLHOSS";
import UserAssignTLHOSS from "../../pages/MTD_TL_HOSS/UserAssignTLHOSS";
import SparePartUsageHistory from "../../pages/MTD_TL_HOSS/SparePartUsageHistory";
import OperatorDataEntry from "../../pages/MTD_TL_HOSS/OperatorDataEntry";

//for Operator
import CheckSheetForImplementation from "../../pages/Operator/CheckSheetForImplementation";
import SkipPMWorkData from "../../pages/Reports/SkipPMWorkData";
import CheckSheet from "../../pages/Dashboard/CheckSheet";

//implementation approval flow
import PMSheetApprovalOfImplementationPhase from "../../pages/Section/Checksheet/PMSheetApprovalOfImplementationPhase";

//Common Pages

import SummeryDashboard from "../../pages/Dashboard/SummeryDashboard/SummeryDashboard";

import ViewChecksheet from "../../pages/Section/Checksheet/ViewChecksheet";

import LogHistory from "../../pages/Reports/LogHistory";

import PendingPMLogHistory from "../../pages/Reports/PendingPMLogHistory";

import SpareReportMainDashboard from "../../pages/Reports/SpareReport/SpareReportMainDashboard";

//for all reports routing

import MachineWisePmMonthlyReport from "../../pages/Reports/ReportComponents/MachineWisePmMonthlyReport";
import LineWisePmMonthlyReport from "../../pages/Reports/ReportComponents/LineWisePmMonthlyReport";
import AnnualPMSchedule from "../../pages/Reports/ReportComponents/AnnualPMSchedule";
import AnnualPmStatus from "../../pages/Reports/ReportComponents/AnnualPmStatus";
import PmTimeMonitoringReport from "../../pages/Reports/ReportComponents/PmTimeMonitoringReport";

//approval dashboards
import PreparationApprovalDashboard from "../../pages/Section/Checksheet/PreparationApprovalDashboard";
// import PreparationApprovalDashboard from "../pages/Section/Checksheet/PreparationApprovalDashboard";
import PlanningApprovalDashboard from "../../pages/Section/Checksheet/PlanningApprovalDashboard";
import ImplementationApprovalDashboard from "../../pages/Section/Checksheet/ImplementationApprovalDashboard";
import Footer from "../../components/Footer/Footer";

function App() {
  const [nav, setNav] = useState(false);
  const value = { nav, setNav };

  const context = useContext(RoutingContext);

  if (context.user_type === "Admin") {
    return (
      <div className="App">
        <NavContext.Provider value={value}>
          <Navbar />
          <Container
            stickyNav={<RightNavbar />}
            content={
              <Routes>
                <Route path="/pm/adminDashboard" element={<AdminDashboard />} />
                <Route  path="/pm" element={<AdminCreationDashboard />} />
                <Route path="/pm/profile" element={<Profile />} />
                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  } else if (context.user_type === "Plant-Admin") {
    return (
      <div className="App">
        <NavContext.Provider value={value}>
          <Navbar />
          <Container
            stickyNav={<RightNavbar />}
            content={
              <Routes>
                <Route  path="/pm" element={<OperatorDashboard />} />
                <Route
                  path="/pm/creationDashboard"
                  element={<CreationDashboardForPlant />}
                />
                <Route path="/pm/section" element={<SectionPage />} />
                <Route path="/pm/userAssign" element={<UserAssign />} />
                <Route path="/pm/profile" element={<Profile />} />
                <Route path="/pm/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
                <Route path="/pm/logHistory" element={<LogHistory />} />
                <Route
                  path="/pm/pendingPMLogHistory"
                  element={<PendingPMLogHistory />}
                />

                {/* All reports routing */}
                <Route
                  path="/pm/machineWisePmMonthlyReport"
                  element={<MachineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/lineWisePmMonthlyReport"
                  element={<LineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/annualPMSchedule"
                  element={<AnnualPMSchedule />}
                />
                <Route path="/pm/annualPmStatus" element={<AnnualPmStatus />} />
                <Route
                  path="/pmTimeMonitoringReport"
                  element={<PmTimeMonitoringReport />}
                />

                {/* Report Dashboard */}

                <Route
                  path="/pmMonthlyReport"
                  element={<PmAllReportDashboard />}
                />
                <Route
                  path="/pm/openAbnormalityTrack"
                  element={<OpenAbnormalityTrack />}
                />
                <Route
                  path="/pm/spareReportDashboard"
                  element={<SpareReportMainDashboard />}
                />
                <Route
                  path="/pmSheetApprovalOfImplementationPhase"
                  element={<PMSheetApprovalOfImplementationPhase />}
                />
                <Route path="/pm/viewCheckSheet" element={<ViewChecksheet />} />
                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
                <Route path="/pm/logHistory" element={<LogHistory />} />
                <Route
                  path="/pm/pendingPMLogHistory"
                  element={<PendingPMLogHistory />}
                />
                <Route
                  path="/pm/sparePartUsageHistory"
                  element={<SparePartUsageHistory />}
                />
                <Route
                  path="/pm/backupTableData"
                  element={<ShowBackupChecksheetTableData />}
                />
                <Route
                  path="/pmSheetApprovalOfImplementationPhase"
                  element={<PMSheetApprovalOfImplementationPhase />}
                />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />

                <Route
                  path="/pm/backupDataOfCheckSheet"
                  element={<BackupDataOfCheckSheet />}
                />

                <Route
                  path="/pm/sixMonthApprovalDashboard"
                  element={<SixMonthApprovalDashboard />}
                />
                <Route
                  path="/pm/checksheetFormApproval"
                  element={<ChecksheetFormApprovalForHOSAndHOD />}
                />
              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  } else if (context.user_type === "Section-Admin") {
    return (
      <div className="App">
        <NavContext.Provider value={value}>
          <Navbar />
          <Container
            stickyNav={<RightNavbar />}
            content={
              <Routes>
                <Route  path="/pm" element={<OperatorDashboard />} />
                <Route
                  path="/pm/creationDashboard"
                  element={<CreationDashboardForSection />}
                />
                <Route path="/pm/userAssign" element={<UserAssignSection />} />
                <Route path="/pm/profile" element={<Profile />} />
                {/* <Route path="/pm/approvalDashboard" element={<CheckSheetApprovalDashboardForHOS />} /> */}
                <Route
                  path="/pm/checksheetFormApproval"
                  element={<ChecksheetFormApprovalForHOSAndHOD />}
                />
                <Route
                  path="/pm/checksheetCreationDashboard"
                  element={<ChecksheetCreationDashboard />}
                />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                <Route path="/pm/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route
                  path="/pm/checksheetCreationDashboardForMTDTLandHOS"
                  element={<MTDTLandHOSChecksheetCreationDashboard />}
                />
                <Route
                  path="/pmMonthlyReport"
                  element={<PmAllReportDashboard />}
                />
                <Route
                  path="/pmSheetApprovalOfImplementationPhase"
                  element={<PMSheetApprovalOfImplementationPhase />}
                />
                <Route path="/pm/viewCheckSheet" element={<ViewChecksheet />} />
                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
                <Route path="/pm/logHistory" element={<LogHistory />} />
                <Route
                  path="/pm/pendingPMLogHistory"
                  element={<PendingPMLogHistory />}
                />
                <Route
                  path="/pm/sparePartUsageHistory"
                  element={<SparePartUsageHistory />}
                />
                <Route
                  path="/pm/backupTableData"
                  element={<ShowBackupChecksheetTableData />}
                />

                <Route
                  path="/pm/backupDataOfCheckSheet"
                  element={<BackupDataOfCheckSheet />}
                />
                <Route
                  path="/pm/spareReportDashboard"
                  element={<SpareReportMainDashboard />}
                />
                <Route
                  path="/pm/openAbnormalityTrack"
                  element={<OpenAbnormalityTrack />}
                />

                {/* <Route path="/pm/checkSheet" element={<CheckSheet />} /> */}

                {/* approval dashboard */}
                <Route
                  path="/pm/preparationApproval"
                  element={<PreparationApprovalDashboard />}
                />
                <Route
                  path="/pm/planningApproval"
                  element={<PlanningApprovalDashboard />}
                />
                <Route
                  path="/pm/implementationApproval"
                  element={<ImplementationApprovalDashboard />}
                />

                {/* All reports routing */}
                <Route
                  path="/pm/machineWisePmMonthlyReport"
                  element={<MachineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/lineWisePmMonthlyReport"
                  element={<LineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/annualPMSchedule"
                  element={<AnnualPMSchedule />}
                />
                <Route path="/pm/annualPmStatus" element={<AnnualPmStatus />} />
                <Route
                  path="/pmTimeMonitoringReport"
                  element={<PmTimeMonitoringReport />}
                />
              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  } else if (context.user_type === "Operator") {
    return (
      <div className="App">
        <NavContext.Provider value={value}>
          <Navbar />
          <Container
            stickyNav={<RightNavbar />}
            content={
              <Routes>
                <Route  path="/pm" element={<OperatorDashboard />} />
                <Route
                  path="/pm/machineWiseCheckSheetForImplemetation"
                  element={<CheckSheetForImplementation />}
                />
                <Route
                  path="/pm/sparePartUsageHistory"
                  element={<SparePartUsageHistory />}
                />
                <Route path="/pm/profile" element={<Profile />} />
                <Route
                  path="/pmMonthlyReport"
                  element={<PmAllReportDashboard />}
                />
                <Route
                  path="/pm/checkSheetDashboard"
                  element={<CheckSheetDashboard />}
                />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                <Route
                  path="/pmSheetApprovalOfImplementationPhase"
                  element={<PMSheetApprovalOfImplementationPhase />}
                />
                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
                <Route path="/pm/viewCheckSheet" element={<ViewChecksheet />} />
                <Route path="/pm/logHistory" element={<LogHistory />} />
                <Route
                  path="/pm/pendingPMLogHistory"
                  element={<PendingPMLogHistory />}
                />
                <Route path="/pm/skipedPMWorkData" element={<SkipPMWorkData />} />
                <Route
                  path="/pm/spareReportDashboard"
                  element={<SpareReportMainDashboard />}
                />

                <Route
                  path="/pm/checksheetCreationDashboard"
                  element={<ChecksheetCreationDashboard />}
                />

                <Route path="/pm/checkSheetForm" element={<CheckSheetForm />} />

                {/* <Route path="/pm/checkSheetDashboard" element={<CheckSheetDashboard />} />
                <Route path="/pm/checksheetCreationDashboard" element={<ChecksheetCreationDashboard />} />
                <Route path="/pm/checkSheetForm" element={<CheckSheetForm />} /> */}

                {/* All reports routing */}
                <Route
                  path="/pm/machineWisePmMonthlyReport"
                  element={<MachineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/lineWisePmMonthlyReport"
                  element={<LineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/annualPMSchedule"
                  element={<AnnualPMSchedule />}
                />
                <Route path="/pm/annualPmStatus" element={<AnnualPmStatus />} />
                <Route
                  path="/pmTimeMonitoringReport"
                  element={<PmTimeMonitoringReport />}
                />
                <Route
                  path="/pm/operatorDataEntry"
                  element={<OperatorDataEntry />}
                />
                <Route
                  path="/pm/backupTableData"
                  element={<ShowBackupChecksheetTableData />}
                />
                <Route
                  path="/pm/backupDataOfCheckSheet"
                  element={<BackupDataOfCheckSheet />}
                />
                <Route
                  path="/pm/openAbnormalityTrack"
                  element={<OpenAbnormalityTrack />}
                />
              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  } else if (context.user_type === "TL/HOSS") {
    return (
      <div className="App">
        <NavContext.Provider value={value}>
          <Navbar />
          <Container
            stickyNav={<RightNavbar />}
            content={
              <Routes>
                <Route path="/pm" element={<OperatorDashboard />} />
                <Route
                  path="/pm/creationDashboard"
                  element={<CreationDashboardForTLHOSS />}
                />
                <Route path="/pm/userAssign" element={<UserAssignTLHOSS />} />
                <Route path="/pm/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route path="/pm/profile" element={<Profile />} />
                {context.tm_department === "MTD" ? (
                  <>
                    <Route
                      path="/pm/checkSheetDashboard"
                      element={<CheckSheetDashboard />}
                    />
                    {/* <Route path="/pm/sparePartUsageHistory" element={<SparePartUsageHistory />} /> */}
                    <Route
                      path="/pm/operatorDataEntry"
                      element={<OperatorDataEntry />}
                    />
                  </>
                ) : (
                  ""
                )}
                <Route
                  path="/pm/sparePartUsageHistory"
                  element={<SparePartUsageHistory />}
                />

                <Route
                  path="/pm/checksheetCreationDashboard"
                  element={<ChecksheetCreationDashboard />}
                />
                <Route path="/pm/checkSheetForm" element={<CheckSheetForm />} />
                {/* <Route path="/pm/approvalDashboard" element={<CheckSheetApprovalDashboardForTL />} /> */}
                <Route
                  path="/pm/checksheetFormApproval"
                  element={<ChecksheetFormApprovalForTL />}
                />
                <Route
                  path="/pm/planningPhaseTable"
                  element={<PlanningPhaseTable />}
                />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                {/* <Route path="/pmMonthlyReport" element={<PmAllReportDashboard />} /> */}
                <Route
                  path="/pm/openAbnormalityTrack"
                  element={<OpenAbnormalityTrack />}
                />
                <Route
                  path="/pm/checksheetCreationDashboardForMTDTLandHOS"
                  element={<MTDTLandHOSChecksheetCreationDashboard />}
                />
                <Route
                  path="/pmSheetApprovalOfImplementationPhase"
                  element={<PMSheetApprovalOfImplementationPhase />}
                />
                <Route path="/pm/viewCheckSheet" element={<ViewChecksheet />} />
                <Route
                  path="/pm/backupDataOfCheckSheet"
                  element={<BackupDataOfCheckSheet />}
                />
                <Route
                  path="/pm/backupTableData"
                  element={<ShowBackupChecksheetTableData />}
                />

                <Route
                  path="/pm/summeryDashboard"
                  element={<SummeryDashboard />}
                />
                <Route path="/pm/skipedPMWorkData" element={<SkipPMWorkData />} />
                <Route path="/pm/logHistory" element={<LogHistory />} />
                <Route
                  path="/pm/pendingPMLogHistory"
                  element={<PendingPMLogHistory />}
                />

                <Route
                  path="/pm/spareReportDashboard"
                  element={<SpareReportMainDashboard />}
                />

                {/* approval dashboard */}
                <Route
                  path="/pm/preparationApproval"
                  element={<PreparationApprovalDashboard />}
                />
                <Route
                  path="/pm/planningApproval"
                  element={<PlanningApprovalDashboard />}
                />
                <Route
                  path="/pm/implementationApproval"
                  element={<ImplementationApprovalDashboard />}
                />

                {/* All reports routing */}
                <Route
                  path="/pm/machineWisePmMonthlyReport"
                  element={<MachineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/lineWisePmMonthlyReport"
                  element={<LineWisePmMonthlyReport />}
                />
                <Route
                  path="/pm/annualPMSchedule"
                  element={<AnnualPMSchedule />}
                />
                <Route path="/pm/annualPmStatus" element={<AnnualPmStatus />} />
                <Route
                  path="/pmTimeMonitoringReport"
                  element={<PmTimeMonitoringReport />}
                />
              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  }

  // <Footer/>
}

export default App;
