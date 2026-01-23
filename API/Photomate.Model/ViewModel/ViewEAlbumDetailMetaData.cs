using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Model.ViewModel
{
    public class ViewEAlbumDetailMetaData
    {
        public int EAlbumId { get; set; }
        public int? CustomerId { get; set; }
        public int? UserId { get; set; }
        public string EventTitle { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? PublishedOn { get; set; }
        public DateTime? ExpiredOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public string CoupleDetail { get; set; }
        public int? AudioId { get; set; }
        public DateTime? EventDate { get; set; }
        public string Remarks { get; set; }
        public string PageType { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Mobile { get; set; }
        public string Mp3Title { get; set; }
        public string Mp3Link { get; set; }
        public string ImageLink { get; set; }
        public string UniqId { get; set; }
        public string Status { get; set; }

    }

    public class ManageViewEAlbumMetaData
    {
        public ManageViewEAlbumMetaData()
        {
            ViewAlbums = new List<ViewEAlbumDetailMetaData>();
        }
        public List<ViewEAlbumDetailMetaData> ViewAlbums { get; set; }
        public int TotalRecord { get; set; }
    }

    public class EAlbumShortUrl
    {
        public int EAlbumId { get; set; }
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public string UniqId { get; set; }
    }
}
