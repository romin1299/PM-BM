import React, { useState, useContext } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import denso_logo from "../static/images/logo2.png";
import halflogo from "../static/images/halflogo2.png";

import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { lightTheme, darkTheme } from "../theme/theme";

import showPwdImg from "../static/svg/show-password.svg";
import hidePwdImg from "../static/svg/hide-password.svg";

export {
  lightTheme,
  darkTheme,
  styled,
  halflogo,
  useState,
  useNavigate,
  useFormik,
  yup,
  Button,
  TextField,
  useContext,
  denso_logo,
  showPwdImg,
  hidePwdImg,
};
