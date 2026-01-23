using System;
using System.Collections.Generic;
using System.Text;

namespace Photomate.Model.ViewModel
{
   public class AddMp3Metadata
    {
        public int Mp3Id { get; set; }
        public string Title { get; set; }
        public string Size { get; set; }
        public string Duration { get; set; }
        public string FileName { get; set; }
        public string Link { get; set; }
        public string Description { get; set; }
        public bool? IsActive { get; set; }
        public int UserId { get; set; }
    }

    public class AddMp3ListMetaData
    {
       public List<AddMp3Metadata> AddMp3MetaData { get; set; }
    }

    public class ManageMp3Metadata
    {
        public int Mp3Id { get; set; }
        public string Title { get; set; }
        public string Size { get; set; }
        public string Duration { get; set; }
        public string FileName { get; set; }
        public string Link { get; set; }
        public string Description { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDefault { get; set; }
        public int UserId { get; set; }
        public int SelectedUserId { get; set; }

    }

    public class FavourateMp3Metadata
    {
        public int Mp3Id { get; set; }
        public int UserId { get; set; }
        public bool? IsActive { get; set; }
       
    }
}
