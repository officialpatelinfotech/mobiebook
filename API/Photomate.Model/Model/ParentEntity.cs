using System.ComponentModel.DataAnnotations;

namespace Photomate.Model.Model
{
    public abstract class ParentEntity
    {
        public ParentEntity()
        {
            _id = System.Guid.NewGuid().ToString();
        }

        [StringLength(100)]
        public string Id
        {
            get { return _id; }
            set
            {
                if (string.IsNullOrEmpty(value))
                    _id = System.Guid.NewGuid().ToString();
                else
                    _id = value;

            }
        }

        private string _id;
    }
}
