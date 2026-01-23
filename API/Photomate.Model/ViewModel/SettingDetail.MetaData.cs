namespace Photomate.Model.ViewModel
{
    public class SettingDetail
    {
        public int SettingId { get; set; }
        public string UserType { get; set; }
        public bool? IsAudioUpload { get; set; }
        public bool? IsAlbumUpload { get; set; }
    }

    public class UpdateSettingMetaData
    {
        public int SettingId { get; set; }
        public bool Status { get; set; }
        public string SettingType { get; set; }
    }
}
