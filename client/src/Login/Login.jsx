import {
  React,
  useFormik,
  yup,
  Button,
  denso_logo,
  useNavigate,
  useState,
  showPwdImg,
  hidePwdImg,
} from "../modules/LoginModules";
import "./Login.scss";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import Footer from "../components/Footer/Footer";
import QR_codeReader from "../BM/QR_codeReader/QR_codeReader";
import LoginComponent from "./LoginSubComponent/LoginComponent";

export const LoginPage = () => {
  return (
    <>
      <main className="mains">
        <Row>
          <Col>
            <QR_codeReader />
          </Col>
          <Col>
            <LoginComponent />
          </Col>
        </Row>
      </main>
      <br />
      <br />
      <br />

      <Footer />
    </>
  );
};

export default LoginPage;
