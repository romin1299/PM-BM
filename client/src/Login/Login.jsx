import { React, useState } from "../modules/LoginModules";
import "./Login.scss";
import Footer from "../components/Footer/Footer";
import LoginComponent from "./LoginSubComponent/LoginComponent";
import { useEffect } from "react";
import TabletLogin from "./LoginSubComponent/TabletLogin";

function getWindowWidth() {
  const { innerWidth } = window;
  return innerWidth;
}

export const LoginPage = () => {
  const [windowWidth, setWindowWidth] = useState(getWindowWidth());

  useEffect(() => {
    function handleWindowResize() {
      setWindowWidth(getWindowWidth());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <>
      <main className="mains">
        {/* {windowWidth} */}
        {windowWidth <= 820 ? <TabletLogin /> : <LoginComponent />}
      </main>
      <br />
      <br />
      <br />

      <Footer />
    </>
  );
};

export default LoginPage;
