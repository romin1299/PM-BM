import React from "react";
import styles from "../Navbar/Navbar.module.scss";

//CONTEXT
import { useContext } from "react";
import NavContext from "../../context/NavContext";

//REACT ROUTER
import { NavLink } from "react-router-dom";
import { denso_logo } from "../../modules/LoginModules";
import { halflogo } from  "../../modules/LoginModules";

//ICONS
import { MdOutlineLogout } from "react-icons/md";

import { FaTimes } from "react-icons/fa";

import AddBoxIcon from "@mui/icons-material/AddBox";

import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import NoteAddIcon from "@mui/icons-material/NoteAdd";

// import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import RoutingContext from "../../context/routing/RoutingContext";
import AddTaskIcon from "@mui/icons-material/AddTask";
import FactCheckIcon from "@mui/icons-material/FactCheck";


import { FaListCheck } from "react-icons/fa6";
import { PiListBulletsFill } from "react-icons/pi";
import { MdFormatListBulletedAdd } from "react-icons/md";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
export {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  MdOutlineLogout,
  FaTimes,
  AddBoxIcon,
  PersonAddAltIcon,
  NoteAddIcon,
  DashboardIcon,
  AccountCircleIcon,
  RoutingContext,
  AddTaskIcon,
  FactCheckIcon,
  halflogo,
  PiListBulletsFill,
  MdFormatListBulletedAdd,
  CalendarMonthIcon,
  EventNoteIcon
};
