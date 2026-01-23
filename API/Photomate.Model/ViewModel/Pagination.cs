namespace Photomate.Model.ViewModel
{
    public class Pagination
    {
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public string FilterString { get; set; }
        public string Status { get; set; }
    }

    public class PaginationUserMetaData
    {
        public int PageIndex { get; set; }
        public int BusinessTypeId { get; set; }
        public int PageSize { get; set; }
        public string FilterString { get; set; }
    }
}
