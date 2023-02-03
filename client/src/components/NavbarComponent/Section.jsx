import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  FaTimes,
  PersonAddAltIcon,
  DashboardIcon,
  AccountCircleIcon,
  NoteAddIcon,
  AddTaskIcon,
  FactCheckIcon,
} from "./ImportModules";

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
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import BackupTableIcon from "@mui/icons-material/BackupTable";

const NavUrl = ({ url, icon, description }) => {
  const { nav, setNav } = useContext(NavContext);
  const checkWindowSize = () => {
    if (window.innerWidth < 1024) setNav(!nav);
  };
  return (
    <li className={styles.li_navlink}>
      <NavLink
        to={`${url}`}
        className={({ isActive }) => (isActive ? styles.active : undefined)}
        onClick={() => checkWindowSize()}
      >
        {icon}
        <span className={styles.description}>{description}</span>
      </NavLink>
    </li>
  );
};

const Section = ({ userData }) => {
  const { nav, setNav } = useContext(NavContext);
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };
  return (
    <div
      className={`${styles.navbar_container} ${
        nav ? styles.navbar_mobile_active : undefined
      }`}
    >
      <nav
        className={
          // nav ? undefined : styles.nav_small

          //if window size < 1024px than user (nav? undefined : styles.nav_small) else (nav? styles.nav_small: undefined)
          // window.innerWidth < 1024
          //   ? nav
          //     ? undefined
          //     : styles.nav_small
          //   : nav
          //   ? styles.nav_small
          //   : undefined

          nav ? undefined : styles.nav_small
        }
      >
        {/* LOGO */}
        <div className="bg-white">
          <div className={styles.logo}>
            {/* <VscDashboard  /> */}
            <img className={styles.logo_icon} src={denso_logo} alt="" />
            <FaTimes
              className={styles.mobile_cancel_icon}
              onClick={() => {
                setNav(!nav);
              }}
            />
          </div>
        </div>
        {/* MENU */}
        <ul className={styles.menu_container}>
          <NavUrl
            url="/"
            icon={<DashboardIcon style={{ color: "#ffffff" }} />}
            description="Dashboard"
          />
          <NavUrl
            url="/creationDashboard"
            icon={<NoteAddIcon style={{ color: "#ffffff" }} />}
            description="Creation Dashboard"
          />
          <NavUrl
            url="/userAssign"
            icon={<PersonAddAltIcon style={{ color: "#ffffff" }} />}
            description="User Assign"
          />

          <List sx={{ width: "100%", maxWidth: 400 }} component="nav">
            <ListItemButton onClick={handleClick}>
              <ListItemIcon>
                <AddTaskIcon style={{ color: "#ffffff" }} />
              </ListItemIcon>
              <ListItemText
                primary="Approval Dashboards"
                style={{ fontWeight: "550", color: "#ffffff" }}
              />
              {open ? (
                <ExpandLess style={{ color: "#ffffff" }} />
              ) : (
                <ExpandMore style={{ color: "#ffffff" }} />
              )}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/preparationApproval"
                    icon={<AssignmentIcon style={{ color: "#ffffff" }} />}
                    description="Preparation Approval"
                  />
                </ListItemButton>
              </List>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/planningApproval"
                    icon={<CreditScoreIcon style={{ color: "#ffffff" }} />}
                    description="Planning Approval"
                  />
                </ListItemButton>
              </List>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/implementationApproval"
                    icon={<AssignmentIcon style={{ color: "#ffffff" }} />}
                    description="Implementation Approval"
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </List>

          {/* <NavUrl
            url="/approvalDashboard"
            icon={<AddTaskIcon style={{ color: "#ffffff" }} />}
            description="Approval Dashboard"
          /> */}
          <NavUrl
            url="/pmSheetApproval"
            icon={<FactCheckIcon style={{ color: "#ffffff" }} />}
            description="PM Sheet Approval"
          />
          <NavUrl
            url="/backupDataOfCheckSheet"
            icon={<CloudDownloadIcon style={{ color: "#ffffff" }} />}
            description="Back-end Data"
          />
          <NavUrl
            url="/pmSheetApprovalOfImplementationPhase"
            icon={<AssignmentTurnedInIcon style={{ color: "#ffffff" }} />}
            description="PM Plan vs Actual Approval"
          />
          <NavUrl
            url="/sparePartUsageHistory"
            icon={<BackupTableIcon style={{ color: "#ffffff" }} />}
            description="Spare Part Usage History"
          />
          <List sx={{ width: "100%", maxWidth: 360 }} component="nav">
            <ListItemButton onClick={handleClick}>
              <ListItemIcon>
                <SummarizeIcon style={{ color: "#ffffff" }} />
              </ListItemIcon>
              <ListItemText
                primary="Reports"
                style={{ fontWeight: "550", color: "#ffffff" }}
              />
              {open ? (
                <ExpandLess style={{ color: "#ffffff" }} />
              ) : (
                <ExpandMore style={{ color: "#ffffff" }} />
              )}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/pmMonthlyReport"
                    icon={<AssignmentIcon style={{ color: "#ffffff" }} />}
                    description="PM Report"
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </ul>
        <div className={styles.btn_logout}>
          <div class="navigation">
            <a class="button">
              <NavUrl
                url="/profile"
                icon={
                  <AccountCircleIcon
                    className="profileImages"
                    style={{ color: "#ffffff" }}
                  />
                }
                description={userData}
              />
            </a>
          </div>
        </div>
      </nav>

      <div
        className={nav ? styles.mobile_nav_background_active : undefined}
        onClick={() => {
          setNav(!nav);
        }}
      ></div>
    </div>
  );
};

export default Section;
