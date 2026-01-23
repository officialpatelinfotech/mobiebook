namespace Photomate.Model.ViewModel
{
    public class AlbumDetailMetaData
    {
        public int UserId { get; set; }
        public string Search { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public string Status { get; set; }
    }

    public class AlbumPublishMetaData
    {
        public int AlbumId { get; set; }
    }

    public class AlbumPageMetaData
    {
        public int AlbumPageId { get; set; }
        public int AlbumId { get; set; }
    }
}
