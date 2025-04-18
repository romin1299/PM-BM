import React from "react";

import BMSidebar from "../../BM/BMSidebar/BMSidebar";
import Container from "../../components/Container/Container";
import { Routes, Route } from "react-router-dom";

const CommonRoutesContainer = ({ routes, sideBarProp }) => {
  return (
    <div className="App">
      {sideBarProp && <BMSidebar {...sideBarProp} />}

      {/* Render main container based on the user's routes */}
      <Container
        content={
          <Routes>
            {routes?.map((route) =>
              route?.children ? (
                <Route key={route?.path} path={route?.path}>
                  {route?.children?.map((subRoute) => (
                    <Route
                      key={subRoute?.path}
                      path={subRoute?.path}
                      element={subRoute?.element}
                    />
                  ))}
                </Route>
              ) : (
                <Route
                  key={route?.path}
                  path={route?.path}
                  element={route?.element}
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
