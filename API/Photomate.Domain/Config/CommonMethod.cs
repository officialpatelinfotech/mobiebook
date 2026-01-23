using Photomate.Model.ViewModel;
using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Photomate.Domain.Config
{
    public static class CommonMethod
    {
        public static string GetUniqId()
        {
            return Guid.NewGuid().ToString().Replace("-", "");
        }

        public static string ShortId()
        {
            return GetUniqId().Substring(0, 6);
        }


        public static List<IconImageSizeDetail> ImageSize()
        {
            var img = new List<IconImageSizeDetail>();
            img.Add(new IconImageSizeDetail() { Name = "72x72", Height = 72, Width = 72 });
            img.Add(new IconImageSizeDetail() { Name = "96x96", Height = 96, Width = 96 });
            img.Add(new IconImageSizeDetail() { Name = "128x128", Height = 128, Width = 128 });
            img.Add(new IconImageSizeDetail() { Name = "144x144", Height = 144, Width = 144 });
            img.Add(new IconImageSizeDetail() { Name = "152x152", Height = 152, Width = 152 });
            img.Add(new IconImageSizeDetail() { Name = "192x192", Height = 192, Width = 192 });
            img.Add(new IconImageSizeDetail() { Name = "384x384", Height = 384, Width = 384 });
            img.Add(new IconImageSizeDetail() { Name = "512x512", Height = 512, Width = 512 });
            return img;
        }

        public static string ManifestFileData(List<IconImageSizeDetail> imgs, string ealbumid, string uniqId,string userid,
            string eventTitle)
        {
            ManifestMetaData manifestMetaData = new ManifestMetaData();
            manifestMetaData.name = eventTitle; // "mobiebook.online";
            manifestMetaData.orientation = "landscape";
            manifestMetaData.short_name = eventTitle; // "mobiebook";
            manifestMetaData.theme_color = "#1976d2";
            manifestMetaData.background_color = "#fafafa";
            manifestMetaData.display = "standalone";
            //https://api.mobiebook.online/resources/2/772/manifest.json
            // manifestMetaData.scope = "https://mobiebook.online/#/ealbum/validate/" + ealbumid + "/" + uniqId;
            // manifestMetaData.start_url = "https://mobiebook.online/#/ealbum/validate/" + ealbumid + "/" + uniqId;
            manifestMetaData.start_url = "https://api.mobiebook.online/resources/" + userid + "/" + ealbumid + "/index.html?id=" + uniqId;
           // manifestMetaData.scope = "https://api.mobiebook.online/resources/" + userid + "/" + ealbumid + "/index.html?id=" + uniqId;
            manifestMetaData.icons = new List<IconDetail>();
            foreach (var img in imgs)
            {
                IconDetail icon = new IconDetail
                {
                    purpose = "maskable any",
                    sizes = img.Name,
                    src = "https://api.mobiebook.online/Resources/" + userid + "/" + ealbumid + "/icons/" + img.Name + ".png",
                    type = "image/png"
                };
                manifestMetaData.icons.Add(icon);
            }
            return JsonSerializer.Serialize(manifestMetaData);
        }
    }
}
