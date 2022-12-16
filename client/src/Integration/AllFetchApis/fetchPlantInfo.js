const fetchPlantInfo = async () => {
    try {
        const res = await fetch("/fetchPlantList", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        const data = await res.json();

        return data
        // console.log(data);
    } catch (error) {
        console.log(error);
    }
};

export default fetchPlantInfo
