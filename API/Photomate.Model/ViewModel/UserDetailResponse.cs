using System;

namespace Photomate.Model.ViewModel
{
    public class UserDetailResponse
    {
        public int UserId { get; set; }
        public string UserType { get; set; }
        public int? UserTypeId { get; set; }
        public string UserName { get; set; }
        public string UserMenuDetails { get; set; }
        public string Token { get; set; }
        public string Logo { get; set; }
        public string FullName { get; set; }
        public bool? IsWindowApp { get; set; }
    }

    public class UserDetailByTokenMetaData
    {
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public string UserToken { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? ExpiredOn { get; set; }
        public int? UserType { get; set; }
    }
}
