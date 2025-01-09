import React, { useReducer, useState } from "react";
import { Container } from "react-bootstrap";
import RequestSheetOfLTPM from "./RequestSheetOfLTPM";
import BMTitlebar from "../../../../BM/Component/BMTitlebar";
import ChartsToolbar from "../../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { FaEye } from "react-icons/fa";

const DashboardOfLTPM = () => {
  const baseUrlForFiltering = "/getFiltrationValue/cell-level-filtration";
  const [openCloseLTPM, setOpenCloseLTPM] = useState(false);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState(""));

  const openCloseModalOfLTPM = () => {
    setOpenCloseLTPM(!openCloseLTPM);
  };

  const actionOfLTPM = [
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setOpenCloseLTPM(true);
        openCloseModalOfLTPM();
      },
    }),
  ];

  // const getAllLTPMLineWiseSheetData = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get(
  //       `/LTPM/getLineWiseLTPM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`
  //     );
  //     // console.log(response);
  //     setDisplayLineWiseDataOfLTPM(response?.data?.listOfLine);
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   setLoading(false);
  // };

  // useEffect(() => {
  //   if (reduceState?.selectedValue) getAllLTPMLineWiseSheetData();
  // }, [
  //   reduceState?.selectedValue,
  //   reduceState.selectedYear,
  //   reduceState.selectedMonth,
  // ]);

  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="LTPM Dashboard"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              // monthFiltration
              // yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              resetButtonFiltration
              selectedLineOrNot="Yes"
              // isWithLocalStorageForFiltration="Yes"
            />
          }
        />
        {/* <Row>
          <Col>
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
              isLoading={loading}
              actions={actionOfLTPM}
              icons={tableIcons}
              columns={approvalDashboardHeader}
              data={displayLineWiseDataOfLTPM}
              editable={
                {
                  // onRowUpdate: (updatedRow, oldRow) =>
                  // new Promise(async (resolve, reject) => {
                  //   //   await updateRequestSheet(updatedRow);
                  //   resolve();
                  // }),
                }
              }
              options={{
                ...MaterialTableOptions,
                pageSize: 5,
                // exportMenu: [
                //   {
                //     label: "Export PDF",
                //     exportFunc: (cols, data) =>
                //       ExportPdf(
                //         cols,
                //         data,
                //         `Approval List of Request-Sheet ${moment().format(
                //           "DD-MM-YYYY"
                //         )}`
                //       ),
                //   },
                //   {
                //     label: "Export CSV",
                //     exportFunc: (cols, data) =>
                //       ExportCsv(
                //         cols,
                //         data,
                //         `Approval List of Request-Sheet ${moment().format(
                //           "DD-MM-YYYY"
                //         )}`
                //       ),
                //   },
                // ],
              }}
              style={MaterialTableStyle}
              sx={MaterialTableSX}
            />
          </Col>
        </Row> */}
      </Container>

      {reduceState?.selectedValue && (
        <RequestSheetOfLTPM
          reduceState={reduceState}
          selectedLine={reduceState?.selectedLine}
        />
      )}
    </>
  );
};

export default DashboardOfLTPM;
