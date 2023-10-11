import React, { useEffect, useState, useContext } from "react";
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

function Router() {
  const [auth, setauth] = useState();
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      {/* <MainPage /> */}

      {isLoading ? (
        <div className="animationScreen">
          <div class="ring">
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
        </Routes>
      )}
    </>
  );
}

export default Router;
