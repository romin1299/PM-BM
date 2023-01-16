import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  FaTimes,
  AccountCircleIcon,
  PersonAddAltIcon,
  DashboardIcon,
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
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
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

const TL = ({ userData, userDepartment }) => {
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
          nav ? undefined : styles.nav_small
        }
      >
        {/* LOGO */}
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

        {/* MENU */}
        <ul className={styles.menu_container}>
          {/* FIRST CATEGORY */}

          <NavUrl
            url="/"
            icon={<DashboardIcon style={{ color: "#E71E25" }} />}
            description="Dashboard"
          />

          {userDepartment === "MTD" ? (
            <>
              <NavUrl
                url="/creationDashboard"
                icon={<NoteAddIcon style={{ color: "#E71E25" }} />}
                description="Creation Dashboard"
              />
              <NavUrl
                url="/userAssign"
                icon={<PersonAddAltIcon style={{ color: "#E71E25" }} />}
                description="User Assign"
              />
              <NavUrl
                url="/checkSheetDashboard"
                icon={<NoteAddIcon style={{ color: "#E71E25" }} />}
                description="CheckSheet Dashboard"
              />
            </>
          ) : (
            ""
          )}

          <NavUrl
            url="/approvalDashboard"
            icon={<AddTaskIcon style={{ color: "#E71E25" }} />}
            description="Approval Dashboard"
          />
          <NavUrl
            url="/pmSheetApproval"
            icon={<FactCheckIcon style={{ color: "#E71E25" }} />}
            description="PM Sheet Approval"
          />
          <NavUrl
            url="/pmSheetApprovalOfImplementationPhase"
            icon={<AssignmentTurnedInIcon style={{ color: "#E71E25" }} />}
            description="PM Plan vs Actual Approval"
          />
          <NavUrl
            url="/backupDataOfCheckSheet"
            icon={<CloudDownloadIcon style={{ color: "#E71E25" }} />}
            description="Back-end Data"
          />
          <NavUrl
            url="/logHistory"
            icon={<LibraryBooksIcon style={{ color: "#E71E25" }} />}
            description="Log History"
          />
          <NavUrl
            url="/pendingPMLogHistory"
            icon={<PendingActionsIcon style={{ color: "#E71E25" }} />}
            description="Pending PM Log History"
          />
          {userDepartment === "MTD" ? (
            <>
              <NavUrl
                url="/operatorDataEntry"
                icon={<NoteAddIcon style={{ color: "#E71E25" }} />}
                description="Operator Data Entry"
              />
              <NavUrl
                url="/sparePartUsageHistory"
                icon={<BackupTableIcon style={{ color: "#E71E25" }} />}
                description="Spare Part Usage History"
              />
            </>
          ) : (
            ""
          )}
          <List
            sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
            component="nav"
          >
            <ListItemButton onClick={handleClick}>
              <ListItemIcon>
                <SummarizeIcon style={{ color: "#E71E25" }} />
              </ListItemIcon>
              <ListItemText primary="Reports" style={{ fontWeight: "550" }} />
              {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/pmMonthlyReport"
                    icon={<AssignmentIcon style={{ color: "#E71E25" }} />}
                    description="PM Report"
                  />
                </ListItemButton>
              </List>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 3 }}>
                  <NavUrl
                    url="/openAbnormalityTrack"
                    icon={<CreditScoreIcon style={{ color: "#E71E25" }} />}
                    description="Open Abnormality Tracking"
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </ul>
        <div className={styles.btn_logout}>
          <div class="navigation">
            <NavUrl
              url="/profile"
              icon={
                <AccountCircleIcon
                  className="profileImages"
                  style={{ color: "#E71E25" }}
                />
              }
              description={userData}
            />
            {/* <div class="logout">{context.user_type}</div> */}
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

export default TL;
