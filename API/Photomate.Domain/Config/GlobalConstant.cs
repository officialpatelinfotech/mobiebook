using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Domain.Config
{
    public class GlobalConstant
    {
        public const string ForgotPasswordSubject = "Request for Password reset - Mobiebook";
        public const string ForgotPasswordMessage = "Dear [NAME], <br/><br/>You recently requested to reset your password for login - [EMAIL]<br/><br/>Please click here [LINK] to reset your password.<br/><br/>Arigato (thank you) <br/><br/>Mobiebook Team";
    }

    public enum AlbumStatus
    {
        OPEN,
        INPROGRESS,
        PUBLISHED
    }

    public enum UserTypeEnum
    {

    }
}
