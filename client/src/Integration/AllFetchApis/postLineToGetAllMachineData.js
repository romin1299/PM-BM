const postLineToGetAllMachineData = async (selectedLine, currentYear) => {
    // formik.setFieldValue("selectedMachine", "");

    try {
        const res = await fetch("/postLineToGetMachineListForReportDashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                line: selectedLine,
                selectedYear: currentYear,
            }),
        });
        const data = await res.json();

        if (res.status === 400 || res.status === 422 || !data) {
            console.log("Invalid");
        } else {
            return data
            // console.log("Data post", data);
            // setAllMachineDataBasedOnLine(data?.machineInfo);
        }
    } catch (error) {
        console.log(error);
    }
};

export default postLineToGetAllMachineData
