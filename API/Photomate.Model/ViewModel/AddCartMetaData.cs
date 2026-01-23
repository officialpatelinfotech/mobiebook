using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Model.ViewModel
{
    public class AddCartMetaData
    {
        public int RequestId { get; set; }
        public int? CouponId { get; set; }
        public int? Quantity { get; set; }
        public string Notes { get; set; }
    }

    public class UpdateCartStatusMetaData
    {
        public int? RequestId { get; set; }
        public int? StatusId { get; set; }
    }
}
