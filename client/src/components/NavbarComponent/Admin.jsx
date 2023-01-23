import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  FaTimes,
  DashboardIcon,
  AccountCircleIcon,
  // RoutingContext,
  NoteAddIcon,
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

const Admin = ({ userData }) => {
  const { nav, setNav } = useContext(NavContext);
  // const context = useContext(RoutingContext);
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
            icon={<NoteAddIcon style={{ color: "#ffffff" }}/>}
            description="Creation Dashboard"
          />
          <NavUrl
            url="/adminDashboard"
            icon={<DashboardIcon style={{ color: "#ffffff" }}/>}
            description="Admin Dashboard"
          />
        </ul>
        <div className={styles.btn_logout}>
          <div class="navigation">
            <a class="button">
              {/* <img
                className="profileImages"
                src="https://pbs.twimg.com/profile_images/378800000639740507/fc0aaad744734cd1dbc8aeb3d51f8729_400x400.jpeg"
              /> */}

              <NavUrl
                url="/profile"
                icon={<AccountCircleIcon className="profileImages"  style={{ color: "#ffffff" }}/>}
                description={userData}
              />
              {/* <div class="logout">{context.user_type}</div> */}
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

export default Admin;
