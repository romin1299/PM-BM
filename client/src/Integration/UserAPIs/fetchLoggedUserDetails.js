const fetchLoggedUserDetails = async () => {
    try {
        const res = await fetch("/loggedUserDetails", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        const data = await res.json();

        if (res.status === 400 || res.status === 422 || !data) {
            return res.status(422).send("Data not recieved !!!");
        } else {
            return data
        }
    } catch (error) {
        console.log("No data found ( Unauthorized ) !!!");
    }
};


export default fetchLoggedUserDetails
