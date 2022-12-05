const postNewPlantData = async (newRow) => {
    const plant_name = newRow.plant_name;
    // const plant_id = newRow.plant_id;

    try {
        const res = await fetch("/addNewPlant", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                plant_name,
                // plant_id,
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

        return data
    } catch (error) {
        console.log(error);
    }
};

export default postNewPlantData