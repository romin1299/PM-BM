import { useState, useMemo } from "react";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import {
  AddBoxIcon,
  tableIcons,
  MaterialTable,
} from "../../../modules/PageModules";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { CSVLink } from "react-csv";
import UserAddOrEdit from "./UserAddOrEdit";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

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

const timeStamp = () => {
  let date = new Date();
  let getTime = date
    .toLocaleTimeString("en-IN", {
      hour12: true,
    })
    .replace(/(.*)\D\d+/, "$1");
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${day}/${month}/${year} - ${getTime}`;
};

const SpareUserManagement = () => {
  const [{ isLoading, data }, setResponseData] = useSafeGetRequest({
    url: "/v1/spare/toolRoom/user/all",
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        tableData: [],
      },
    },
  });

  const handleUpdateTableData = ({ user, action = "ADD" }) => {
    setResponseData((responseData) => ({
      ...responseData,
      data: {
        tableData:
          action === "ADD"
            ? [...responseData?.data?.tableData, user]
            : action === "EDIT"
              ? responseData?.data?.tableData?.map((item) =>
                  item?._id === user?._id ? user : item,
                )
              : responseData?.data?.tableData?.filter(
                  (item) => item?._id !== user?._id,
                ),
      },
    }));
  };

  const handleDelete = async ({ _id }) => {
    const { isError, user } = await axiosGetOrDelete({
      apiType: "delete",
      url: "/v1/spare/toolRoom/user",
      axiosProps: {
        params: {
          _id,
        },
      },
    });
    if (!isError) return handleUpdateTableData({ user, action: "DELETE" });
  };

  const [modalState, setModalState] = useState({
    show: false,
    isEdit: false,
    selectedRow: {},
  });

  const handleModalState = (
    propState = {
      isEdit: false,
      selectedRow: {},
    },
  ) =>
    setModalState((prev) => ({
      ...prev,
      show: !prev?.show,
      ...propState,
    }));

  const columns = useMemo(
    () => [
      { title: "Sr. No.", render: (rowData) => rowData.tableData.id + 1 },
      { title: "TM No.", field: "tm_no" },
      { title: "TM Name", field: "tm_name" },
      { title: "Email", field: "email" },
      { title: "User Type", field: "user_type" },
      { title: "Grade", field: "tm_grade" },
      { title: "Plant", field: "plant_data" },
      { title: "Section", field: "section_data" },
      { title: "Sub Section", field: "subSection_data" },
      { title: "Cell/Product", field: "cell_data" },
    ],
    [],
  );

  const actions = useMemo(
    () => [
      {
        icon: () =>
          window.innerWidth > 1024 ? (
            <button className="btn-reset">Add</button>
          ) : (
            <AddBoxIcon />
          ),

        tooltip: "Add User",
        isFreeAction: true,
        onClick: () => {
          handleModalState();
        },
      },
      {
        icon: () => <ModeEditIcon />,
        onClick: (event, selectedRow) => {
          handleModalState({
            isEdit: true,
            selectedRow,
          });
        },
        disabled: false,
        position: "row",
      },
      {
        icon: () => <button className="downloadPDF">PDF</button>,
        tooltip: "PDF",
        isFreeAction: true,
        onClick: (event) => {
          console.log("download...");
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
        tooltip: "PDF",
        isFreeAction: true,
      },
    ],
    [data?.tableData],
  );

  return (
    <>
      {modalState?.show && (
        <UserAddOrEdit
          {...modalState}
          handleModalState={handleModalState}
          handleUpdateTableData={handleUpdateTableData}
        />
      )}
      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>User Management</h4>
          <div style={{ padding: "1rem" }}>
            <MaterialTable
              isLoading={isLoading}
              actions={actions}
              icons={tableIcons}
              columns={columns}
              data={data?.tableData}
              editable={{
                onRowDelete: (selectedRow) =>
                  new Promise(async (resolve, reject) => {
                    await handleDelete(selectedRow);
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
                  position: "sticky",
                  top: "0",
                  fontSize: "13px",
                  fontWeight: "bold",
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SpareUserManagement;
