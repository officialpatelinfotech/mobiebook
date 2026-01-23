namespace Photomate.Model.ViewModel
{
    public class EalbumPagesMetaData
    {
        public int AlbumPageId { get; set; }
        public int AlbumId { get; set; }
        public string ImageLink { get; set; }
        public string PageType { get; set; } // Page/Spread
        public string PageViewType { get; set; } // Front/page/back
        public int SequenceNo { get; set; }
        public string ImageSize { get; set; }
        public string ImageTitle { get; set; }
        public string UniqId { get; set; }
        public string ParentId { get; set; }
        public bool? IsAlbumView { get; set; }
    }

    public class ImagePageSequenceMetaData
    {
        public int AlbumId { get; set; }
        public int PageId { get; set; }
        public int SequenceNo { get; set; }
    }
}
