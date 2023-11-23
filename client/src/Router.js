import React from "react";
import { Routes, Route } from "react-router-dom";
// import UpdatePassword from './pages/Login/UpdatePassword';
import App from "./App";
import LoginPage from "./Login/Login";
import CreateNewPassword from "./Login/CreateNewPassword";
import PropagateLoader from "react-spinners/PropagateLoader";
import denso_log from "./static/images/denso_logo.png";
import ResetPasswordPage from "./Login/ResetPasswordPage";
import UpdatePassword from "./Login/UpdatePassword";
import Footer from "./components/Footer/Footer";

import Scanning from "./ScanningComponent/Scanning";
import SheetDashboard from "./ScanningComponent/SheetDashboard";
import QR_codeReader from "./BM/QR_codeReader/QR_codeReader";
import LoginAfterQrScanned from "./Login/LoginSubComponent/LoginAfterQrScanned";

import RoutingState from "./context/routing/RoutingState";
import { ToastContainer } from "react-toastify";

function Router() {
  return (
    <>
    <ToastContainer />
      <Routes>
        <Route
          path="/*"
          element={
            <RoutingState>
              <App />
            </RoutingState>
          }
        />
        <Route path="/loginPage" element={<LoginPage />} />
        <Route path="/ResetPassword/:token" element={<CreateNewPassword />} />
        <Route path="/resetPasswordPage" element={<ResetPasswordPage />} />
        <Route path="/updatePassword" element={<UpdatePassword />} />
        <Route path="/machine-scan-page" element={<Scanning />} />
        <Route
          path="/machine-scan/:sheetType/:machineCode"
          element={<SheetDashboard />}
        />
        <Route path="/BM/qr-scanning" element={<QR_codeReader />}></Route>
        <Route
          path="/loginAfterScanned/:machineId"
          element={<LoginAfterQrScanned />}
        ></Route>
      </Routes>
    </>
  );
}

export default Router;
