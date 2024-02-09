import React, { useState } from "react";
import {
  ProSidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
} from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import { NavLink, useNavigate } from "react-router-dom";
import Logout from "../../Integration/Logout/Logout";
import { FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";
import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import LogoutIcon from "@mui/icons-material/Logout";
import { denso_logo } from "../../components/NavbarComponent/ImportModules";
import { menuItems } from "./menuItems";
// import '../../components/Navbar/Navbar.css'
// import '../../components/Navbar/Navbar.module.scss'

const BMSidebar = ({ userData, filteredItems }) => {
  const [menuCollapse, setMenuCollapse] = useState(true);
  const navigate = useNavigate();

  // // Inside the BMSidebar component, after defining the menuItems array
  // const filteredItems = filteredMenuItems(
  //   menuItems,
  //   userData.user_type,
  //   userData.tm_department
  // );

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
    setMenuCollapse(!menuCollapse);
  };

  const loggedOut = () => {
    localStorage.clear();
    navigate("/");
    setTimeout(() => {
      window.location.reload(false);
    }, 100);
  };

  return (
    <ProSidebar style={styles.sideBarHeight} collapsed={menuCollapse}>
      <div style={styles.bg}>
        <SidebarHeader>
          {/* Logo and menu collapse button */}
          {/* <div className="logotext">
            <p className="d-flex align-items-center justify-content-center m-2 sticky-top bg-white">
              {menuCollapse ? (
                <img
                  src={denso_logo}
                  alt=""
                  style={{ width: "100%", padding: "5px" }}
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
          </div> */}
          <div
            className="closemenu"
            onClick={onClickMenuIcon}
            style={styles.menuIcon}
          >
            {menuCollapse ? (
              <FiArrowRightCircle className="text-white h4 mt-2" />
            ) : (
              <FiArrowLeftCircle className="text-white h4 mt-2" />
            )}
          </div>
        </SidebarHeader>
      </div>
      <SidebarContent>
        <Menu iconShape="square" style={styles.bg}>
          {filteredItems.map((menuItem, index) => {
            if (menuItem.subItems) {
              return (
                <SubMenu
                  key={index}
                  className="text-white"
                  title={menuItem.title}
                  icon={menuItem.icon}
                >
                  {menuItem.subItems.map((subItem, subIndex) => {
                    return (
                      <MenuItem
                        key={subIndex}
                        className="text text-white"
                        data-toggle="tooltip"
                        data-placement="right"
                        icon={subItem.icon}
                      >
                        <NavLink to={subItem.route}></NavLink> {subItem.title}
                      </MenuItem>
                    );
                  })}
                </SubMenu>
              );
            } else {
              // Render the menuItem as a link itself
              return (
                <MenuItem
                  key={index}
                  className="text text-white"
                  icon={menuItem.icon}
                >
                  <NavLink to={menuItem.route}></NavLink> {menuItem.title}
                </MenuItem>
              );
            }
          })}
        </Menu>
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={
              <LogoutIcon
                className="text-white"
                style={{ transform: "rotate(180deg)" }}
              />
            }
            onClick={() =>
              Logout(userData).then((res) => {
                if (res) {
                  loggedOut();
                }
              })
            }
          >
            Logout
          </MenuItem>
        </Menu>
      </SidebarContent>

      {/* <SidebarFooter fixed="bottom">
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={
              <LogoutIcon
                className="text-white"
                style={{ transform: "rotate(180deg)" }}
              />
            }
            onClick={() =>
              Logout(userData).then((res) => {
                if (res) {
                  loggedOut();
                }
              })
            }
          >
            Logout
          </MenuItem>
        </Menu>
      </SidebarFooter> */}
    </ProSidebar>
  );
};

export default BMSidebar;

//Filtering Sidebar Links for authorized user
// const filteredMenuItems = (menuItems, user_type, user_department) => {
//   const filteredItems = [];

//   menuItems.forEach((menuItem) => {
//     if (
//       (!menuItem.allowedRoles || menuItem.allowedRoles.includes(user_type)) &&
//       (!menuItem.allowedDepartments ||
//         menuItem.allowedDepartments.includes(user_department))
//     ) {
//       if (menuItem.subItems) {
//         const filteredSubItems = menuItem.subItems?.filter((subItem) => {
//           return (
//             (!subItem.allowedRoles ||
//               subItem.allowedRoles.includes(user_type)) &&
//             (!subItem.allowedDepartments ||
//               subItem.allowedDepartments.includes(user_department))
//           );
//         });

//         if (filteredSubItems?.length > 0) {
//           filteredItems.push({ ...menuItem, subItems: filteredSubItems });
//         }
//       } else {
//         filteredItems.push(menuItem);
//       }
//     }
//   });

//   return filteredItems;
// };
