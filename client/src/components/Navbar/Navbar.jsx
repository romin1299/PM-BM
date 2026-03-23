import React, { useContext } from "react";
import "../Navbar/Navbar.module.scss";
import Admin from "../NavbarComponent/Admin";
import Plant from "../NavbarComponent/Plant";
import Section from "../NavbarComponent/Section";
import RoutingContext from "../../context/routing/RoutingContext";
import Operator from "../NavbarComponent/Operator";
import TL from "../NavbarComponent/TL";

const Navbar = () => {
  const context = useContext(RoutingContext);
  // console.log(context.user_type);
  if (context.user_type === "Admin") {
    return <Admin userData={context} />;
  } else if (context.user_type === "Plant-Admin") {
    return <Plant userData={context} userDepartment={context.tm_department} />;
  } else if (context.user_type === "Section-Admin") {
    return (
      <Section userData={context} userDepartment={context.tm_department} />
    );
  } else if (context.user_type === "Operator") {
    return <Operator userData={context} />;
  } else if (context.user_type === "TL/HOSS") {
    return <TL userData={context} userDepartment={context.tm_department} />;
  }
};
export default Navbar;
