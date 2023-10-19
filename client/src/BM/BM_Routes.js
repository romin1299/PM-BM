import { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Container from "../components/Container/Container";
import RightNavbar from "../components/RightNavbar/RightNavbar";
import NavContext from "../context/NavContext";
import AdminDashboard from "../pages/Admin/AdminDashboard";

import RoutingContext from "../context/routing/RoutingContext";
import Profile from "../pages/Profile";

import AdminCreationDashboard from "../pages/Admin/AdminCreationDashboard";
import OperatorDashboard from "../pages/Operator/OperatorDashboard";
import SummeryDashboard from "../pages/Dashboard/SummeryDashboard/SummeryDashboard";
import BMSidebar from "./BMSidebar/BMSidebar";
import RequestSheet from "./Tabs/RequestSheet/MainRequestSheet";
import RequestSheetMainDashboard from "./RequestSheet/RequestSheetMainDashboard";
import GenerateRequestSheetMainDashboard from "./RequestSheet/GenerateRequestSheetMainDashboard";

// Define an array of routes for each user type
const userRoutes = [
  {
    user_type: "Admin",
    routes: [
      { path: "/bm/adminDashboard", element: <AdminDashboard /> },
      { path: "/bm", element: <AdminCreationDashboard /> },
      { path: "/bm/profile", element: <Profile /> },
      { path: "/bm/summeryDashboard", element: <SummeryDashboard /> },
    ],
  },
  {
    user_type: "Plant-Admin",
    routes: [
      { path: "/bm", element: <OperatorDashboard /> },
      { path: "/bm/summeryDashboard", element: <h1>Summary</h1> },
      { path: "/bm/check-sheet", element: <RequestSheet /> },
    ],
  },
  {
    user_type: "Section-Admin",
    routes: [{ path: "/bm", element: <OperatorDashboard /> }],
  },
  {
    user_type: "Operator",
    routes: [{ path: "/bm", element: <OperatorDashboard /> }],
  },
  {
    user_type: "TL/HOSS",
    routes: [
      { path: "/bm", element: <h1>Home Dashboard</h1> },
      { path: "/bm/summeryDashboard", element: <h1>Summary</h1> },
      { path: "/bm/userAssign", element: <h1>Users</h1> },
      { path: "/bm/check-sheet/:generateType/:machine_code", element: <RequestSheet /> },
      {
        path: "/bm/requestListDashboard",
        element: <RequestSheetMainDashboard />,
      },
      {
        path: "/bm/generateRequestSheetMainDashboard",
        element: <GenerateRequestSheetMainDashboard />,
      },
    ],
  },
];

function BM_Routes() {
  const [nav, setNav] = useState(false);
  const value = { nav, setNav };

  const context = useContext(RoutingContext);
  // console.log("context:", context);

  const filteredRoutes = userRoutes?.find(
    (userRoute) => userRoute?.user_type === context?.user_type
  );

  return (
    <div className="App">
      <NavContext.Provider value={value}>
        <BMSidebar userData={context} />

        {/* Render main container based on the user's routes */}
        <Container
          stickyNav={<RightNavbar />}
          content={
            <Routes>
              {filteredRoutes?.routes?.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Routes>
          }
        />
      </NavContext.Provider>
    </div>
  );
}

export default BM_Routes;
