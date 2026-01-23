using System;

namespace Photomate.Model.ViewModel
{
    public class ForgotPasswordDetail
    {
        public int UserId { get; set; }
        public string UniqId { get; set; }
        public DateTime? RequestedOn { get; set; }
        public DateTime? ExpiredOn { get; set; }
        public bool? IsUsed { get; set; }
        public int ForgotPasswordId { get; set; }
    }

    public class ResetPasswordMetaData
    {
        public string UniqId { get; set; }
        public string Password { get; set; }
    }
}
