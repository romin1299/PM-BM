import Container from 'react-bootstrap/Container';
import './Footer.css'

function Footer() {
  return (
    <>
      <div className='mt-5'>
        <div id="footer">
          {/* <p>© 2020 <span style={{ color: "red" }}>Denso</span>. All rights reserved</p> */}
          <p>
            © {new Date().getFullYear()}<span style={{ color:"#dc3545"}}><b> Denso</b></span>. All rights reserved.
          </p>
        </div>
      </div>


    </>
  );
}

export default Footer;