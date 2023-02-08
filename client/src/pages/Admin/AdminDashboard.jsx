import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  UserAdd,
  AddBoxIcon,
} from "../../modules/PageModules";
import "../../Login/Login.scss"
import "../../SCSS/MaterialTable.scss";
import UserUpdate from "../../Popups/UserUpdate";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import EmailConfiguration from "../../Popups/EmailConfiguration";
import Footer from "../../components/Footer/Footer";

function AdminDashboard() {
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState([]);
  const [emailConfig, setEmailConfig] = useState("");
  const [refKey2, setRefKey2] = useState(0);

  const close = () => {
    setEmailConfig("");
    document.querySelector(".pageCard").style.pointerEvents = "auto";
  };
  //fetch the user data and show on user management table
  const columns = [
    {
      title: "TM No.",
      field: "tm_no",
      // editable: false,
      align: "center",
      editable: "false",
      width: "10%",
    },
    {
      title: "TM Name",
      field: "tm_name",
      align: "center",
      width: "10%",
    },
    {
      title: "Email",
      field: "email",
      align: "center",
      width: "10%",
    },
    {
      title: "Plant",
      field: "plant_data",
      align: "center",
      width: "10%",
      // editable: "false",
    },
    {
      title: "User Type",
      field: "user_type",
      editable: "false",
      align: "center",
      width: "10%",
    },
    {
      title: "Grade",
      field: "tm_grade",
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
      title: "Joining Date",
      field: "joining_date",
      align: "center",
      width: "10%",
      editable: "false",
    },
    {
      title: "Contact No",
      field: "contact_no",
      align: "center",
      width: "10%",
    },
    {
      title: "Address",
      field: "address",
      align: "center",
      // width: "10%",
    },
  ];
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
      // icon: () => <button className="addbutton">Add</button>,
      icon: () =>
        window.innerWidth > 1024 ? (
          <button className="btn-warning" style={{marginRight:"-1px "}} >Email Configuration</button>
        ) : (
          "Email"
        ),

      tooltip: "Add User",
      isFreeAction: true,
      onClick: (event, rowData) => {
        setEmailConfig(<EmailConfiguration close={close} />);
        // document.getElementById("main_div_reg4").style.pointerEvents = "auto";
        document.querySelector(".pageCard").style.pointerEvents = "none";
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
  ];
  const refreshPage = () => {
    window.location.reload();
  };

  //fetch the user data and show on user management table
  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/displayUser", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      let finalData = [];
      // console.log(data[0].user_type);
      for (let i = 0; i < data.length; i++) {
        if (data[i].user_type !== "Admin") {
          // console.log(finalData.push(data[i]));
          finalData.push(data[i]);
        }
      }
      console.log(finalData);
      setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  //update the data of the user using user id
  const updateUserInfo = async (updatedRow) => {
    const tm_name = updatedRow.tm_name;
    const tm_no = updatedRow.tm_no;
    // const user_type = updatedRow.user_type;
    const email = updatedRow.email;
    const address = updatedRow.address;

    try {
      const res = await fetch("/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_no: tm_no,
          tm_name: tm_name,
          // user_type: user_type,
          email: email,
          address: address,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else if (res.status === 409) {
        console.logt("user already exists");
        refreshPage();
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
  const deleteUserInfo = async (selectedRow) => {
    const tm_no = selectedRow.tm_no;
    // console.log(tm_no);
    try {
      const res = await fetch("/deleteUser", {
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

  // let CSVAndPDFFileName = `User_Management_${currentDate()}`;

  useEffect(() => {
    fetchUserInfo();
  }, [refKey2]);
  return (
    <>
      {/* <UpdatePasswordPopup
        emp_password={emp_password}
        emp_number={emp_number}
      /> */}
      {/* <emailConfig /> */}
      {emailConfig}
      <UserAdd />
      <UserUpdate selectedRow={selectedRow} />
      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>Admin Dashboard</h4>
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
                // isDeleteHidden: (rowData) => rowData.user_type === 0,

                onRowDelete: (selectedRow) =>
                  new Promise((resolve, reject) => {
                    // const index = selectedRow.tableData.id;
                    // console.log(index);
                    // const updatedRows = [...tableData];
                    // updatedRows.splice(index, 1);

                    //call the delete user function and pass the user data
                    deleteUserInfo(selectedRow);

                    setTimeout(() => {
                      setRefKey2((refKey2) => refKey2 + 1);
                      // setTableData(updatedRows);
                      resolve();
                    }, 500);
                  }),

                // onRowUpdate: (updatedRow, oldRow) =>
                //   new Promise((resolve, reject) => {
                //     const index = oldRow.tableData.id;
                //     const updatedRows = [...tableData];
                //     updatedRows[index] = updatedRow;
                //     //call the update user function and pass the user data
                //     updateUserInfo(updatedRow);
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
                },
                headerStyle: {
                  fontSize: "13px",
                  fontWeight: "bold"
                }
              }}
            />
          </div>
        </div>
      </div>
      <Footer/>
      {/* <Footer /> */}
    </>
  );
}

export default AdminDashboard;
