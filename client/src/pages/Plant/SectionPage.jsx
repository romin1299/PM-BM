import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  AddBoxIcon,
  LockIcon,
  SectionContext,
  useLocation,
  useLocalStorage,
  useContext,
  Link,
} from "../../modules/PageModules";

import "../../SCSS/MaterialTable.scss";

function SectionPage() {
  const location = useLocation();
  const [selectedRow, setSelectedRow] = useLocalStorage({});
  const section = useContext(SectionContext);
  const [refKey2, setRefKey2] = useState(0);

  const [tableData, setTableData] = useState([]);
  // console.log(location.state.selectedRows._id);
  // console.log(selectedRow);

  const postNewSectionData = async (newRow) => {
    const section_name = newRow.section_name;
    // const section_id = newRow.section_id;

    try {
      const res = await fetch("/sectionData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section_name,
          // section_id,
          plant_names: location.state.selectedRows._id,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || !data) {
        window.alert("Invalid");
      } else if (res.status === 422) {
        window.alert("Please fill all the details ");
        refreshPage();
      } else {
        console.log("Data Added Successful");
        // countCounter();
        refreshPage();
        // const dateAndTime = timeStamp();
        // const addMessage = `${newRow.user_name} added as a new user`;
        // logData(dateAndTime, addMessage); // send the log data to log management table
        // newPasswordLink(newRow); // to send email for new password
      }
    } catch (error) {
      console.log(error);
    }
  };

  //fetch the user data and show on user management table
  const fetchPlantInfo = async () => {
    try {
      const res = await fetch("/displaySection", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      let arr = [];
      for (let i = 0; i < data.length; i++) {
        console.log(data[i].plant_names);
        if (data[i].plant_names === location.state.selectedRows._id) {
          arr.push(data[i]);
        }
      }
      setTableData(arr);
    } catch (error) {
      console.log(error);
    }
  };

  //fetch the user data and show on user management table

  const columns = [
    {
      title: "Sr No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "10%",
      align: "center",
    },
    {
      title: "Sections ID",
      field: "section_id",
      // editable: false,
      filtering: false,
      align: "center",
      editable: "false",
    },
    {
      title: "Section Name",
      field: "section_name",
      filtering: false,
      align: "center",
    },
  ];
  const actions = [
    // {
    //   name: "remove", // Added custom name property so we know which action to check for
    //   icon: () => <LockIcon />,
    //   // tooltip: <h1>I am a tooltip</h1>,
    //   onClick: (event, selectedRow) => {
    //     // setEmp_number(selectedRow.emp_no);
    //     // setEmp_password(selectedRow.password);
    //     // console.log(employeePassword)
    //     document.getElementById("main_div").style.display = "block";
    //     document.getElementById("main_div").style.pointerEvents = "auto";
    //     document.querySelector(".App").style.pointerEvents = "none";
    //   },
    //   disabled: false, // Set disabled to false by default for all actions
    //   position: "row",
    // },
    // {
    //   // icon: () => <button className="addbutton">Add</button>,
    //   icon: () =>
    //     window.innerWidth > 1024 ? (
    //       <button className="btn">Add</button>
    //     ) : (
    //       <AddBoxIcon />
    //     ),
    //   tooltip: "Add User",
    //   isFreeAction: true,
    //   onClick: (event, rowData) => {
    //     document.getElementById("main_div_reg").style.display = "block";
    //     document.getElementById("main_div_reg").style.pointerEvents = "auto";
    //     document.querySelector(".App").style.pointerEvents = "none";
    //   },
    // },
  ];
  const refreshPage = () => {
    window.location.reload();
  };

  // let CSVAndPDFFileName = `User_Management_${currentDate()}`;

  // selectedRowData();
  useEffect(() => {
    fetchPlantInfo();
  }, []);

  // console.log(section);
  // console.log(selectedRow);

  return (
    <>
      {/* <UpdatePasswordPopup
        emp_password={emp_password}
        emp_number={emp_number}
      /> */}

      <NewUserRegistration />

      <div style={{ margin: "1rem" }}>
        <h4>{location.state.selectedRows.plant_name}</h4>
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
          actions={actions}
          icons={tableIcons}
          columns={columns}
          data={tableData}
          // title="User Management"
          // tableRef={this.tableRef.current.onQueryChange()}

          editable={{
            isDeleteHidden: (rowData) => rowData.user_type === 0,

            onRowAdd: (newRow) =>
              new Promise((resolve, reject) => {
                const updatedRows = [...tableData, { user_id: "", ...newRow }];

                postNewSectionData(newRow);

                setTimeout(() => {
                  // setTableData(updatedRows);                          setRefKey2((refKey2) => refKey2 + 1);
                  setRefKey2((refKey2) => refKey2 + 1);
                  resolve();
                }, 500);
                //refreshPage();
              }),

            onRowDelete: (selectedRow) =>
              new Promise((resolve, reject) => {
                // const index = selectedRow.tableData.id;
                // console.log(index);
                // const updatedRows = [...tableData];
                // updatedRows.splice(index, 1);

                //call the delete user function and pass the user data
                // deleteUserInfo(selectedRow);

                setTimeout(() => {
                  // setTableData(updatedRows);
                  setRefKey2((refKey2) => refKey2 + 1);
                  resolve();
                }, 500);
              }),

            onRowUpdate: (updatedRow, oldRow) =>
              new Promise((resolve, reject) => {
                const index = oldRow.tableData.id;
                const updatedRows = [...tableData];
                updatedRows[index] = updatedRow;
                //call the update user function and pass the user data
                // updateUserInfo(updatedRow);
                setTimeout(() => {
                  // setTableData(updatedRows);
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
            //paginationType: "stepped",
            addRowPosition: "first",
            headerStyle: {
              position: "sticky",
              top: "0",
              fontWeight: "bold",
            },
            maxBodyHeight: "70vh",
          }}
        />
      </div>
      {/* <Footer /> */}
    </>
  );
}

export default SectionPage;
