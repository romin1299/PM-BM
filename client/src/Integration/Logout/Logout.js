const Logout = async (userData) => {
    // const navigate = useNavigate();
    try {
        const res = await fetch("/logout", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (res.status === 400 || res.status === 422) {
            return res.status(422).send("Data not recieved !!!");
        }
        try {
            const res = await fetch("/clearTokens", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tm_no: userData.tm_no,
                }),
            });
            const data = await res.json();
    
            if (res.status === 400 || res.status === 422 || !data) {
                console.log("Invalid");
            } else {
                // navigate("/", { replace: true });
                console.log("Data post");
                return data
            }
        } catch (error) {
            console.log(error);
        }
        // refreshPage();
    } catch (error) {
        console.log("No data found ( Unauthorized ) !!!");
    }
};


export default Logout 