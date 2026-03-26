import { React, useState } from "../modules/LoginModules";
import "./Login.scss";
import Footer from "../components/Footer/Footer";
import { useEffect } from "react";
import TabletLogin from "./LoginSubComponent/TabletLogin";
import LoginCard from "./LoginSubComponent/LoginCard";

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
        <div className="containers">
          <div
            className="wrappers"
            style={{ maxWidth: "350px", padding: "20px" }}
          >
            {windowWidth <= 820 ? (
              <TabletLogin />
            ) : (
              <LoginCard windowWidth={windowWidth} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LoginPage;
