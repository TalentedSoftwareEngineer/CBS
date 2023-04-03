using System;
using System.Web.Mail;

namespace ProsbcService
{
    public class SendEmail
    {
        public SendEmail()
        {
        }

        public static void SendError(string strError)
        {
            //don't send ,now
            return;
            MailMessage message = new MailMessage();
            message.From = "admin@digitalnrg.com";
            message.To = "hjchotmail@hotmail.com;laura_shrewd@hotmail.com";
            message.Subject = "cdr import error " + System.DateTime.Now.ToString();
            message.Body = strError;
            message.BodyFormat = MailFormat.Html;
            message.Priority = MailPriority.High;
            message.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate", "1");
            message.Fields.Add("http://schemas.microsoft.com/cdo/configuration/sendusername", "admin@digitalnrg.com");
            message.Fields.Add("http://schemas.microsoft.com/cdo/configuration/sendpassword", "dnrg2005");
            message.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpserverport", 26);
            SmtpMail.SmtpServer = "mail.digitalnrg.com";
            SmtpMail.Send(message);
        }
    }
}
