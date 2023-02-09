import React, { useState, useEffect } from "react";
//STYLES
import styles from "./RightNavbar.module.scss";
//HOOKS
import { useContext } from "react";
//CONTEXT
import NavContext from "../../context/NavContext";
//ICONS , IMAGES
import { MdOutlineMenu } from "react-icons/md";
//Components
import ProfileCard from "./ProfileCard";
import LogoutIcon from "@mui/icons-material/Logout";
import RoutingContext from "../../context/routing/RoutingContext";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import axios from "axios";
import { Row, Col } from 'react-bootstrap'
import userImg from "../../images/user.png";
const RightNavbar = () => {
  const { nav, setNav } = useContext(NavContext);
  const context = useContext(RoutingContext);
  const navigate = useNavigate();
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
        navigate("/", { replace: true });
        console.log("Data post");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const [tm_name, setTm_name] = useState("");
  const [userPhoto, setUserPhoto] = useState([]);
  const updateProfile = async (e) => {
    e.preventDefault();
    // console.log(userData.photo);
    // console.log(userPhoto);
    // console.log(userPhoto.length);
    const tm_no = context.tm_no;
    const tm_Name = tm_name === "" ? context.tm_name : tm_name;
    const Pic = userPhoto.length === 0 ? context.photo : userPhoto;
    // console.log(tm_no);
    // console.log(tm_Name);
    // console.log(Pic);
    // window.location.reload();
    // console.log(tm_name);
    const formData = new FormData();
    formData.append("photo", Pic);
    formData.append("tm_name", tm_Name);
    formData.append("tm_no", tm_no);
    // console.log(formData);
    axios
      .post("/updateUserProfile", formData)
      .then((res) => {
        console.log(res);
        window.location.reload();
      })
      .catch((err) => {
        window.alert("Only .png, .jpg and .jpeg format allowed!");
        console.log(err);
      });
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
    <div
      className={styles.container}
      style={{
        backgroundColor:
          context.user_type === "Operator" ? "#F5F7FA" : "#FAFAFA",
      }}
    >
      {/* BURGER */}
      {/* <div
        className={styles.burger_container}
        onClick={() => {
          setNav(!nav);
        }}
      >
        <MdOutlineMenu />
      </div> */}
      {/* ACTIONS */}
      <div className={styles.actions}>
        <div className="mb-1">
          <b style={{ fontSize: "12px" }}>{context.tm_name}({context.tm_no})</b> &nbsp;
          <img className="p_img1"
            name="userPhoto" alt="" src={context.photo == undefined ? userImg : context.photo} onClick={() => navigate('/profile')} />
        </div>
      </div>
      {/* <div className={styles.actions}>
        <LogoutIcon onClick={logout} />
      </div> */}
    </div>
  );
};
export default RightNavbar;