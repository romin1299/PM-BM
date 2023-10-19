import React, { useEffect, useState, useContext } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
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

function Router() {
  const [auth, setauth] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // Get the navigation function

  const isCurrentUser = async () => {
    try {
      const res = await fetch("/loggedUserDetails", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data);
      setauth(data);

      if (res.status === 400 || res.status === 422 || !data) {
        return res.status(422).send("Data not recieved !!!");
      }
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    isCurrentUser();
    // setIsLoading(true)
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 1500);
  }, []);

  // Check if the path is empty
  if (window.location.pathname === "/") {
    navigate("/bm");
    return null;
  }

  return (
    <>
      {/* <MainPage /> */}

      {isLoading ? (
        <div className="animationScreen">
          <div className="ring">
            <img className="ringImg" src={denso_log} alt="" />
          </div>
        </div>
      ) : (
        <Routes>
          <Route
            path="/*"
            element={auth === undefined ? <LoginPage /> : <App />}
          />
          <Route path="/ResetPassword/:token" element={<CreateNewPassword />} />
          <Route path="/resetPasswordPage" element={<ResetPasswordPage />} />
          <Route path="/updatePassword" element={<UpdatePassword />} />
          <Route path="/machine-scan-page" element={<Scanning />} />
          <Route
            path="/machine-scan/:sheetType/:machineCode"
            element={<SheetDashboard />}
          />
          <Route path="/BM/qr-scanning" element={<QR_codeReader/>} ></Route>
          <Route path="/loginAfterScanned/:machineId" element={<LoginAfterQrScanned/>} ></Route>

        </Routes>
      )}
    </>
  );
}

export default Router;
