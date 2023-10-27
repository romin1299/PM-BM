import {
  React,
  useFormik,
  yup,
  Button,
  useNavigate,
  useState,
  denso_logo,
} from "../../modules/LoginModules";
import "../Login.scss";
import { IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import { Row, Col, Form } from "react-bootstrap";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, AlertTitle } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const LoginCard = ({ scannedMachineId, windowWidth }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [invalid, setInvalid] = useState();
  const navigate = useNavigate();

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

  const formik = useFormik({
    initialValues: {
      tm_no: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // alert("SUCCESS!! :-)\n\n" + JSON.stringify(values, null, 4));
      // console.log(values);
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
        if (scannedMachineId) {
          //call request-sheet component
          navigate(`/bm/check-sheet/scanned/${scannedMachineId}`);
          // refreshPage();
        } else {
          navigate("/bm", { replace: true });
          // refreshPage();
        }
      }
    },
  });

  return (
    <>
      {scannedMachineId && (
        <div>
          <IconButton
            color="primaryText"
            aria-label="back"
            onClick={() => {
              navigate("/");
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </div>
      )}

      {windowWidth && windowWidth > 820 && (
        <center>
          <img
            style={{ textAlign: "center", marginBottom: "1rem" }}
            className="denso_logo"
            src={denso_logo}
            alt=""
            srcSet=""
          />
        </center>
      )}

      <div className="headings">
        <h2
          style={{
            fontWeight: "600",
            textAlign: "center",
            margin: "1rem 0px 2rem 0px",
            // textTransform: "uppercase",
          }}
          className="text text-medium color-text"
        >
          Log In
        </h2>
      </div>

      <form onSubmit={formik.handleSubmit} className="container">
        <Row className="gy-3">
          <Col md={12} xs={12}>
            <Form.Group>
              <Form.Label className="Input-label">
                <b>TM No:</b>
              </Form.Label>
              <Form.Control
                type="text"
                id="tm_no"
                name="tm_no"
                label="User Id"
                autoComplete="off"
                placeholder="Enter Your TM Number"
                value={formik.values.tm_no}
                onChange={formik.handleChange}
              />

              {formik.touched.tm_no && (
                <Form.Text className="text-danger">
                  {formik.errors.tm_no}
                </Form.Text>
              )}
            </Form.Group>
          </Col>

          <Col md={12} xs={12}>
            <Form.Group>
              <Form.Label className="Input-label">
                <b>Password:</b>
              </Form.Label>
              <div className="input-container">
                <Form.Control
                  id="password"
                  name="password"
                  label="Password"
                  autoComplete="off"
                  placeholder="Enter Password"
                  type={showPassword ? "text" : "password"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  class="Input-text"
                />
                <button
                  type="button"
                  className={`eye-btn`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </button>
              </div>
              {formik.touched.password && (
                <Form.Text className="text-danger">
                  {formik.errors.password}
                </Form.Text>
              )}
            </Form.Group>
          </Col>

          {invalid && (
            <Col>
              <Alert severity="error" sx={{ m: "16px 0px" }}>
                <AlertTitle>{invalid}</AlertTitle>
                Your TM Number or password is incorrect
              </Alert>
            </Col>
          )}
        </Row>

        <div className="pwd-container mt-1 ps-1">
          <Link
            to="/resetPasswordPage"
            style={{
              fontSize: "12px",
              color: "#263A4A",
            }}
          >
            Forgot password ?
          </Link>
        </div>

        <Row
          style={{ margin: "2rem 0px" }}
          className="d-flex align-items-center justify-content-center"
        >
          <Button
            variant="contained"
            type="submit"
            className="btn bg-button w-50 align-items-center"
          >
            Login
          </Button>
        </Row>
      </form>
    </>
  );
};

export default LoginCard;
