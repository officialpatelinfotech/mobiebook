using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Model.ViewModel
{
   public class UserProfileMetadata
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string BusinessName { get; set; }
        public string Logo { get; set; }
        public string Phone { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string PinCode { get; set; }
        public string Country { get; set; }
        public string County { get; set; }
        public string City { get; set; }

    }

    public class ViewUserProfileMetadata
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string BusinessName { get; set; }
        public string Logo { get; set; }
        public string Phone { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string PinCode { get; set; }
        public string Country { get; set; }
        public string County { get; set; }
        public string City { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedOn { get; set; }
        public bool? IsWindowApp { get; set; }
        public DateTime? WindowAppActivateDate { get; set; }
        public DateTime? WindowAppDeactivateDate { get; set; }

    }

    public class ManageViewUserMetaData
    {
        public ManageViewUserMetaData()
        {
            UserDetails = new List<ViewUserProfileMetadata>();
        }
        public List<ViewUserProfileMetadata> UserDetails { get; set; }
        public int TotalRecord { get; set; }
    }
}
