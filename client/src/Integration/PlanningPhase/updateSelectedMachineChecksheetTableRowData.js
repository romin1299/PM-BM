const updateSelectedMachineCheckSheetTableRowData = async (oldRow, updatedRow, machineCode) => {
    try {
        const res = await fetch("/updateSelectedMachineCheckSheetTableRowDataForStartingMonth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                oldRow,
                rowData: updatedRow,
                machineId: machineCode,
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

export default updateSelectedMachineCheckSheetTableRowData 
