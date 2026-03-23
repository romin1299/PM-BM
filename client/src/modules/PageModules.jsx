// Dashboards
import { React, useEffect, useState, useContext, useReducer } from "react";

import MaterialTable from "@material-table/core";
import tableIcons from "../components/MatrialTableIcon";
import NewUserRegistration from "../Popups/NewUserRegistration";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { Link } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";
import SectionContext from "../context/ContextAPI/ContextAPI";
import { useLocation } from "react-router-dom";
import useLocalStorage from "react-use-localstorage";
import UserAdd from "../Popups/UserAdd";
export {
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  AddBoxIcon,
  LockIcon,
  SectionContext,
  useLocation,
  useLocalStorage,
  Link,
  useContext,
  UserAdd,
  useReducer
};
