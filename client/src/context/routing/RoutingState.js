import React, { useEffect, useState } from "react";
import RoutingContext from "./RoutingContext";
import { Navigate } from "react-router-dom";
import denso_log from "../../static/images/denso_logo.png";

const RoutingState = (props) => {
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const isCurrentUser = async () => {
    setIsLoading(true);
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

      setUserData(data);

      if (res.status === 400 || res.status === 422 || !data) {
        res.status(422).send("Data not recieved !!!");
      }
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    isCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="animationScreen">
        <div className="ring">
          <img className="ringImg" src={denso_log} alt="" />
        </div>
      </div>
    );
  } else if (!userData?.tm_no) {
    return <Navigate to="/loginPage" replace />;
  }

  return (
    <RoutingContext.Provider value={userData}>
      {props.children}
    </RoutingContext.Provider>
  );
};

export default RoutingState;
