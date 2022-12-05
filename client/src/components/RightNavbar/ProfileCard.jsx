import { React, useContext } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import "../../SCSS/ProfileCard.scss";

import LogoutIcon from "@mui/icons-material/Logout";

import { useNavigate } from "react-router-dom";
import RoutingContext from "../../context/routing/RoutingContext";
// import { replace } from "formik";

const ProfileCard = () => {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  //display username on profile pop-up

  const clearTokens = async () => {
    try {
      const res = await fetch("/clearTokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tm_no: context.tm_no,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("Data post");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch("/logout", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.status === 400 || res.status === 422) {
        return res.status(422).send("Data not recieved !!!");
      }
      // console.log("cheking end point !!!");
      clearTokens();
      navigate("/", { replace: true });
      refreshPage();
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
  };

  function refreshPage() {
    setTimeout(() => {
      window.location.reload(false);
    }, 100);
  }

  return (
    <>
      {/* <div className="header">
        <div className="ems_logo"></div>
        <div className="sections">
          <div className="profile">
            <AccountCircleIcon style={{ fontSize: "2rem" }} />
            <div id="profile_card">
              <h5>{context.user_type}</h5>
              <p>{context.email}</p>
              <a href="/updatePassword">
                <button
                  className="updatePassBtn"
                  size="sm"
                  // style={{ marginLeft: "-0.5rem" }}
                >
                  Update password
                </button>
              </a>
              <br />
              <button onClick={logout} className="updatePassBtn">
                <LogoutIcon
                  fontSize="small"
                  style={{
                    marginLeft: "0rem",
                    textAlign: "left",
                    color: "black",
                  }}
                />
                Logout
              </button>

              <div></div>
            </div>
          </div>
        </div>
      </div> */}
    </>
  );
};

export default ProfileCard;
