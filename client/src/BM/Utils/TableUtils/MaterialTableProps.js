export const MaterialTableOptions = {
  showTitle: false,
  paging: true,
  sorting: true,
  search: true,
  filtering: false,
  exportButton: true,
  exportAllData: true,
  draggable: false,
  actionsColumnIndex: -1,
  pageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
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
    fontSize: 14,
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",

    // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
    // color:"rgba(255,255,255,0.8)",
    borderRadius: "5px",
    border: "1px solid rgba(255,255,255)",
    WebkitBackdropFilter: "blur( 2px )",
    background: "rgba(255,255,255,0.1)",
    // backdropFilter: "blur(5px)",
  },
  headerStyle: {
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "10px",

    backgroundColor: "#0fa3b1", // 6eaebd33, "004b5b", "E3F2FD", f3f3f3
    // color: "#fff", // 004b5b, 000, 000, 000
  },
};

export const MaterialTableStyle = {
  boxShadow: "none",
  border: "1px solid #9f9f9f",
  borderRadius: "6px",
};
export const MaterialTableSX = {
  // "&.MuiTable-root": { border: "1px solid #9f9f9f" },
  "& .MuiTableCell-root": { border: "1px solid #9f9f9f" },
};
