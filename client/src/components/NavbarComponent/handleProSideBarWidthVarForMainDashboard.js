const handleProSideBarWidthVarForMainDashboard = (menuCollapse) => {
  const root = document.documentElement;
  root?.style.setProperty(
    "--proSideBar-width-for-calculating-main-div-width",
    !menuCollapse ? "80px" : "270px"
  );
};

export default handleProSideBarWidthVarForMainDashboard;
