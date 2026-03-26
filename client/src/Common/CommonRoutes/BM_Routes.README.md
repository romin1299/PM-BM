# Routing in BM Platform

## Table of Contents

1. [Overview](#overview)
2. [Components and Functions](#components-and-functions)
   - [BM_Routes.js](#bm_routes-js)
   - [CommonRoutesContainer.js](#commonroutescontainer-js)
   - [filteredMenuItems.js](#filteredmenuitems-js)
   - [menuItems.js](#menuitems-js)
3. [Usage](#usage)
4. [Customization and Configuration](#customization-and-configuration)
5. [Considerations](#considerations)

## Overview

Routing in the BM platform facilitates navigation and component rendering based on user roles and permissions. It ensures that users have access to relevant sections of the application while maintaining security and usability. This document provides insights into how routing is structured and implemented within the BM platform.

## Components and Functions

### 1. BM_Routes.js

```javascript
import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import RoutingContext from "../context/routing/RoutingContext";
import CommonRoutesContainer from "./CommonRoutesContainer";

function BM_Routes({ commonRoutes }) {
  const context = useContext(RoutingContext);

  const userRoutes = [
    {
      user_type: "Admin",
      routes: [
        {
          path: "/bm/path/to/admin",
          element: <AdminDashboard />,
        },
      ],
    },
    ...commonRoutes,
    // Define routes for different user types...
  ];

  // Filter commonRoutes array based on user's type
  const filteredRoutes = userRoutes.find(
    (userRoute) => userRoute.user_type === context.user_type
  );

  return (
    <CommonRoutesContainer
      routes={filteredRoutes?.routes}
      sideBarProp={{ userData: context, filteredItems }}
    />
  );
}

export default BM_Routes;
```

- Uses `useContext` to get the user's routing context from `RoutingContext`.
- Defines an array of `userRoutes` containing routes for different user types.
- Filters the `userRoutes` array based on the user's type using the `find` method.
- Renders the `CommonRoutesContainer` component with the filtered routes and sidebar properties.

### 2. CommonRoutesContainer.js

```javascript
import React from "react";
import BMSidebar from "../../BM/BMSidebar/BMSidebar";
import Container from "../../components/Container/Container";
import { Routes, Route } from "react-router-dom";

const CommonRoutesContainer = ({ routes, sideBarProp }) => {
  return (
    <div className="App">
      <BMSidebar {...sideBarProp} />
      <Container
        content={
          <Routes>
            {routes?.map((route) =>
              route?.children ? (
                <Route key={route.path} path={route.path}>
                  {route?.children?.map((subRoute) => (
                    <Route
                      key={subRoute.path}
                      path={subRoute.path}
                      element={subRoute.element}
                    />
                  ))}
                </Route>
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
```

- Defines the `CommonRoutesContainer` functional component that takes `routes` and `sideBarProp` as props.
- Renders the sidebar (`BMSidebar`) and main content container (`Container`).
- Dynamically renders routes based on the provided `routes` array using `map` method.
- Uses React Router's `Routes` and `Route` components for route rendering.

### 3. menuItems.js

```javascript
export const menuItems = [
  {
    title: "Dashboard",
    icon: "<DashboardIcon />",
    subItems: [
      {
        title: "Request Sheet Progress Monitoring",
        route: "/bm",
        allowedRoles: reportAccess,
      },
      // Other sub-items...
    ],
  },
  {
    title: "Approval Dashboard",
    icon: "<FactCheckIcon />",
    route: "/bm/approval",
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  // Other menu items...
];
```

- Defines an array named `menuItems` that contains objects representing menu items.
- Each menu item object has properties such as `title`, `icon`, `route`, and `allowedRoles`.
- Menu items may have sub-items defined in the `subItems` property.
- Menu items are structured to facilitate rendering of the sidebar navigation menu.
- The `menuItems` array is used to populate the sidebar navigation menu based on the user's role and permissions.

These explanations provide a detailed understanding of each code snippet's functionality within the context of routing implementation in the BM platform. Let me know if you need further clarification or assistance!

### 4. filteredMenuItems.js

```javascript
export const filteredMenuItems = (menuItems, user_type, user_department) => {
  const filteredItems = [];

  menuItems.forEach((menuItem) => {
    if (
      (!menuItem.allowedRoles || menuItem.allowedRoles.includes(user_type)) &&
      (!menuItem.allowedDepartments ||
        menuItem.allowedDepartments.includes(user_department))
    ) {
      if (menuItem.subItems) {
        const filteredSubItems = menuItem.subItems?.filter((subItem) => {
          return (
            (!subItem.allowedRoles ||
              subItem.allowedRoles.includes(user_type)) &&
            (!subItem.allowedDepartments ||
              subItem.allowedDepartments.includes(user_department))
          );
        });
        if (filteredSubItems?.length > 0) {
          filteredItems.push({ ...menuItem, subItems: filteredSubItems });
        }
      } else {
        filteredItems.push(menuItem);
      }
    }
  });

  return filteredItems;
};
```

- Defines a function named `filteredMenuItems` that takes `menuItems`, `user_type`, and `user_department` as parameters.
- Initializes an empty array `filteredItems` to store filtered menu items.
- Iterates through each `menuItem` in the `menuItems` array using the `forEach` method.
- Checks whether the menu item is accessible to the user based on their role and department.
- If the menu item passes the filtering criteria, it is added to the `filteredItems` array.
- If the menu item has sub-items, it recursively filters and adds them to the `filteredItems` array.
- Returns the array of filtered menu items.

Certainly! Below is an example of how to add a new path and route for a specific user in the BM platform:

## Customization and Configuration

In this section, we'll explore how to customize and configure routes in the BM platform, including adding new paths and routes for specific users.

#### Adding a New Path and Route for a Specific User

Let's say we want to add a new dashboard page specifically for supervisors. Here's how we can do it:

1. **Update menuItems.js:**

   Add a new menu item for the supervisor dashboard in the `menuItems.js` file.

   ```javascript
   export const menuItems = [
     {
       title: "Dashboard",
       icon: "<DashboardIcon />",
     },
     // Add a new menu item for the supervisor dashboard
     {
       title: "Supervisor Dashboard",
       route: "/bm/supervisor-dashboard",
       allowedRoles: ["Supervisor"],
     },
     // Existing menu items...
   ];
   ```

2. **Update BM_Routes.js:**

   Update the `BM_Routes.js` file to include a new route for the supervisor dashboard.

   you only need to update the userRoutes array.

   ```javascript
   const userRoutes = [
     // Existing routes...
     {
       user_type: "Supervisor",
       routes: [
         {
           path: "/bm/supervisor-dashboard",
           element: <SupervisorDashboard />,
         },
       ],
     },
     // Existing user routes...
   ];
   ```

With these changes, a new path and route for the supervisor dashboard have been added to the BM platform. This dashboard will only be accessible to users with the "Supervisor" role. Developers can follow a similar approach to add paths and routes for other user types as needed.

### Considerations

In the current implementation, adding a new path and sidebar link requires modifications to multiple files. Developers need to ensure consistency between the routing configuration and the sidebar menu to maintain a seamless user experience. Here are the steps involved:

1. **Menu Item Update**: Developers must include the new path in the `menuItems.js` file to ensure that the sidebar reflects the addition of the new functionality.

2. **Routing Configuration**: In the `BM_Routes.js` file, developers need to create a new route for the added functionality. This includes defining the path and specifying the component to render for each user type that will have access to this route. It's crucial to consider all user types and ensure that the route is accessible to the appropriate users.

By following these steps, developers can ensure that both the routing and sidebar navigation are updated consistently, providing users with easy access to new features while maintaining the integrity of the application's navigation system.
