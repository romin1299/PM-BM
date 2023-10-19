import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Router from "./Router";
import { BrowserRouter } from "react-router-dom";
import ContextAPIState from "./context/ContextAPI/ContextAPIState";
import Footer from "./components/Footer/Footer";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ContextAPIState>
        <Router />
      </ContextAPIState>
    </BrowserRouter>
  </React.StrictMode>
);
