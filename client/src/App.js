import "./App.css";
import { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Container from "./components/Container/Container";
import RightNavbar from "./components/RightNavbar/RightNavbar";
import NavContext from "./context/NavContext";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import RoutingContext from "./context/routing/RoutingContext";
import ContextAPI from "./context/ContextAPI/ContextAPI";
import Profile from "./pages/Profile";

import AdminCreationDashboard from "./pages/Admin/AdminCreationDashboard";
// import CheckSheet from "./pages/Dashboard/CheckSheet";

// plant dashboard

import PlantCreation from "./pages/Plant/PlantCreation";
import SectionPage from "./pages/Plant/SectionPage";
import CreationDashboardForPlant from "./pages/Plant/CreationDashboardForPlant";
import UserAssign from "./pages/Plant/UserAssign";

//Section Dashboard
import SectionDashboard from "./pages/Section/SectionDashboard";
import OperatorDashboard from "./pages/Operator/OperatorDashboard";
import UserAssignSection from "./pages/Section/UserAssignSection";
import CreationDashboardForSection from "./pages/Section/CreationDashboardForSection";
import CheckSheetDashboard from "./pages/Section/CheckSheetDashboard";
import ChecksheetCreationDashboard from "./pages/Section/Checksheet/ChecksheetCreationDashboard";
import CheckSheetForm from "./pages/Section/Checksheet/ChecksheetForm";
import CheckSheetApprovalDashboardForTL from "./pages/Section/Checksheet/ChecksheetApprovalDashboardForTL";
import CheckSheetApprovalDashboardForHOS from "./pages/Section/Checksheet/ChecksheetApprovalDashboardForHOS";
import ChecksheetFormApprovalForHOS from "./pages/Section/Checksheet/ChecksheetFormApprovalForHOS";
import ChecksheetFormApprovalForTL from "./pages/Section/Checksheet/ChecksheetFormApprovalForTL";
import BackupDataOfCheckSheet from "./pages/Section/Checksheet/BackupDataOfCheckSheet";
import ShowBackupChecksheetTableData from "./pages/Section/Checksheet/ShowBackupChecksheetTableData";

//TL dashboard For Planning phase
import PlanningPhaseTable from "./pages/Section/Checksheet/Planning/PlanningPhaseTable";
import PMSheetApproval from "./pages/Section/Checksheet/PMSheetApproval";
import PmAllReportDashboard from "./pages/Reports/PmAllReportDashboard";
import OpenAbnormalityTrack from "./pages/Reports/OpenAbnormalityTracking"
import MTDTLandHOSChecksheetCreationDashboard from "./pages/Section/Checksheet/MTDTLandHOSChecksheetCreationDashboard";
import CreationDashboardForTLHOSS from "./pages/MTD_TL_HOSS/CreationDashboardForTLHOSS";
import UserAssignTLHOSS from "./pages/MTD_TL_HOSS/UserAssignTLHOSS";
//for Operator
import CheckSheetForImplementation from "./pages/Operator/CheckSheetForImplementation"
import SkipPMWorkData from "./pages/Reports/SkipPMWorkData";
import CheckSheet from "./pages/Dashboard/CheckSheet";

//implementation approval flow
import PMSheetApprovalOfImplementationPhase from "./pages/Section/Checksheet/PMSheetApprovalOfImplementationPhase";


//Common Pages

import SummeryDashboard from "./pages/Dashboard/SummeryDashboard/SummeryDashboard";

import ViewChecksheet from "./pages/Section/Checksheet/ViewChecksheet";

import LogHistory from "./pages/Reports/LogHistory";

import PendingPMLogHistory from "./pages/Reports/PendingPMLogHistory";

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
                <Route path="/adminDashboard" element={<AdminDashboard />} />
                <Route path="/" element={<AdminCreationDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/summeryDashboard" element={<SummeryDashboard />} />

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
                <Route path="/" element={<OperatorDashboard />} />
                <Route path="/creationDashboard" element={<CreationDashboardForPlant />} />
                <Route path="/section" element={<SectionPage />} />
                <Route path="/userAssign" element={<UserAssign />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route path="/summeryDashboard" element={<SummeryDashboard />} />
                <Route path="/logHistory" element={<LogHistory />} />
                <Route path="/pendingPMLogHistory" element={<PendingPMLogHistory />} />


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
                <Route path="/" element={<OperatorDashboard />} />
                <Route path="/creationDashboard" element={<CreationDashboardForSection />} />
                <Route path="/userAssign" element={<UserAssignSection />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/approvalDashboard" element={<CheckSheetApprovalDashboardForHOS />} />
                <Route path="/checksheetFormApproval" element={<ChecksheetFormApprovalForHOS />} />
                <Route path="/checksheetCreationDashboard" element={<ChecksheetCreationDashboard />} />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                <Route path="/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route path="/checksheetCreationDashboardForMTDTLandHOS" element={<MTDTLandHOSChecksheetCreationDashboard />} />
                <Route path="/pmMonthlyReport" element={<PmAllReportDashboard />} />
                <Route path="/pmSheetApprovalOfImplementationPhase" element={<PMSheetApprovalOfImplementationPhase />} />
                <Route path="/viewCheckSheet" element={<ViewChecksheet />} />
                <Route path="/summeryDashboard" element={<SummeryDashboard />} />
                <Route path="/logHistory" element={<LogHistory />} />
                <Route path="/pendingPMLogHistory" element={<PendingPMLogHistory />} />

                {/* <Route path="/checkSheet" element={<CheckSheet />} /> */}


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
                <Route path="/" element={<OperatorDashboard />} />
                <Route path="/machineWiseCheckSheetForImplemetation" element={<CheckSheetForImplementation />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pmMonthlyReport" element={<PmAllReportDashboard />} />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                <Route path="/pmSheetApprovalOfImplementationPhase" element={<PMSheetApprovalOfImplementationPhase />} />
                <Route path="/summeryDashboard" element={<SummeryDashboard />} />
                <Route path="/viewCheckSheet" element={<ViewChecksheet />} />
                <Route path="/logHistory" element={<LogHistory />} />
                <Route path="/pendingPMLogHistory" element={<PendingPMLogHistory />} />
                <Route path="/skipedPMWorkData" element={<SkipPMWorkData />} />

                {/* <Route path="/checkSheetDashboard" element={<CheckSheetDashboard />} />
                <Route path="/checksheetCreationDashboard" element={<ChecksheetCreationDashboard />} />
                <Route path="/checkSheetForm" element={<CheckSheetForm />} /> */}

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


                <Route path="/" element={<OperatorDashboard />} />
                <Route path="/creationDashboard" element={<CreationDashboardForTLHOSS />} />
                <Route path="/userAssign" element={<UserAssignTLHOSS />} />
                <Route path="/machineWiseCheckSheet" element={<CheckSheet />} />
                <Route path="/profile" element={<Profile />} />
                {context.tm_department === "MTD" ?
                  <Route path="/checkSheetDashboard" element={<CheckSheetDashboard />} />
                  :
                  ""
                }
                <Route path="/checksheetCreationDashboard" element={<ChecksheetCreationDashboard />} />
                <Route path="/checkSheetForm" element={<CheckSheetForm />} />
                <Route path="/approvalDashboard" element={<CheckSheetApprovalDashboardForTL />} />
                <Route path="/checksheetFormApproval" element={<ChecksheetFormApprovalForTL />} />
                <Route path="/planningPhaseTable" element={<PlanningPhaseTable />} />
                <Route path="/pmSheetApproval" element={<PMSheetApproval />} />
                <Route path="/pmMonthlyReport" element={<PmAllReportDashboard />} />
                <Route path="/openAbnormalityTrack" element={<OpenAbnormalityTrack />} />
                <Route path="/checksheetCreationDashboardForMTDTLandHOS" element={<MTDTLandHOSChecksheetCreationDashboard />} />
                <Route path="/pmSheetApprovalOfImplementationPhase" element={<PMSheetApprovalOfImplementationPhase />} />
                <Route path="/viewCheckSheet" element={<ViewChecksheet />} />
                <Route path="/backupDataOfCheckSheet" element={<BackupDataOfCheckSheet />} />
                <Route path="/backupTableData" element={<ShowBackupChecksheetTableData />} />

                <Route path="/summeryDashboard" element={<SummeryDashboard />} />
                <Route path="/skipedPMWorkData" element={<SkipPMWorkData />} />
                <Route path="/logHistory" element={<LogHistory />} />
                <Route path="/pendingPMLogHistory" element={<PendingPMLogHistory />} />



              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  }

}

export default App;
