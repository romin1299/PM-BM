import React, { useEffect, useState } from 'react'
import ContextAPI from './ContextAPI'

const ContextAPIState = (props) => {

  const [plantList, setPlantList] = useState([])

  //fetch all section head for showing or selecting in dropdown by common user
  const fetchPlantList = async () => {
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
      //   console.log(data);
      setPlantList(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPlantList();
  }, []);
  return (

    <ContextAPI.Provider value={{ plantList }}>
      {props.children}
    </ContextAPI.Provider >

  )
}

export default ContextAPIState;