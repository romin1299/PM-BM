const nodemailer = require('nodemailer');
const sendApprovalOfSkippedPM = async (tm_no, tm_name, firstEmail, secondEmail, thirdEmail, fourthEmail,  approvalStatusOfMTDHOS, approvalStatusOfMTDHOD, approvalStatusOfPRDHOS,approvalStatusOfPRDHOD, rejected_remarks, reasonForDelayOfTL) => {
    // console.log("}}}}}}}}}}}}", firstEmail, secondEmail)
    // console.log("==============>", prdtlApproval, mtdhosApproval)
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
        to: [firstEmail, secondEmail, thirdEmail, fourthEmail],
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
    <table cellspacing="0" border="0" cellpadding="0" width="100%"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700%7COpen+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif; background-image: url('https://www.denso.com/in/en/-/media/local/common/about-us/about-us-img-main.png?h=1080&la=en&w=1920&rev=fc658d4d24dd40fdbb2eb2af2d1dc215&hash=C3762A9C17B480E2A689859E302373C4');">
        <tr>
            <td >
                <table style=" max-width:670px;  margin:0 auto;" width="100%" border="0"
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
                                    <h3>Dear all,</h3>
                                        <h3 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                        You have received a new checksheet request</h3>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #CECECE; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                        <h4>From TM No :</h4> ${tm_no}<br/>
                                        <h4>From TM Name : </h4>${tm_name}<br/>
                                        <h4>Reason for delay : ${reasonForDelayOfTL} </h4>
                                        
                                        <h4>MTD HOS Approval : </h4>${approvalStatusOfMTDHOS === "Accepted" ? "Accepted" : approvalStatusOfMTDHOS === "Rejected" ? "Rejected" : "Pending"}<br/> 
                                        <h4>MTD HOD Approval : </h4>${approvalStatusOfMTDHOD === "Accepted" ? "Accepted" : approvalStatusOfMTDHOD === "Rejected" ? "Rejected" : "Pending"}<br/>
                                        <h4>PRD HOS Approval : </h4>${approvalStatusOfPRDHOS === "Accepted" ? "Accepted" : approvalStatusOfPRDHOS === "Rejected" ? "Rejected" : "Pending"}
                                        <h4>PRD HOD Approval : </h4>${approvalStatusOfPRDHOD === "Accepted" ? "Accepted" : approvalStatusOfPRDHOD === "Rejected" ? "Rejected" : "Pending"}
                
                                        <h4>If rejected then : </h4>${approvalStatusOfMTDHOS === "Accepted" || approvalStatusOfMTDHOD === "Accepted" || approvalStatusOfPRDHOS === "Accepted" 
                                        || approvalStatusOfPRDHOD === "Accepted" ? "" : approvalStatusOfMTDHOS === "Rejected" || approvalStatusOfMTDHOD === "Rejected" 
                                        || approvalStatusOfPRDHOS === "Rejected" || approvalStatusOfPRDHOD === "Rejected" ? `Rejected remarks is : ${rejected_remarks}` : ""}<br/>
                                        

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

module.exports = sendApprovalOfSkippedPM;