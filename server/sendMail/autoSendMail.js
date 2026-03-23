const nodemailer = require("nodemailer");
const EmailConfigurationController = require("../controller/emailConfigurationController");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

const autoSendMail = async (
  toMailArray,
  ccEmailArray,
  sectionName,
  subject,
  title,
  dataTable,
  title1,
  dataTable1,
  title2,
  dataTable2,
  text
) => {
  try {
    // console.log("}}}}}}}}}}}}", firstEmail, secondEmail)
    // console.log("==============>", tlApproval, hosApproval)
    // console.log("==============>", request)

    // console.log(assign_member_name, tm_no, tm_name, machine_code, machine_name,
    //     checksheet_status, firstEmail, secondEmail, tlApproval, hosApproval, request, rejected_remarks)

    // console.log(toMailArray, ccEmailArray, subject, title1)
    let emailConfData = await EmailConfigurationController();

    let transpoter = nodemailer.createTransport({
      service: "smtp-mail.outlook.com",
      // pool: true,
      host: emailConfData.serverIP,
      port: emailConfData.emailPort,
      secureConnection: false,
      secure: false,
      logger: false,
      debug: false,

      // ignoreTLS: true
      tls: {
        ciphers: "SSLv3",
      },
      // auth: {
      //     user: "sm_sample11@outlook.com",
      //     pass: "Sendemail@111"
      // }
    });
    //sending an email for forgot password
    let mailOptions = {
      from: emailConfData.fromEmailId,
      to: toMailArray,
      cc: ccEmailArray,
      subject: subject,
      html: `
          <!doctype html>
  <html lang="en-US">
  <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <meta name="description" content="Reset Password Email Template.">
      <style type="text/css">
          a:hover {text-decoration: underline !important;},
      </style>
  </head>
  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #F2F3F8;" leftmargin="0">
      <!--100% body table-->
      <table cellspacing="0" border="0" cellpadding="0" width="100%" 
          style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700%7COpen+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
          <tr>
              <td >
                  <table style="background-image: radial-gradient( circle farthest-corner at 92.3% 71.5%,  rgba(83,138,214,1) 0%, rgba(134,231,214,1) 90% ); margin:0 auto;" width="100%" border="0"
                      cellpadding="0" cellspacing="0">
                      <tr>
                          <td style="text-align:center; text-decoration: none; ">
                            <a href="" title="Denso" target="_blank" style="color:white;">
                              <H1>DENSO-PM</H1>
                            </a>
                          </td>
                      </tr>
                      <tr>
                          <td>
                              <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                  style="background:#fff; border-radius:3px;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                      <td style="padding:0 35px;">
                                      <h3>Dear Sir/Mam,</h3>
                                      ${text}
                                      <div style="text-align:center">
                                        <h3>
                                        Section/SubSection Name : ${sectionName}
                                        </h3>
                                      <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:20px;font-family:'Rubik',sans-serif;">
                                       
                                      ${title}
                                      
                                      </h3>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:10px 0 26px; border-bottom:1px solid #CECECE; width:100px; "></span>
                                    </div>
  
                                    ${dataTable}
                                                                       
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:1rem;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                      <td style="padding:0 35px;">
                                      <div style="text-align:center">
                                        
                                      <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:20px;font-family:'Rubik',sans-serif;">
                                       
                                      ${title1}
                                      
                                      </h3>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:10px 0 26px; border-bottom:1px solid #CECECE; width:100px; "></span>
                                    </div>
  
                                    ${dataTable1}
                                                                       
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:1rem;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                      <td style="padding:0 35px;">
                                      <div style="text-align:center">
                                      
                                      <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:20px;font-family:'Rubik',sans-serif;">
                                      
                                      ${title2}
                                      
                                      </h3>
                                      <span
                                          style="display:inline-block; vertical-align:middle; margin:10px 0 26px; border-bottom:1px solid #CECECE; width:100px; "></span>
                                       </div>
  
                                      ${dataTable2}
                                                                      
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                              </table>
                          </td>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                              <a href=${process.env.BASE_URL} title="Denso" target="_blank" style="font-size:14px; color:black; line-height:18px; margin:0 0 0;">
                              <strong>${process.env.BASE_URL}</strong>
                              </a>
                        </td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                              <p style="font-size:14px; color:black; line-height:18px; margin:0 0 0;">
                              &copy; <strong>All Rights Reserved By DENSO(DNHA)</strong>
                              </p>
                        </td>
                      </tr>
                      <tr>
                          <td style="height:80px;">&nbsp;</td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
      <!--/100% body table-->
  </body>
  </html>`,
    };

    transpoter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
};

module.exports = autoSendMail;
