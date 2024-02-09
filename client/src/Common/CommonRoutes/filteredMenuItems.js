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