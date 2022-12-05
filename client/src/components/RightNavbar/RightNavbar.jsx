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
    <div
      className={styles.container}
      style={{
        backgroundColor:
          context.user_type === "Operator" ? "#F5F7FA" : "#fafafa",
      }}
    >
      {/* BURGER */}
      <div
        className={styles.burger_container}
        onClick={() => {
          setNav(!nav);
        }}
      >
        <MdOutlineMenu />
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <LogoutIcon onClick={logout} />
      </div>
    </div>
  );
};

export default RightNavbar;
