using System;

namespace Photomate.Model.ViewModel
{
    public class ViewCouponDetail
    {
        public int CouponId { get; set; }
        public string CouponTitle { get; set; }
        public int? CouponTypeId { get; set; }
        public string CouponTypeName { get; set; }
        public double CouponPrice { get; set; }
        public string ImageLink { get; set; }
        public string Description { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public DateTime? StartedOn { get; set; }
        public DateTime? ExpireOn { get; set; }
        public int? CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public string CountryName { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencySymbol { get; set; }
        public string CreatedByName { get; set; }
        public string ModifiedByName { get; set; }
        public bool? IsDeleted { get; set; }
        public int? CountryId { get; set; }
        public int? Quantity { get; set; }
    }
}
