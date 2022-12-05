const updateSubSection = async (updateRow, oldRow) => {
    const subSection_name = updateRow.subSection_name;
    const subSection_id = updateRow.subSection_id;
    const subSection_sequence = updateRow.subSection_sequence;

    try {
        const res = await fetch("/updateSubSection", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                subSection_name,
                subSection_id,
                subSection_sequence,
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

export default updateSubSection