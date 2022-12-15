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

//TL dashboard For Planning phase
import PlanningPhaseTable from "./pages/Section/Checksheet/Planning/PlanningPhaseTable";
import PMSheetApproval from "./pages/Section/Checksheet/PMSheetApproval";
import PmAllReportDashboard from "./pages/Reports/PmAllReportDashboard";
import OpenAbnormalityTrack from "./pages/Reports/OpenAbnormalityTracking"
import MTDTLandHOSChecksheetCreationDashboard from "./pages/Section/Checksheet/MTDTLandHOSChecksheetCreationDashboard";
//for Operator
import CheckSheetForImplementation from "./pages/Operator/CheckSheetForImplementation"

import CheckSheet from "./pages/Dashboard/CheckSheet";

//implementation approval flow
import PMSheetApprovalOfImplementationPhase from "./pages/Section/Checksheet/PMSheetApprovalOfImplementationPhase";

import ViewChecksheet from "./pages/Section/Checksheet/ViewChecksheet";

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



              </Routes>
            }
          />
        </NavContext.Provider>
      </div>
    );
  }

}

export default App;
