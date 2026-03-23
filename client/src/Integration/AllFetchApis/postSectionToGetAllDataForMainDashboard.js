const postSectionToGetAllDataForMainDashboard = async (section_data, selectedYear) => {
    // setSubSection(undefined);
    try {
        const res = await fetch("/postSectionToGetLineData", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                section: section_data,
                selectedYear
            }),
        });
        const data = await res.json();

        if (res.status === 400 || res.status === 422 || !data) {
            console.log("Invalid");
        } else {
            return data
        }
    } catch (error) {
        console.log(error);
    }
};

export default postSectionToGetAllDataForMainDashboard
