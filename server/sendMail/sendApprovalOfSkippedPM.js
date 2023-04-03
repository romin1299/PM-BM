const nodemailer = require('nodemailer');
const EmailConfigurationController = require('../controller/emailConfigurationController')

const sendApprovalOfSkippedPM = async (tm_no, tm_name, firstEmail, secondEmail, thirdEmail, fourthEmail, approvalStatusOfMTDHOS, approvalStatusOfMTDHOD, approvalStatusOfPRDHOS, approvalStatusOfPRDHOD, rejected_remarks, reasonForDelayOfTL) => {
    // console.log("}}}}}}}}}}}}", firstEmail, secondEmail)
    // console.log("==============>", prdtlApproval, mtdhosApproval)
    // console.log("==============>", request)
    let emailConfData = await EmailConfigurationController()

    let transpoter = nodemailer.createTransport({
        service: 'smtp-mail.outlook.com',
        // pool: true,
        host: emailConfData.serverIP,
        port: emailConfData.emailPort,
        secureConnection: false,
        secure: false,
        logger: true,
        debug: true,

        // ignoreTLS: true
        tls: {
            ciphers: 'SSLv3'
        },
        // auth: {
        //     user: "sm_sample11@outlook.com",
        //     pass: "Sendemail@111"
        // }
    });
    //sending an email for forgot password
    let mailOptions = {
        from: emailConfData.fromEmailId,
        to: [firstEmail, secondEmail, thirdEmail, fourthEmail],
        subject: 'Approval Request',
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
                                style="max-width:670px;background:#fff; border-radius:3px;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                    <h3>Dear All ,</h3>
                                    <div style="text-align:center">
                                      
                                    <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:20px;font-family:'Rubik',sans-serif;">
                                      Approval Request For Skip PM Data</h3>
                                      <span
                                          style="display:inline-block; vertical-align:middle; margin:10px 0 26px; border-bottom:1px solid #CECECE; width:100px; "></span>
                                  </div>
                                  <table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

<tr>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">MTD HOS Approval</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${approvalStatusOfMTDHOS === "Accepted" ? "Accepted" : approvalStatusOfMTDHOS === "Rejected" ? "Rejected" : "Pending"}</td>
</tr>

<tr style="background-color: #dddddd;">
  <td style="border: 1px solid black;text-align: left;padding: 8px;">MTD HOD Approval</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${approvalStatusOfMTDHOD === "Accepted" ? "Accepted" : approvalStatusOfMTDHOD === "Rejected" ? "Rejected" : "Pending"}</td>
</tr>

<tr>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">PRD HOS Approval</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${approvalStatusOfPRDHOS === "Accepted" ? "Accepted" : approvalStatusOfPRDHOS === "Rejected" ? "Rejected" : "Pending"}</td>
</tr>

<tr style="background-color: #dddddd;">
    <td style="border: 1px solid black;text-align: left;padding: 8px;">PRD HOD Approval</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${approvalStatusOfPRDHOD === "Accepted" ? "Accepted" : approvalStatusOfPRDHOD === "Rejected" ? "Rejected" : "Pending"}</td>
</tr>
 
<tr>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">Submitted by</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${tm_name}</td>
</tr>   

<tr style="background-color: #dddddd;">
    <td style="border: 1px solid black;text-align: left;padding: 8px;">Reason for delay</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${reasonForDelayOfTL}</td>
</tr>

</table>
                                        
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
                            <a href="https://www.denso.com/in/en/" title="Denso" target="_blank" style="font-size:14px; color:black; line-height:18px; margin:0 0 0;">
                            &copy; <strong>All Rights Reserved By DENSO(DNHA)</strong>
                            </a>
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
</html>
        `
    }

    transpoter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendApprovalOfSkippedPM;