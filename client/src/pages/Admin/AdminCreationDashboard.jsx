import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  AddBoxIcon,
  useContext,
} from "../../modules/PageModules";

import {
  postNewPlant,
  updatePlant,
  deletePlant,
  newSection,
  updateSection,
  deleteSection,
  newSubSection,
  updateSubSection,
  deleteSubSection,
} from "../../Integration/APIExports.js";

import "../../SCSS/MaterialTable.scss";
import { RadioGroup } from "@mui/material";

const AdminCreationDashboard = () => {
  const [plants, setplants] = useState();
  const [sections, setsections] = useState();

  const [sectionList, setSectionList] = useState("");
  const [subSectionList, setSubSectionList] = useState("");

  const [plantList, setPlantList] = useState("");
  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);

  //fetch all section head for showing or selecting in dropdown by common user
  const fetchPlantList = async () => {
    try {
      const res = await fetch("/fetchPlantList", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      //   console.log(data);
      setPlantList(data);
    } catch (error) {
      console.log(error);
    }
  };

  // setRefKey(refKey + 1)
  // console.log(dashboardLevel);

  // Section

  const plantHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "10%",
    },
    {
      title: "Plant Id",
      field: "plant_id",
      editable: "false",
      align: "center",
    },
    {
      title: "Plant Name",
      field: "plant_name",
      align: "center",
    },
  ];

  const sectionHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "10%",
    },
    {
      title: "Section Id",
      field: "section_id",
      editable: "false",
      align: "center",
    },
    {
      title: "Section Name",
      field: "section_name",
      align: "center",
    },
    {
      title: "Dashboard Level",
      field: "dashboardLevel",
      align: "center",
      width: "10%",
      editComponent: ({ value, onChange }) => (
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          style={{ marginTop: "0.2rem" }}
        >
          <div>
            <input
              // onClick={showDashboardLevel}
              type="radio"
              id="html"
              name="dashboardLevel"
              value="Yes"
              // checked={dashboardLevel}
              onChange={(e) => onChange(e.target.value)}
            />
            <span for="html" className="m-2">
              Yes
            </span>
            <input
              // onClick={hideDashboardLevel}
              type="radio"
              id="html"
              name="dashboardLevel"
              value="No"
              // checked={dashboardLevel}
              onChange={(e) => onChange(e.target.value)}
            />
            <span for="html" className="m-2">
              No
            </span>
          </div>
        </RadioGroup>
      ),
    },
  ];

  const subSectionHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "10%",
    },
    {
      title: "SubSection Id",
      field: "subSection_id",
      editable: "false",
      align: "center",
    },
    {
      title: "SubSection Name",
      field: "subSection_name",
      align: "center",
    },
    {
      title: "Sequence",
      field: "subSection_sequence",
      align: "center",
    },
  ];

  const postPlantToGetSectionList = async (selectedPlant) => {
    setsections(undefined);
    try {
      const res = await fetch("/postPlantToGetSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plants: selectedPlant,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post");

        setSectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetSubSectionList = async (selectedSection) => {
    try {
      const res = await fetch("/postSectionToGetSubSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post");

        setSubSectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // console.log("_______", refKey);
    fetchPlantList();
    // setSectionList((sectionList) => sectionList);
  }, [refKey]);

  useEffect(() => {
    if (plants) {
      postPlantToGetSectionList(plants);
    }
  }, [plants, refKey]);

  useEffect(() => {
    if (sections) {
      postSectionToGetSubSectionList(sections);
    }
  }, [sections, refKey2]);

  return (
    <>
      <div className="pageCard">
        <div className="creationDashboard">
          <div className="selection_div">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Plant</span>
              <select
                class="form-select form-select-sm"
                aria-label=".form-select-sm example"
                style={{ width: "100%", background: "white" }}
                id="standard-select-currency"
                name="plant"
                className="textField"
                select
                fullWidth // label="Select"
                autoComplete="off"
                //   value={plant}
                onChange={(e) => {
                  setplants(e.target.value);
                  // postPlantToGetSectionList(e.target.value);
                }}
                variant="standard"
              >
                <option selected disabled value="">
                  Please select
                </option>
                {plantList !== ""
                  ? plantList.plantArray.map((option) => {
                      return <option value={option}>{option}</option>;
                    })
                  : ""}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Section</span>
              <select
                class="form-select form-select-sm"
                aria-label=".form-select-sm example"
                style={{ width: "100%", background: "white" }}
                id="sections"
                name="plant"
                className="textField"
                select
                fullWidth // label="Select"
                autoComplete="off"
                value={sections === undefined ? "" : sections}
                onChange={(e) => {
                  setsections(e.target.value);
                  // postSectionToGetSubSectionList(e.target.value);
                }}
                variant="standard"
              >
                {/* {plant.map((option) => {
                return (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })} */}
                <option selected disabled value="">
                  Please select
                </option>

                {sectionList !== ""
                  ? sectionList.sectionArray.map((option) => {
                      return <option value={option}>{option}</option>;
                    })
                  : ""}
              </select>
            </div>
          </div>
          <div style={{ padding: "1rem" }}>
            {plants && sections ? (
              subSectionList !== "" ? (
                <MaterialTable
                  localization={{
                    header: {
                      actions: "Actions",
                    },
                    // toolbar: {
                    //   exportCSVName: "Export some Excel format",
                    //   exportPDFName: "Export as pdf!!"
                    // }
                  }}
                  // actions={actions}
                  icons={tableIcons}
                  columns={subSectionHeader}
                  data={subSectionList.subSectionsInfo}
                  // title="User Management"
                  // tableRef={this.tableRef.current.onQueryChange()}

                  editable={{
                    onRowAdd: (newRow) =>
                      new Promise((resolve, reject) => {
                        const updatedRows = [
                          ...sectionList.sectionsInfo,
                          { user_id: "", ...newRow },
                        ];

                        // postNewPlantData(newRow);
                        newSubSection(newRow, sections);

                        setTimeout(() => {
                          // setSectionList(updatedRows);
                          setRefKey2((refKey2) => refKey2 + 1);
                          resolve();
                        }, 500);
                        //refreshPage();
                      }),

                    onRowDelete: (selectedRow) =>
                      new Promise((resolve, reject) => {
                        // const index = selectedRow.tableData.id;
                        // console.log(index);
                        // const updatedRows = [...subSectionList.subSectionsInfo];
                        // updatedRows.splice(index, 1);

                        //call the delete user function and pass the user data
                        // deleteUserInfo(selectedRow);
                        deleteSubSection(selectedRow);
                        setTimeout(() => {
                          setRefKey2((refKey2) => refKey2 + 1);
                          resolve();
                        }, 500);
                      }),

                    onRowUpdate: (updatedRow, oldRow) =>
                      new Promise((resolve, reject) => {
                        const index = oldRow.tableData.id;
                        const updatedRows = [...subSectionList.subSectionsInfo];
                        updatedRows[index] = updatedRow;
                        //call the update user function and pass the user data
                        // updateUserInfo(updatedRow);

                        updateSubSection(updatedRow, oldRow);
                        setTimeout(() => {
                          setRefKey2((refKey2) => refKey2 + 1);
                          resolve();
                        }, 500);
                        //refreshPage();
                      }),
                  }}
                  options={{
                    showTitle: false,
                    paging: false,
                    sorting: true,
                    search: true,
                    filtering: false,
                    exportButton: true,
                    exportAllData: true,
                    draggable: false,
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: false,
                    paginationType: "stepped",
                    addRowPosition: "first",
                    headerStyle: {
                      position: "sticky",
                      top: "0",
                      fontWeight: "bold",
                    },
                    maxBodyHeight: "70vh",
                    rowStyle: {
                      // fontStyle:'bold'

                      boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                      // color:"rgba(255,255,255,0.8)",
                      borderRadius: "5px",
                      border: "1px solid rgba(255,255,255)",
                      WebkitBackdropFilter: "blur( 2px )",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(5px)",
                    },
                    headerStyle: {
                      fontSize: "14px",
                      fontWeight: "bold",
                    },
                  }}
                />
              ) : (
                ""
              )
            ) : plants ? (
              sectionList !== "" ? (
                <MaterialTable
                  localization={{
                    header: {
                      actions: "Actions",
                    },
                    // toolbar: {
                    //   exportCSVName: "Export some Excel format",
                    //   exportPDFName: "Export as pdf!!"
                    // }
                  }}
                  // actions={actions}
                  icons={tableIcons}
                  columns={sectionHeader}
                  data={sectionList.sectionsInfo}
                  // title="User Management"
                  // tableRef={this.tableRef.current.onQueryChange()}

                  editable={{
                    onRowAdd: (newRow) =>
                      new Promise((resolve, reject) => {
                        const updatedRows = [
                          ...sectionList.sectionsInfo,
                          { user_id: "", ...newRow },
                        ];

                        // postNewPlantData(newRow);
                        newSection(newRow, plants);

                        setTimeout(() => {
                          // setSectionList(updatedRows);
                          setRefKey((refKey) => refKey + 1);
                          resolve();
                        }, 500);
                        //refreshPage();
                      }),

                    onRowDelete: (selectedRow) =>
                      new Promise((resolve, reject) => {
                        // const index = selectedRow.tableData.id;
                        // console.log(index);
                        // const updatedRows = [...sectionList.sectionsInfo];
                        // updatedRows.splice(index, 1);

                        //call the delete user function and pass the user data
                        // deleteUserInfo(selectedRow);
                        deleteSection(selectedRow);
                        setTimeout(() => {
                          setRefKey((refKey) => refKey + 1);
                          resolve();
                        }, 500);
                      }),

                    onRowUpdate: (updatedRow, oldRow) =>
                      new Promise((resolve, reject) => {
                        const index = oldRow.tableData.id;
                        const updatedRows = [...sectionList.sectionsInfo];
                        updatedRows[index] = updatedRow;
                        //call the update user function and pass the user data
                        // updateUserInfo(updatedRow);
                        updateSection(updatedRow, oldRow);
                        setTimeout(() => {
                          setRefKey((refKey) => refKey + 1);
                          resolve();
                        }, 500);
                        //refreshPage();
                      }),
                  }}
                  options={{
                    showTitle: false,
                    paging: false,
                    sorting: true,
                    search: true,
                    filtering: false,
                    exportButton: true,
                    exportAllData: true,
                    draggable: false,
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: false,
                    paginationType: "stepped",
                    addRowPosition: "first",
                    headerStyle: {
                      position: "sticky",
                      top: "0",
                      fontWeight: "bold",
                    },
                    maxBodyHeight: "70vh",
                    rowStyle: {
                      // fontStyle:'bold'

                      boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                      // color:"rgba(255,255,255,0.8)",
                      borderRadius: "5px",
                      border: "1px solid rgba(255,255,255)",
                      WebkitBackdropFilter: "blur( 2px )",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(5px)",
                    },
                    headerStyle: {
                      fontSize: "14px",
                      fontWeight: "bold",
                    },
                  }}
                />
              ) : (
                ""
              )
            ) : plantList !== "" ? (
              <MaterialTable
                localization={{
                  header: {
                    actions: "Actions",
                  },
                  // toolbar: {
                  //   exportCSVName: "Export some Excel format",
                  //   exportPDFName: "Export as pdf!!"
                  // }
                }}
                // actions={actions}
                icons={tableIcons}
                columns={plantHeader}
                data={plantList.plantLists}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}

                editable={{
                  // isDeleteHidden: (rowData) => rowData.user_type === 0,

                  onRowAdd: (newRow) =>
                    new Promise((resolve, reject) => {
                      const updatedRows = [
                        ...plantList.plantLists,
                        { user_id: "", ...newRow },
                      ];

                      // postNewPlantData(newRow);
                      postNewPlant(newRow);

                      setTimeout(() => {
                        // setTableData(updatedRows);
                        setRefKey((refKey) => refKey + 1);
                        resolve();
                      }, 500);
                      //refreshPage();
                    }),

                  onRowDelete: (selectedRow) =>
                    new Promise((resolve, reject) => {
                      // const index = selectedRow.tableData.id;
                      // console.log(index);
                      // const updatedRows = [...plantList.plantLists];
                      // updatedRows.splice(index, 1);

                      //call the delete user function and pass the user data
                      // deleteUserInfo(selectedRow);
                      deletePlant(selectedRow);

                      setTimeout(() => {
                        setRefKey((refKey) => refKey + 1);
                        resolve();
                      }, 500);
                    }),

                  onRowUpdate: (updatedRow, oldRow) =>
                    new Promise((resolve, reject) => {
                      const index = oldRow.tableData.id;
                      const updatedRows = [...plantList.plantLists];
                      updatedRows[index] = updatedRow;
                      //call the update user function and pass the user data
                      updatePlant(updatedRow, oldRow);
                      setTimeout(() => {
                        setRefKey((refKey) => refKey + 1);
                        resolve();
                      }, 500);
                      // refreshPage();
                    }),
                }}
                options={{
                  showTitle: false,
                  paging: false,
                  sorting: true,
                  search: true,
                  filtering: false,
                  exportButton: true,
                  exportAllData: true,
                  draggable: false,
                  actionsColumnIndex: -1,
                  pageSize: 10,
                  pageSizeOptions: false,
                  paginationType: "stepped",
                  addRowPosition: "first",
                  headerStyle: {
                    position: "sticky",
                    top: "0",
                    fontWeight: "bold",
                  },
                  maxBodyHeight: "70vh",
                  rowStyle: {
                    // fontStyle:'bold'

                    boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                    // color:"rgba(255,255,255,0.8)",
                    borderRadius: "5px",
                    border: "1px solid rgba(255,255,255)",
                    WebkitBackdropFilter: "blur( 2px )",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(5px)",
                  },
                  headerStyle: {
                    fontSize: "14px",
                    fontWeight: "bold",
                  },
                }}
              />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCreationDashboard;
