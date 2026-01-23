namespace Photomate.Domain.Config
{
    public class MasterConst
    {
        public const string BusinessType = "BST";
        public const string CouponType = "COPTP";
        public const int AdminUser = 1;
        public const int LabUser = 2;
        public const int PhotographerUser = 3;
    }

    public class TableDetailToDelete
    {
        public const string Coupon = "coupon";
        public const string CartTable = "customer_coupon_request";
    }

    public class TableDetailContent
    {
        public const string Coupon = "COUPON";
        public const string Email = "Email";
        public const string UserName = "UserName";
        public const string Mp3 = "Mp3";
        public const string Phone = "Phone";
    }

    public enum CouponStatusEnum
    {
        OPEN = 1,
        INPROGRESS = 2,
        ACCEPTED = 3,
        CANCELED = 4
    }
    
}
