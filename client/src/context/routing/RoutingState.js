import React, { useEffect, useState } from 'react'
import RoutingContext from './RoutingContext'

const RoutingState = (props) => {
    const [userData, setUserData] = useState({});

    const isCurrentUser = async () => {
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

            setUserData(data);

            if (res.status === 400 || res.status === 422 || !data) {
                return res.status(422).send("Data not recieved !!!");
            }
        } catch (error) {
            console.log("No data found ( Unauthorized ) !!!");
        }
    };

    // console.log(userData)

    useEffect(() => {
        isCurrentUser();
    }, []);


    return (

        <RoutingContext.Provider value={userData}>
            {props.children}
        </RoutingContext.Provider >

    )
}

export default RoutingState;