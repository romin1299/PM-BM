import {
  React,
  useState,
  useEffect,
  MaterialTable,
  tableIcons,
  AddBoxIcon,
  UserAdd,
} from "../../modules/PageModules";
import UserUpdate from "../../Popups/UserUpdate";
import ModeEditIcon from "@mui/icons-material/ModeEdit";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

import Footer from "../../components/Footer/Footer";
const UserAssignSection = () => {
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState([]);
  const [refKey2, setRefKey2] = useState(0);

  const userDataHeaderForCSV = [
    {
      label: "TM No.",
      key: "tm_no",
    },
    {
      label: "TM Name",
      key: "tm_name",
    },

    {
      label: "User Type",
      key: "user_type",
    },

    {
      label: "Department",
      key: "tm_department",
    },
    {
      label: "Plant",
      key: "plant_data",
    },
    {
      label: "Section",
      key: "section_data",
    },
    {
      label: "Sub Section",
      key: "subSection_data",
    },
    {
      label: "Cell/Product",
      key: "cell_data",
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

  const downloadPDFOfUserData = () => {
    const doc = new jsPDF();
    let rows = [];
    tableData?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.tm_no,
        item.tm_name,
        item.user_type,
        item.tm_department,
        item.plant_data,
        item.section_data,
        item.subSection_data,
        item.cell_data,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`User Data`, 15, 10);

    autoTable(doc, {
      head: [columns?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`User_Data_${timeStamp()}`);
  };

  const actions = [
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () =>
        window.innerWidth > 1024 ? (
          <button className="btn-reset">Add</button>
        ) : (
          <AddBoxIcon />
        ),

      tooltip: "Add User",
      isFreeAction: true,
      onClick: (event, rowData) => {
        document.getElementById("main_div_reg1").style.display = "block";
        document.getElementById("main_div_reg1").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
    },

    {
      icon: () => <ModeEditIcon />,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        // console.log(employeePassword)
        document.getElementById("main_div_reg2").style.display = "block";
        document.getElementById("main_div_reg2").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfUserData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={userDataHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={tableData}
          filename={`User_Data_${timeStamp()}`}
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

  const columns = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "10%",
      align: "center",
    },
    {
      title: "TM No.",
      field: "tm_no",
      // editable: false,
      filtering: false,
      align: "center",
      editable: "false",
      width: "10%",

    },
    {
      title: "TM Name",
      field: "tm_name",
      filtering: false,
      align: "center",
      width: "10%",

    },
    {
      title: "User Type",
      field: "user_type",
      align: "center",
      editable: "false",
      width: "10%",
    },
    {
      title: "Department",
      field: "tm_department",
      align: "center",
      editable: "false",
      width: "10%",
    },
    {
      title: "Plant",
      field: "plant_data",
      align: "center",
      width: "10%",
      editable: "false",
    },
    {
      title: "Section",
      field: "section_data",
      align: "center",
      width: "10%",
    },
    {
      title: "Sub Section",
      field: "subSection_data",
      align: "center",
      // width: "10%",
      render: (rowData) =>
        rowData.subSection_data.length > 1
          ? rowData.subSection_data.join(", ")
          : rowData.subSection_data,
    },
    {
      title: "Cell/Product",
      field: "cell_data",
      align: "center",
      // width: "10%",
      render: (rowData) =>
        rowData.cell_data.length > 1
          ? rowData.cell_data.join(", ")
          : rowData.cell_data,
    },
  ];

  //fetch the user data and show on user management table
  const fetchSectionAssignUserInfo = async () => {
    try {
      const res = await fetch("/displaySectionAssignUser", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      setTableData(data);
    } catch (error) {
      console.log(error);
    }
  };

  //update the data of the user using user id
  const updateSectionAssignUserInfo = async (updatedRow) => {
    const tm_name = updatedRow.tm_name;
    const tm_no = updatedRow.tm_no;
    const user_type = updatedRow.user_type;
    const email = updatedRow.email;
    const address = updatedRow.address;
    // const plant_data = updatedRow.plant_data;
    const section_data = updatedRow.section_data;
    const subSection_data = updatedRow.subSection_data;
    const cell_data = updatedRow.cell_data;
    const contact_no = updatedRow.contact_no;

    try {
      const res = await fetch("/updateAssignUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_no: tm_no,
          tm_name: tm_name,
          user_type: user_type,
          email: email,
          address: address,
          // plant_data: plant_data,
          section_data: section_data,
          subSection_data: subSection_data,
          cell_data: cell_data,
          contact_no: contact_no,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else if (res.status === 409) {
        console.log("user already exists");
        // refreshPage();
      } else {
        console.log("Data Updated Successful");
        // refreshPage();
        // const dateAndTime = timeStamp();
        // const addMessage = `${updatedRow.user_name} user updated`;
        // logData(dateAndTime, addMessage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //delete the data of the user using user id
  const deleteSectionAssignUserInfo = async (selectedRow) => {
    const tm_no = selectedRow.tm_no;
    // console.log(tm_no);
    try {
      const res = await fetch("/deleteAssignUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_no: tm_no,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("User Deleted Successful");
        // console.log("hello");
        // refreshPage();
        // const dateAndTime = timeStamp();
        // const addMessage = `${selectedRow.user_name} user deleted`;
        // logData(dateAndTime, addMessage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSectionAssignUserInfo();
  }, [refKey2]);

  return (
    <>
      <UserAdd />
      <UserUpdate selectedRow={selectedRow} />
      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>User Assign Dashboard</h4>
          <div style={{ padding: "1rem" }}>
            <MaterialTable
              localization={
                {
                  // toolbar: {
                  //   exportCSVName: "Export some Excel format",
                  //   exportPDFName: "Export as pdf!!"
                  // }
                }
              }
              actions={actions}
              icons={tableIcons}
              columns={columns}
              data={tableData}
              // title="User Management"
              // tableRef={this.tableRef.current.onQueryChange()}

              editable={{
                isDeleteHidden: (rowData) => rowData.user_type === 0,

                onRowDelete: (selectedRow) =>
                  new Promise((resolve, reject) => {
                    // const index = selectedRow.tableData.id;
                    // console.log(index);
                    // const updatedRows = [...tableData];
                    // updatedRows.splice(index, 1);

                    //call the delete user function and pass the user data
                    deleteSectionAssignUserInfo(selectedRow);

                    setTimeout(() => {
                      // setTableData(updatedRows);
                      setRefKey2((refKey2) => refKey2 + 1);
                      resolve();
                    }, 500);
                  }),

                // onRowUpdate: (updatedRow, oldRow) =>
                //   new Promise((resolve, reject) => {
                //     const index = oldRow.tableData.id;
                //     const updatedRows = [...tableData];
                //     updatedRows[index] = updatedRow;
                //     //call the update user function and pass the user data
                //     updateSectionAssignUserInfo(updatedRow);
                //     setTimeout(() => {
                //       setTableData(updatedRows);
                //       resolve();
                //     }, 500);
                //     //refreshPage();
                //   }),
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
                  fontSize: "12px",
                },
                headerStyle: {
                  fontSize: "13px",
                  fontWeight: "bold",
                
                }
              }}
            />
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default UserAssignSection;
