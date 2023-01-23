import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  FaTimes,
  AddBoxIcon,
  PersonAddAltIcon,
  NoteAddIcon,
  MdOutlineLogout,
  AccountCircleIcon,
  DashboardIcon
} from "./ImportModules";

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

const Plant = ({ userData }) => {
  const { nav, setNav } = useContext(NavContext);
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
          {/* FIRST CATEGORY */}

          {/* <NavUrl url="/" icon={<AddBoxIcon />} description="Plant Creation" /> */}
          <NavUrl
            url="/"
            icon={<DashboardIcon style={{ color: "#ffffff" }} />}
            description="Dashboard"
          />
          <NavUrl
            url="/creationDashboard"
            icon={<NoteAddIcon style={{ color: "#ffffff" }}/>}
            description="Creation Dashboard"
          />
          <NavUrl
            url="/userAssign"
            icon={<PersonAddAltIcon style={{ color: "#ffffff" }}/>}
            description="User Assign"
          />
        </ul>

        <div className={styles.btn_logout}>
          <div class="navigation">
            <a class="button">
              <NavUrl
                url="/profile"
                icon={<AccountCircleIcon className="profileImages"  style={{ color: "#ffffff" }}/>}
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

export default Plant;
