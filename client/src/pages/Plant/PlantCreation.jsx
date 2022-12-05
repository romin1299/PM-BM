import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  Link,
} from "../../modules/PageModules";

import "../../SCSS/MaterialTable.scss";

function PlantCreation() {
  const [tableData, setTableData] = useState([]);
  const [refKey2, setRefKey2] = useState(0);

  const postNewPlantData = async (newRow) => {
    const plant_name = newRow.plant_name;
    // const plant_id = newRow.plant_id;

    try {
      const res = await fetch("/addNewPlant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plant_name,
          // plant_id,
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
      const res = await fetch("/displayPlant", {
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

  //update the data of the palnt using plant id
  const updatePlantInfo = async (updatedRow) => {
    const plant_name = updatedRow.plant_name;
    const plant_id = updatedRow.plant_id;

    try {
      const res = await fetch("/updatePlant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: plant_id,
          plant_name: plant_name,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else if (res.status === 409) {
        console.logt("Plant already exists");
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
  const deletePlantInfo = async (selectedRow) => {
    try {
      const res = await fetch("/deletePlant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: selectedRow._id,
          plant_id: selectedRow.plant_id,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Plant Deleted Successful");
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

  const columns = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      // width: "10%",
      align: "center",
    },
    {
      title: "Plant Id",
      field: "plant_id",
      // editable: false,
      filtering: false,
      align: "center",
      editable: "false",
    },
    {
      title: "Plant Name",
      field: "plant_name",
      filtering: false,
      align: "center",
    },
  ];
  const actions = [
    (rowData) => {
      return {
        name: "remove", // Added custom name property so we know which action to check for
        icon: () => (
          <Link className="btn" to="/section" state={{ selectedRows: rowData }}>
            Section
          </Link>
        ),
        // tooltip: <h1>I am a tooltip</h1>,
        onClick: (event, selectedRow) => {},
        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },
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

  useEffect(() => {
    // IsUserOrAdmin();
    fetchPlantInfo();
  }, []);
  return (
    <>
      {/* <UpdatePasswordPopup
        emp_password={emp_password}
        emp_number={emp_number}
      /> */}
      <NewUserRegistration />

      <div style={{ margin: "1rem" }}>
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
            // isDeleteHidden: (rowData) => rowData.user_type === 0,
            onRowAdd: (newRow) =>
              new Promise((resolve, reject) => {
                const updatedRows = [...tableData, { user_id: "", ...newRow }];

                postNewPlantData(newRow);

                setTimeout(() => {
                  // setTableData(updatedRows);
                  setRefKey2((refKey2) => refKey2 + 1);

                  resolve();
                }, 500);
                //refreshPage();
              }),
            onRowDelete: (selectedRow) =>
              new Promise((resolve, reject) => {
                const index = selectedRow.tableData.id;
                console.log(index);
                const updatedRows = [...tableData];
                updatedRows.splice(index, 1);

                //call the delete user function and pass the user data
                deletePlantInfo(selectedRow);

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
                updatePlantInfo(updatedRow);
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

      <div></div>
      {/* <Footer /> */}
    </>
  );
}

export default PlantCreation;
