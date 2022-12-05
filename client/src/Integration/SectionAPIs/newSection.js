const newSection = async (newRow, plant) => {
    const section_name = newRow.section_name;
    const dashboardLevel = newRow.dashboardLevel;

    // console.log(section_id)

    try {
        const res = await fetch("/addNewSection", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                section_name,
                plant_names: plant,
                dashboardLevel
            }),
        });

        const data = await res.json();

        if (res.status === 400 || !data) {
            window.alert("Invalid");
        } else if (res.status === 422) {
            window.alert("Please fill all the details ");
        } else {
            console.log("Data Added Successful");
            // (refKey) => refKey + 1;
            // countCounter();
            // const dateAndTime = timeStamp();
            // const addMessage = `${newRow.user_name} added as a new user`;
            // logData(dateAndTime, addMessage); // send the log data to log management table
            // newPasswordLink(newRow); // to send email for new password
        }


    } catch (error) {
        console.log(error);
    }
};

export default newSection