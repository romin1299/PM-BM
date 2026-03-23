import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Router from "./Router";
import { BrowserRouter } from "react-router-dom";
import ContextAPIState from "./context/ContextAPI/ContextAPIState";
// import Footer from "./components/Footer/Footer";
import "./BM/Utils/functions/array.method";

import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme/MuiTheme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ContextAPIState>
        <ThemeProvider theme={theme}>
          <Router />
        </ThemeProvider>
      </ContextAPIState>
    </BrowserRouter>
  </React.StrictMode>
);
  