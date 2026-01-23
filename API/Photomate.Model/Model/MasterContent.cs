using System.ComponentModel.DataAnnotations;

namespace Photomate.Model.Model
{
    public class MasterContent : BaseEntity
    {        
        [Required]
        public string MasterCode { get; set; }

        [Required]
        public string MasterValue { get; set; }
        public string ParentId { get; set; }
    }
}
