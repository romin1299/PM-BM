const postPlantToGetSectionInfo = async (selectedPlant, selectedYear, selectedMonth) => {
    try {
        const res = await fetch("/postPlantToGetSectionInfoForSummeryDashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                plants: selectedPlant,
                selectedYear, selectedMonth
            }),
        });
        const data = await res.json();

        if (res.status === 400 || res.status === 422 || !data) {
            console.log("Invalid");
        } else {
            // window.alert(data.abcd);
            console.log("Data post");
            return data
        }
    } catch (error) {
        console.log(error);
    }
};

export default postPlantToGetSectionInfo
