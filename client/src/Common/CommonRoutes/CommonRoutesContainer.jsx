import React from "react";

import BMSidebar from "../../BM/BMSidebar/BMSidebar";
import Container from "../../components/Container/Container";
import { Routes, Route } from "react-router-dom";

const CommonRoutesContainer = ({ routes, sideBarProp }) => {
  return (
    <div className="App">
      <BMSidebar {...sideBarProp} />

      {/* Render main container based on the user's routes */}
      <Container
        content={
          <Routes>
            {routes?.map((route) =>
              route?.subRoutes ? (
                route?.subRoutes?.map((subRoute) => (
                  <Route key={route.path} path={route.path}>
                    <Route
                      key={subRoute.path}
                      path={subRoute.path}
                      element={subRoute.element}
                    />
                  </Route>
                ))
              ) : (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              )
            )}
          </Routes>
        }
      />
    </div>
  );
};

export default CommonRoutesContainer;
