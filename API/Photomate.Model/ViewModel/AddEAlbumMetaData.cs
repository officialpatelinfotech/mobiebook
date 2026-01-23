using System;

namespace Photomate.Model.ViewModel
{
    public class AddEAlbumMetaData
    {
        public int AlbumId { get; set; }
        public string EventTitle { get; set; }
        public string CoupleDetail { get; set; }
        public int? AudioId { get; set; }
        public DateTime? EventDate { get; set; }
        public string Remark { get; set; }
        public string EmailAddress { get; set; }
        public string MobileNo { get; set; }
        public string PageType { get; set; }

        public string Base64Logo { get; set; }
        public string LogoName { get; set; }        
    }

    public class PhotographerEAlbumMetaData : AddEAlbumMetaData
    {
        public int PhotographerId { get; set; }
    }

    public class PhotographerMetaData
    {
        public string UserName { get; set; }
    }
}
