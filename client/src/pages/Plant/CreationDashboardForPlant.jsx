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
import RoutingContext from "../../context/routing/RoutingContext";
import Footer from "../../components/Footer/Footer";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

const CreationDashboardForPlant = () => {
  const [sections, setsections] = useState();

  const [sectionList, setSectionList] = useState("");
  const [subSectionList, setSubSectionList] = useState("");

  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);

  const context = useContext(RoutingContext);

  // console.log(context.plant_data);
  //fetch all section head for showing or selecting in dropdown by common user

  // setRefKey(refKey + 1)
  // console.log(dashboardLevel);

  // Section

  const sectionHeader = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
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

  const sectionHeaderForCSV = [
    {
      label: "Section Id",
      key: "section_id",
    },
    {
      label: "Section Name",
      key: "section_name",
    },
    {
      label: "Dashboard Level",
      key: "dashboardLevel",
    },
  ];

  const subSectionHeader = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
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

  const subSectionHeaderForCSV = [
    {
      label: "SubSection Id",
      key: "subSection_id",
    },
    {
      label: "SubSection Name",
      key: "subSection_name",
    },
    {
      label: "Sequence",
      key: "subSection_sequence",
    },
  ];

  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };

  const downloadPDFOfSectionData = () => {
    const doc = new jsPDF();
    let rows = [];
    sectionList?.sectionsInfo?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.section_id,
        item.section_name,
        item.dashboardLevel,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Section Data`, 15, 10);

    autoTable(doc, {
      head: [sectionHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Section_Data_${timeStamp()}`);
  };

  const downloadPDFOfSubSectionData = () => {
    const doc = new jsPDF();
    let rows = [];
    subSectionList?.subSectionsInfo?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.subSection_id,
        item.subSection_name,
        item.subSection_sequence,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Sub Section Data`, 15, 10);

    autoTable(doc, {
      head: [subSectionHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Sub_Section_Data_${timeStamp()}`);
  };

  const sectionAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfSectionData();
      },
    },
    {
      icon: () => (
        <CSVLink
          headers={sectionHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={sectionList.sectionsInfo}
          filename={`Section_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
    },
  ];

  const subSectionAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfSubSectionData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={subSectionHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={subSectionList?.subSectionsInfo}
          filename={`Sub_Section_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
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
          plants: context.plant_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post");

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
    // if () {
    // }
    postPlantToGetSectionList();
  }, [refKey]);

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
              <span>Section</span>
              <select
                class="form-select form-select-sm"
                aria-label=".form-select-sm example"
                style={{ width: "20%", background: "white" }}
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
            {sections ? (
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
                  actions={subSectionAction}
                  icons={tableIcons}
                  columns={subSectionHeader}
                  data={subSectionList.subSectionsInfo}
                  // title="User Management"
                  // tableRef={this.tableRef.current.onQueryChange()}

                  editable={{
                    isEditHidden: () => context?.tm_no === Number("9999"),
                    isDeleteHidden: () => context?.tm_no === Number("9999"),
                    ...(context?.tm_no !== 9999 && {
                      onRowAdd: (newRow) =>
                        new Promise((resolve, reject) => {
                          // const updatedRows = [
                          //   ...sectionList.sectionsInfo,
                          //   { user_id: "", ...newRow },
                          // ];

                          // postNewPlantData(newRow);
                          newSubSection(newRow, sections);

                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey2((refKey2) => refKey2 + 1);
                            resolve();
                          }, 500);
                          //refreshPage();
                        }),
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
                        // const index = oldRow.tableData.id;
                        // const updatedRows = [...subSectionList.subSectionsInfo];
                        // updatedRows[index] = updatedRow;
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
            ) : sectionList !== "" ? (
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
                actions={sectionAction}
                icons={tableIcons}
                columns={sectionHeader}
                data={sectionList.sectionsInfo}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}
                editable={{
                  isEditHidden: () => context?.tm_no === Number("9999"),
                  isDeleteHidden: () => context?.tm_no === Number("9999"),
                  ...(context?.tm_no !== 9999 && {
                    onRowAdd: (newRow) =>
                      new Promise((resolve, reject) => {
                        newSection(newRow, context.plant_data);
                        setTimeout(() => {
                          setRefKey((refKey) => refKey + 1);
                          resolve();
                        }, 500);
                      }),
                  }),

                  onRowDelete: (selectedRow) =>
                    new Promise((resolve, reject) => {
                      deleteSection(selectedRow);
                      setTimeout(() => {
                        setRefKey((refKey) => refKey + 1);
                        resolve();
                      }, 500);
                    }),

                  onRowUpdate: (updatedRow, oldRow) =>
                    new Promise((resolve, reject) => {
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
                  // sorting: true,
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
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default CreationDashboardForPlant;
