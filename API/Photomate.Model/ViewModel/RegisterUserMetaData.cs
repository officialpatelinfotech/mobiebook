namespace Photomate.Model.ViewModel
{
    public class RegisterUserMetaData
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class LoginMetaData
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }

    public class UserWindowAppStatus
    {
        public int UserId { get; set; }
        public bool Status { get; set; }
    }
}
