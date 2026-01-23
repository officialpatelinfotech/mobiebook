using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Model.ViewModel
{
    public class LoginUserMetaData
    {
        public string UserName { get; set; }
        public string UserPassword { get; set; }
        public bool RememberMe { get; set; }
       
    }

    public class LoginUserDetailMetaData
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string FullName { get; set; }
        public string Logo { get; set; }
        public string Password { get; set; }
        public int? UserTypeId { get; set; }
        public string UserTypeName { get; set; }
        public string SaltPassword { get; set; }
        public bool? IsWindowApp { get; set; }
    }

    public class ForgotPasswordMetaData
    {
        public string Email { get; set; }
    }

    public class UpdatePasswordMetaData
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }


}
