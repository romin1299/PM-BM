import React, { useState } from "react";

import { CSVLink } from "react-csv";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  MaterialTable,
  tableIcons,
  UserAdd,
  AddBoxIcon,
} from "../../modules/PageModules";

// import UserAdd from "./UserAdd/UserAdd";
import UserUpdate from "../../Popups/UserUpdate";

import "../../Login/Login.scss";
import "../../SCSS/MaterialTable.scss";
import ModeEditIcon from "@mui/icons-material/ModeEdit";

import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";
import EmailConfiguration from "../../Popups/EmailConfiguration";
import Footer from "../../components/Footer/Footer";

const TableComponent = ({
  otherActions = [],
  columns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "7%",
      align: "center",
    },
    {
      title: "TM No.",
      field: "tm_no",
      // editable: false,
      filtering: false,
      align: "center",
      editable: "false",
      width: "7%",
    },
    {
      title: "TM Name",
      field: "tm_name",
      filtering: false,
      align: "center",
      width: "10%",
    },
    // email
    {
      title: "User Type",
      field: "user_type",
      align: "center",
      editable: "false",
      width: "10%",
    },
    // grade
    {
      title: "Department",
      field: "tm_department",
      align: "center",
      editable: "false",
      width: "5%",
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
  ],
  userDataHeaderForCSV = [
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
  ],
}) => {
  const [{ isLoading, data }, setResponseData] = useSafeGetRequest({
    // const [{ isLoading, isError, data }, setResponseData] = useSafeGetRequest({
    url: "/displayUser",
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        tableData: [],
      },
    },
  });
  const [selectedRow, setSelectedRow] = useState([]);

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
        return window.alert("Invalid");
      }
      return setResponseData((responseData) => ({
        ...responseData,
        isLoading: false,
        data: {
          ...responseData?.data,
          tableData: responseData?.data?.tableData?.filter(
            (item) => item?.tm_no !== tm_no
          ),
        },
      }));
    } catch (error) {
      console.log(error);
    }
  };

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
    doc.text(`User Data`, 15, 10);
    autoTable(doc, {
      columns: userDataHeaderForCSV?.map((item) => ({
        header: item?.label,
        dataKey: item?.key,
      })),
      body: data?.tableData,
    });
    doc.save(`User_Data_${timeStamp()}`);
  };

  const actions = [
    {
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
    ...otherActions,
    {
      icon: () => <ModeEditIcon />,
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        document.getElementById("main_div_reg2").style.display = "block";
        document.getElementById("main_div_reg2").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
      disabled: false,
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
          data={data?.tableData}
          filename={`User_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          CSV
        </CSVLink>
      ),
      tooltip: "CSV",
      isFreeAction: true,
    },
  ];

  return (
    <>
      <UserAdd />
      <UserUpdate selectedRow={selectedRow} />
      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>User Management</h4>
          <div style={{ padding: "1rem" }}>
            <MaterialTable
              isLoading={isLoading}
              localization={{}}
              actions={actions}
              icons={tableIcons}
              columns={columns}
              data={data?.tableData}
              editable={{
                onRowDelete: (selectedRow) =>
                  new Promise(async (resolve, reject) => {
                    await deleteUserInfo(selectedRow);
                    resolve();
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
                  boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                  borderRadius: "5px",
                  border: "1px solid rgba(255,255,255)",
                  WebkitBackdropFilter: "blur( 2px )",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(5px)",
                },
                headerStyle: {
                  fontSize: "13px",
                  fontWeight: "bold",
                },
              }}
            />
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

export const AdminUser = () => {
  const [emailConfig, setEmailConfig] = useState("");

  return (
    <>
      {emailConfig}
      <TableComponent
        otherActions={[
          {
            // icon: () => <button className="addbutton">Add</button>,
            icon: () => (
              <button className="btn-warning" style={{ marginRight: "-1px " }}>
                Email Configuration
              </button>
            ),

            // tooltip: "Add User",
            isFreeAction: true,
            onClick: (event, rowData) => {
              setEmailConfig(
                <EmailConfiguration
                  close={() => {
                    setEmailConfig("");
                    document.querySelector(".pageCard").style.pointerEvents =
                      "auto";
                  }}
                />
              );
              // document.getElementById("main_div_reg4").style.pointerEvents = "auto";
              document.querySelector(".pageCard").style.pointerEvents = "none";
            },
          },
        ]}
        columns={[
          {
            title: "Sr. No.",
            render: (rowData) => `${rowData.tableData.id + 1}`,
            align: "center",
            width: "6%",
          },
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
            title: "Plant",
            field: "plant_data",
            align: "center",
            width: "10%",
            // editable: "false",
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
        ]}
        userDataHeaderForCSV={[
          {
            label: "TM No.",
            key: "tm_no",
          },
          {
            label: "TM Name",
            key: "tm_name",
          },
          {
            label: "Email",
            key: "email",
          },
          {
            label: "User Type",
            key: "user_type",
          },
          {
            label: "Grade",
            key: "tm_grade",
          },
          {
            label: "Department",
            key: "tm_department",
          },
          {
            label: "Plant",
            key: "plant_data",

            // editable: "false",
          },
          {
            label: "Joining Date",
            key: "joining_date",
          },
          {
            label: "Contact No",
            key: "contact_no",
          },
          {
            label: "Address",
            key: "address",
          },
        ]}
      />
    </>
  );
};

export const PlantAdminUser = () => {
  return (
    <TableComponent
      columns={[
        {
          title: "Sr. No.",
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
          title: "Email",
          field: "email",
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
          title: "Plant",
          field: "plant_data",
          align: "center",
          width: "10%",
          // editable: "false",
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
        // {
        //   title: "Cell",
        //   field: "cell_data",
        //   align: "center",
        //   width: "10%",
        // },
      ]}
      userDataHeaderForCSV={[
        {
          label: "TM No.",
          key: "tm_no",
        },
        {
          label: "TM Name",
          key: "tm_name",
        },
        {
          label: "Email",
          key: "email",
        },
        {
          label: "User Type",
          key: "user_type",
        },
        {
          label: "Grade",
          key: "tm_grade",
        },
        {
          label: "Department",
          key: "tm_department",
        },
        {
          label: "Plant",
          key: "plant_data",

          // editable: "false",
        },
        {
          label: "Joining Date",
          key: "joining_date",
        },
        {
          label: "Contact No",
          key: "contact_no",
        },
        {
          label: "Address",
          key: "address",
        },
      ]}
    />
  );
};

const OtherUsers = () => {
  return <TableComponent />;
};

export default OtherUsers;
