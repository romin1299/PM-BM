import React from "react";

const LineWiseMachineDetailDashboard = ({ machineData, close }) => {
  console.log(machineData);

  let columns = ["Sr No.", "Machine Code", "Machine Name"];
  return (
    <>
      <div>
        <div id="main_div_reg6">
          <span onClick={close} className="close">
            &times;
          </span>
          <table className="ar-table  td-padding pmSheetApprovalTableCol1">
            <thead className="mt-5">
              <tr>
                {columns.map((tColumn) => (
                  <th className={"td-padding"}>{tColumn}</th>
                ))}
              </tr>
              {machineData?.map((item, index, array) =>
                item ? (
                  <tr className="td-padding">
                    <td className="td-padding">{index + 1}</td>
                    <td className="td-padding">{item.machine_code}</td>
                    <td className="td-padding">{item.machine_name}</td>
                  </tr>
                ) : (
                  ""
                )
              )}
            </thead>
          </table>
        </div>
      </div>
    </>
  );
};

export default LineWiseMachineDetailDashboard;
