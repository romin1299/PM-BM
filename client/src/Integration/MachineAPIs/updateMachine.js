const updateMachine = async (updateRow,oldRow) => {
 
    const machine_code= updateRow.machine_code;
    const machine_name= updateRow.machine_name;
    const machine_nickname= updateRow.machine_nickname;
    const machine_sequence= updateRow.machine_sequence;
    const manufacturingDate= updateRow.manufacturingDate;
    const installation_date= updateRow.installation_date;
    const maker_name= updateRow.maker_name;
    const maker_sr_no= updateRow.maker_sr_no;

    try {
        const res = await fetch("/updateMachine", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                machine_code,
                machine_name,
                machine_nickname,
                machine_sequence,
                installation_date,
                manufacturingDate,
                maker_name,
                maker_sr_no,
                oldRow
            }),
        });

        const data = await res.json();

        if (res.status === 400 || !data) {
            window.alert("Invalid");
        } else if (res.status === 422) {
            window.alert("Please fill all the details ");
        } else {
            console.log("Data Updated Successful");

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

export default updateMachine