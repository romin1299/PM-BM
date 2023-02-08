import React, { useState, useEffect, useContext } from "react";
// import { useContext } from "../components/NavbarComponent/ImportModules";
import "../Popups/Profile.css";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
// import Footer from "../pages/Footer";
import userImg from "../images/user.png";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import RoutingContext from "../context/routing/RoutingContext";
import Footer from "../components/Footer/Footer";
// import Footer from "./Footer";

const Profile = () => {
  const [tm_name, setTm_name] = useState("");
  const [userPhoto, setUserPhoto] = useState([]);

  const context = useContext(RoutingContext);

  // console.log(context);
  // console.log(typeof tm_name);
  // console.log(userPhoto);

  const updateProfile = async (e) => {
    e.preventDefault();
    // console.log(userData.photo);
    // console.log(userPhoto);
    // console.log(userPhoto.length);
    const tm_no = context.tm_no;
    const tm_Name = tm_name === "" ? context.tm_name : tm_name;
    const Pic = userPhoto.length === 0 ? context.photo : userPhoto;
    // console.log(tm_no);
    // console.log(tm_Name);
    // console.log(Pic);
    // window.location.reload();
    // console.log(tm_name);
    const formData = new FormData();
    formData.append("photo", Pic);
    formData.append("tm_name", tm_Name);
    formData.append("tm_no", tm_no);
    // console.log(formData);

    axios
      .post("/updateUserProfile", formData)
      .then((res) => {
        console.log(res);
        window.location.reload();
      })
      .catch((err) => {
        window.alert("Only .png, .jpg and .jpeg format allowed!");
        console.log(err);
      });
  };

  // console.log(context.photo);

  return (
    <>
      <div id="profile">
        <Container>
          <Row>
            <Col sm={12} lg={6}>
              <div className="profileImg">
                <img
                  className="p_img"
                  name="userPhoto"
                  src={context.photo == undefined ? userImg : context.photo}
                  // onChange={(e) => setUserPhoto(e.target.files)}
                  alt=""
                />
                <div className="profileName">
                  <h2>{context.tm_name}</h2>
                </div>
              </div>
            </Col>
            <Col sm={12} lg={6}>
              <div className="profileDetails">
                <Form
                  onSubmit={updateProfile}
                  // method="post"
                  encType="multipart/form-data"
                >
                  {/* <div className="profileImg" data-aos="fade-right">
                    <input
                      type="file"
                      onChange={(e) => setUserPhoto(e.target.value)}
                      alt=""
                    />
                  </div> */}
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label className="text-muted">Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      autoComplete="off"
                      placeholder={context.tm_name}
                      value={tm_name}
                      onChange={(e) => setTm_name(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label className="text-muted">User Type</Form.Label>
                    <Form.Control
                      type="text"
                      value={context.user_type}
                      disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label className="text-muted">TM Number</Form.Label>
                    <Form.Control
                      type="email"
                      // placeholder="Enter email"
                      value={context.tm_no}
                      disabled
                    />
                    {/* <Form.Text className="text-muted">
                      We'll never share your email with anyone else.
                    </Form.Text> */}
                  </Form.Group>
                  <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label className="text-muted">
                      Upload profile image
                    </Form.Label>
                    <Form.Control
                      type="file"
                      name="photo"
                      accept="image/jpeg,image/png, image/jpeg"
                      // value={userPhoto}
                      onChange={(e) => setUserPhoto(e.target.files[0])}
                    />
                  </Form.Group>
                  {/* <a href="/updatePassword">
                    <Button
                      variant="primary"
                      // size="sm"
                      style={{ marginBottom: "1rem" }}
                    >
               
                      Update password
                    </Button>
                  </a> */}
                  <Form.Group className="mt-5">
                    <Button

                      type="submit"
                      className="me-2 btn-primary1"
                    >
                      Save
                    </Button>
                    <Button style={{ background: "#004B5B" }} >
                      <Link
                        to="/updatePassword"
                        style={{ color: "white", textDecoration: "none" }}
                      >
                        Update Password
                      </Link>
                    </Button>
                  </Form.Group>

                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
