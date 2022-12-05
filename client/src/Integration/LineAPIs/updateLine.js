const updateLine = async (updateRow,oldRow) => {
    const line_name = updateRow.line_name;
    const line_id = updateRow.line_id;
    const line_sequence = updateRow.line_sequence;

    try {
        const res = await fetch("/updateLine", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                line_name,
                line_id,
                line_sequence,
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

export default updateLine