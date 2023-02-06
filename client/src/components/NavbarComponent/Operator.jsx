import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  halflogo,
  FaTimes,
  AccountCircleIcon,
  DashboardIcon,
  NoteAddIcon,
} from "./ImportModules";

import {
  FiArrowLeftCircle,
  FiArrowRightCircle,
} from "react-icons/fi";
import LogoutIcon from "@mui/icons-material/Logout";
import Logout from "../../Integration/Logout/Logout";
import { useNavigate } from "react-router-dom";

import { useState } from "react";

import {
  Menu,
  MenuItem,
  ProSidebar,
  SidebarHeader,
  SubMenu,
  SidebarFooter,
  SidebarContent,
} from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import styled from "styled-components";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BackupTableIcon from "@mui/icons-material/BackupTable";


const Menuitem = styled(MenuItem)`
  :hover {
    background-color: white;
    padding: 5px;
    color: black;
    // border-radius: 10px;
    // margin:10px;
  }
`;


const Operator = ({ userData }) => {
  const [open, setOpen] = React.useState(true);
  const [menuCollapse, setMenuCollapse] = useState(true);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const styles = {
    sideBarHeight: {
      height: "100vh",
    },
    menuIcon: {
      float: "left",
      marginBottom: "1rem",
      marginLeft: "1.5rem",
    },
    bg: {
      background: "#004B5B",
    },
  };
  const onClickMenuIcon = () => {
    // setCollapsed(!collapsed);
    menuCollapse ? setMenuCollapse(false) : setMenuCollapse(true);
  };

  const loggedOut = () => {
    navigate("/");
    setTimeout(() => {
      window.location.reload(false);
    }, 100);
  };
  return (
    <ProSidebar style={styles.sideBarHeight} collapsed={menuCollapse}>
      <div style={styles.bg}>
        {/* <div className="d-flex align-items-center justify-content-center m-2">
          <img src={denso_logo} alt="" style={{ width: "60px" }} />
        </div> */}
        <div>
          <SidebarHeader>
            <div className="logotext">
              {/* small and big change using menucollapse state */}
              <p className="d-flex align-items-center justify-content-center m-2 sticky-top">
                {menuCollapse ? (
                  <img
                    src={halflogo}
                    alt=""
                    style={{ width: "50%", padding: "5px" }}
                    className="bg-white"
                    
                  />
                ) : (
                  <img
                    src={denso_logo}
                    alt=""
                    style={{ width: "50%" }}
                    className="bg-white"
                  />
                )}
              </p>
            </div>
            <div
              className="closemenu"
              onClick={onClickMenuIcon}
              style={styles.menuIcon}
            >
              {/* changing menu collapse icon on click */}
              {menuCollapse ? (
                <FiArrowRightCircle className="text-white h4 mt-2" />
              ) : (
                <FiArrowLeftCircle className="text-white h4 mt-2" />
              )}
            </div>
            {/* <div style={styles.menuIcon} onClick={onClickMenuIcon}>
              <MenuIcon className="text-white" style={{ fontSize: "1.5rem" }} />
            </div> */}
          </SidebarHeader>
        </div>
      </div>
      <SidebarContent>
        <Menu iconShape="square" style={styles.bg}>
          <Menuitem
            className="text-white"
            data-toggle="tooltip"
            data-placement="right"
            title="Dashboard"
            icon={<DashboardIcon className="text-white" />}
          >
            <NavLink to="/"></NavLink> Dashboard
          </Menuitem>
          <Menuitem
            className="text-white"
            data-toggle="tooltip"
            data-placement="right"
            title="PM Plan vs Actual Approval"
            icon={<AssignmentTurnedInIcon className="text-white" />}
          >
            <NavLink to="/pmSheetApprovalOfImplementationPhase"></NavLink> PM Plan vs Actual Approval
          </Menuitem>
          <Menuitem
            className="text-white"
            data-toggle="tooltip"
            data-placement="right"
            title="Spare Part Usage History"
            icon={<BackupTableIcon className="text-white" />}
          >
            <NavLink to="/sparePartUsageHistory"></NavLink> Spare Part Usage History
          </Menuitem>
            <SubMenu
              className="text-white"
              title="Reports"
              icon={<SummarizeIcon className="text-white" />}
            >
              <Menuitem
                className="text-white"
                icon={
                  <NoteAddIcon
                    className="text-white"
                    style={{
                      background: "#004B5B",
                      borderRadius: "3px",
                      padding: "2px",
                    }}
                  />
                }
              >
                <NavLink to="/pmMonthlyReport"></NavLink>
                PM Report
              </Menuitem>
              
            </SubMenu>
        

        </Menu>
      </SidebarContent>
      <SidebarFooter fixed="bottom">
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={<LogoutIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Logout"
            onClick={() =>
              Logout(userData).then((res) => {
                if (res) {
                  loggedOut();
                }
              })
            }
          >
            {" "}
            Logout{" "}
          </MenuItem>
        </Menu>
      </SidebarFooter>
    </ProSidebar>
  );
};

export default Operator;
