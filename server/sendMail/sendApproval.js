const nodemailer = require('nodemailer');
const sendApproval = async (assign_member_name, tm_no, tm_name, machine_code, machine_name, checksheet_status, firstEmail, secondEmail, tlApproval, hosApproval, request, rejected_remarks) => {
    // console.log("}}}}}}}}}}}}", firstEmail, secondEmail)
    // console.log("==============>", tlApproval, hosApproval)
    // console.log("==============>", request)
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
        to: [firstEmail, secondEmail],
        subject: 'Approval Request',
        html: `
        <!doctype html>
<html lang="en-US">
<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta name="description" content="Reset Password Email Template.">
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
</head>
<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #F2F3F8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#E71E25"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700%7COpen+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td >
                <table style="background-color: #E71E25; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center; text-decoration: none; ">
                          <a href="" title="Denso" target="_blank">
                            <H1 style="color:#ffffff;">DENSO-PM</H1>
                          </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                    <h3>Dear ${assign_member_name} ,</h3>
                                        <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                        You have received a new ${checksheet_status} checksheet request</h3>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #CECECE; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                        <h4>From TM No :</h4> ${tm_no}<br/>
                                        <h4>From TM Name : </h4>${tm_name}<br/>
                                        <h4>For Machine Code : </h4>${machine_code}<br/>
                                        <h4>For Machine Name :</h4> ${machine_name}<br/> 
                                        
                                        ${checksheet_status === "Preparation" ?
                `${request === "No" ?
                    "" : `<h4>Tl Approval : </h4>${tlApproval === "Accepted" ? "Accepted" : tlApproval === "Rejected" ? "Rejected" : "Pending"}<br/>`

                } <h4>HOS Approval : </h4>${hosApproval === "Accepted" ? "Accepted" : hosApproval === "Rejected" ? "Rejected" : "Pending"}<br/>`
                : `<h4>PRD Tl Approval : </h4>${tlApproval === "Accepted" ? "Accepted" : tlApproval === "Rejected" ? "Rejected" : "Pending"}<br/>`
            }

                                        
                                        <h4>If rejected then : </h4>${hosApproval === "Accepted" || tlApproval === "Accepted" ? "" : hosApproval === "Rejected" || tlApproval === "Rejected" ? `Rejected remarks is : ${rejected_remarks}` : ""}<br/>

                                        </p>
                                        
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
                            <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>https://www.denso.com/in/en/</strong></p>
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
</html>`
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

module.exports = sendApproval;