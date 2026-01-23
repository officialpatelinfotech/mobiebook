using System;

namespace Photomate.Model.ViewModel
{
    public class CartViewMetaData
    {
        public int? RequestId { get; set; }
        public int? CouponId { get; set; }
        public string CouponTitle { get; set; }
        public int? UserId { get; set; }
        public int? RequestQuantity { get; set; }
        public int? CouponQuantity { get; set; }
        public int? StatuId { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? AcceptedOn { get; set; }
        public int? AccpetedBy { get; set; }
        public double? CouponPrice { get; set; }
        public int? AcceptedQuantity { get; set; }
        public double? TotalPrice { get; set; }
        public string Notes { get; set; }
        public string CouponType { get; set; }
        public string CurrencySymbol { get; set; }
    }

    public class CustomerRequestedCoupons : CartViewMetaData
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string BusinessName { get; set; }
        public string Phone { get; set; }
    }
}

