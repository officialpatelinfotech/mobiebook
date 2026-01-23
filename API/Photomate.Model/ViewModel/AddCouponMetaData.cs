using System;

namespace Photomate.Model.ViewModel
{
    public class AddCouponMetaData
    {
        public int CouponId { get; set; }
        public string Title { get; set; }
        public decimal? Price { get; set; }
        public int CountryId { get; set; }
        public string Description { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? StartedOn { get; set; }
        public DateTime? ExpireOn { get; set; }
        public int? CouponTypeId { get; set; }
        public string ImageLink { get; set; }
        public int? Quantity { get; set; }

    }

    public class CouponRequestMetaData
    {
        public int? StatusId { get; set; }
        public int? CouponType { get; set; }
    }

    public class ApproveMetaData
    {
        public int? RequestId { get; set; }
        public int? Quantity { get; set; }
        public double? Price { get; set; }
        public string Notes { get; set; }
        public int? UserId { get; set; }
    }
}
