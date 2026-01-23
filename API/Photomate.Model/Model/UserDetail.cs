using System.ComponentModel.DataAnnotations;

namespace Photomate.Model.Model
{
    public class UserDetail : BaseEntity
    {    
        [StringLength(50)]
        [RegularExpression(@"^[A-Z]+[a-zA-Z""'\s-]*$")]
        public string FullName { get; set; }

        [StringLength(50)]
        [DataType(DataType.EmailAddress)]
        public string Email { get; set; }

        [StringLength(50)]
        [RegularExpression(@"^((\+)?(\d{2}[-]))?(\d{10}){1}?$")]
        public string Mobile { get; set; }

        [StringLength(50)]
        public string BusinessTypeId { get; set; } // photographer/lab

        [StringLength(100)]
        public string BusinessName { get; set; }

        [StringLength(100)]
        public string Logo { get; set; }

        [StringLength(150)]
        public string Address1 { get; set; }

        [StringLength(150)]
        public string Address2 { get; set; }

        [StringLength(20)]
        public string Pincode { get; set; }
        [StringLength(60)]
        public string City { get; set; }
        [StringLength(50)]
        public string State { get; set; }

        [StringLength(50)]
        public string Country { get; set; }

    }
}
