const nodemailer = require('nodemailer');
const sendMailForAnnualPmScheduleReport = async (toEmail, lineAndCellData) => {

    // console.log(toEmail)

    let transpoter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secureConnection: false,
        tls: {
            ciphers: 'SSLv3'
        },
        auth: {
            user: "sm_sample11@outlook.com",
            pass: "Sendemail@111"
        }
    });
    //sending an email for forgot password
    let mailOptions = {
        from: "sm_sample11@outlook.com",
        to: [toEmail],
        // cc: ccEmailArray,
        subject: "Annual Pm Schedule Report Approval",
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
                                    <h3>Dear Sir/Mam,</h3>
                                      <h3>Kindly Approve Annual PM Schedule Report. </h3>
                                      
                                   <h3>Cell/Product: ${lineAndCellData?.cell_names?.cell_name}</h3>
                                      
                                      <h3>Line: ${lineAndCellData?.line_name}</h3>
                                                                     
                                    </td>
                                </tr>
                              
                                <tr>
                                    <td style="height:1rem;">&nbsp;</td>
                                </tr>
                                
                               
                            </table>
                        </td>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                            <a href="https://www.denso.com/in/en/" title="Denso" target="_blank" style="font-size:14px; color:white; line-height:18px; margin:0 0 0;">
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

module.exports = sendMailForAnnualPmScheduleReport;