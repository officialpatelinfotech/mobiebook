using System;
using System.ComponentModel.DataAnnotations;

namespace Photomate.Model.Model
{
    public abstract class BaseEntity : ParentEntity
    {
        [DataType(DataType.Date)]
        public DateTime CreatedOn { get; set; }

        [DataType(DataType.Date)]
        public DateTime ModifiedOn { get; set; }
        public string IpAddress { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
    }
}
