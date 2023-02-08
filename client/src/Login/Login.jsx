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
import { Row } from 'react-bootstrap'
import Footer from "../components/Footer/Footer";

export const LoginPage = () => {
  const [isRevealPwd, setIsRevealPwd] = useState(false);
  const [invalid, setInvalid] = useState();

  function refreshPage() {
    setTimeout(() => {
      window.location.reload(false);
    });
  }
  const validationSchema = yup.object({
    tm_no: yup
      .number()
      .required("TM no. is required")
      .typeError("You must specify a number")
      .positive()
      .integer(),
    password: yup
      .string("Enter your password")
      .required("Password is required"),
  });
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      tm_no: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // alert("SUCCESS!! :-)\n\n" + JSON.stringify(values, null, 4));
      console.log(values);
      const res = await fetch("/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_no: values.tm_no,
          password: values.password,
        }),
      });
      const data = res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        setInvalid("Invalid credentials !");

        document.getElementById("warnings").style.visibility = "visible";
      } else {
        // window.alert("Login Successful");
        navigate("/", { replace: true });
        refreshPage();
      }
    },
  });
  function hideWarning() {
    document.getElementById("warnings").style.visibility = "hidden";
  }

  return (
    <>
      <main className="mains">
        <div className="containers">
          <div className="wrappers">
            <center>
              <img
                style={{ textAlign: "center" }}
                className="denso_logo"
                src={denso_logo}
                alt=""
                srcSet=""
              />
            </center>
            <div className="headings">
              <h2
                style={{ fontWeight: "600" }}
                className="text text-medium color-text"
              >
                Log In
              </h2>
              <div id="warnings">
                <p style={{ textAlign: "center", color: "red" }}>{invalid}</p>
                <a className="closeIcon" onClick={hideWarning}>
                  <CloseIcon />
                </a>
              </div>
              <form onSubmit={formik.handleSubmit}>
              <div className="pwd-container">
                <label for="input" class="Input-label">
                  TM no:
                </label>
                <div>
                  <input
                    type="text"
                    id="tm_no"
                    name="tm_no"
                    label="User Id"
                    // inputProps={{
                    //   maxLength: 5,
                    // }}
                    autoComplete="off"
                    value={formik.values.tm_no}
                    onChange={formik.handleChange}
                    class="Input-text"
                  />
                  <p style={{ color: "red" }}>
                    {formik.touched.tm_no && formik.errors.tm_no}
                  </p>
                </div>
              </div>

              <div className="pwd-container">
                <label for="input" class="Input-label">
                  Password:
                </label>
                <div>
                  <input
                    id="password"
                    name="password"
                    label="Password"
                    autoComplete="off"
                    type={isRevealPwd ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    class="Input-text"
                  />
                  <img
                    alt=""
                    title={isRevealPwd ? "Hide password" : "Show password"}
                    src={isRevealPwd ? hidePwdImg : showPwdImg}
                    onClick={() => setIsRevealPwd((prevState) => !prevState)}
                  />
                  <p style={{ color: "red" }}>
                    {formik.touched.password && formik.errors.password}
                  </p>
                </div>
              </div>

              <div className="pwd-container">
                <Link
                  to="/resetPasswordPage"
                  style={{
                    // textDecoration: "none",
                    color: "#263A4A",
                  }}
                >
                  Forgot password ?
                </Link>
              </div>
              <br></br>
              <br></br>
              <Row className="d-flex align-items-center justify-content-center">
                <Button
                  variant="contained"

                  type="submit"
                  className="btn bg-button w-50 align-items-center"
                >
                  Login
                </Button>
              </Row>

            </form>
            </div>
           
          </div>
        </div>
      </main>
      <Footer/>
    </>
  );
};

export default LoginPage;
