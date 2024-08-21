const updateSection = async (updateRow, oldRow) => {
    const section_name = updateRow.section_name;
    const section_id = updateRow.section_id;

    try {
        const res = await fetch("/updateSection", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                updateRow,
                section_name,
                section_id,
                oldRow
            }),
        });

        const data = await res.json();

        if (res.status === 400 || !data) {
            window.alert("Invalid");
        } else if (res.status === 422) {
            window.alert("Please fill all the details ");
        } else {
            console.log("Data Added Successful");

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

export default updateSection