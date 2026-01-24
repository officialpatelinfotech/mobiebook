using Microsoft.AspNetCore.Mvc;
using Photomate.Domain.Config;
using Photomate.Domain.EAlbum;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using Photomate.Domain.Common;
using Photomate.Domain.Profile;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class EAlbumController : BaseController
    {
        MySqlDatabaseContext mySqlContext;
        private EAlbumProcess eAlbumProcess;
        private ProfileProcess profileProcess;

        public EAlbumController(
            MySqlDatabaseContext context)
            : base(context)
        {
            this.mySqlContext = context;
            this.eAlbumProcess = new EAlbumProcess(context);
            this.profileProcess = new ProfileProcess(this.mySqlContext);
        }

        [HttpPost]
        [Route("AddAlbum")]
        public async Task<IActionResult> AddAlbum(AddEAlbumMetaData album)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var albumId = await this.eAlbumProcess.AddAlbum(album, userDetail.UserId);


            if (!string.IsNullOrEmpty(album.Base64Logo))
            {
                var folder = Path.Combine("Resources", userDetail.UserId.ToString(), albumId.ToString());
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);
                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }

                var iconfolder = Path.Combine(folder, "icons");
                var pathToSaveIcon = Path.Combine(Directory.GetCurrentDirectory(), iconfolder);
                if (!Directory.Exists(pathToSaveIcon))
                {
                    Directory.CreateDirectory(pathToSaveIcon);
                }


                var logo = album.Base64Logo.Substring(album.Base64Logo.LastIndexOf(',') + 1);
                byte[] imageBytes = Convert.FromBase64String(logo);
                var imgLink = album.LogoName.Split('.');
                var imgType = imgLink[imgLink.Length - 1];

                newFileName = System.Guid.NewGuid().ToString() + "." + imgType;
                var imageDataStream = new MemoryStream(imageBytes);
                imageDataStream.Position = 0;

                string path = Path.Combine(pathToSaveIcon, newFileName);
                using (Stream stream = new FileStream(path, FileMode.Create))
                {
                    imageDataStream.CopyTo(stream);
                }
                //album.Base64Logo = newFileName;

                var iconImageSize = CommonMethod.ImageSize();
                try
                {
                    var fullPath = Path.Combine(pathToSave, newFileName);
                    foreach (var icon in iconImageSize)
                    {
                        Bitmap bmp = new Bitmap(path);
                        Bitmap bitmap = ResizeBitmap(bmp, icon.Height, icon.Width);
                        bitmap.Save(pathToSaveIcon + "//" + icon.Name + ".png", ImageFormat.Png);
                        bitmap.Dispose();
                    }

                    var ealbum = await this.eAlbumProcess.GetEalbumDetail(albumId.ToString().ToInt(), userDetail.UserId);

                    var jsonData = CommonMethod.ManifestFileData(iconImageSize, albumId.ToString(), ealbum.UniqId, userDetail.UserId.ToString(),
                         album.CoupleDetail);
                    System.IO.File.WriteAllText(pathToSave + "/manifest.json", jsonData);

                }
                catch (Exception ex)
                {
                    throw new Exception("Bit Map :" + ex.Message);
                }

                var htmlResource = Path.Combine("Resources", "statichtml");
                DirectoryInfo htmlDiSource = new DirectoryInfo(htmlResource);
                DirectoryInfo htmlDiTarget = new DirectoryInfo(pathToSave);

                foreach (FileInfo fi in htmlDiSource.GetFiles())
                {
                    fi.CopyTo(Path.Combine(htmlDiTarget.ToString(), fi.Name), true);
                }

            }
            else
            {
                if (album.AlbumId == 0)
                {
                    var folder = Path.Combine("Resources", userDetail.UserId.ToString(), albumId.ToString());
                    var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);
                    if (!Directory.Exists(pathToSave))
                    {
                        Directory.CreateDirectory(pathToSave);
                    }

                    var iconfolder = Path.Combine(folder, "icons");
                    var pathToSaveIcon = Path.Combine(Directory.GetCurrentDirectory(), iconfolder);
                    if (!Directory.Exists(pathToSaveIcon))
                    {
                        Directory.CreateDirectory(pathToSaveIcon);
                    }
                    var iconResource = Path.Combine("Resources", "icons");
                    DirectoryInfo diSource = new DirectoryInfo(iconResource);
                    DirectoryInfo diTarget = new DirectoryInfo(pathToSaveIcon);

                    foreach (FileInfo fi in diSource.GetFiles())
                    {
                        fi.CopyTo(Path.Combine(diTarget.ToString(), fi.Name), true);
                    }

                    var ealbum = await this.eAlbumProcess.GetEalbumDetail(albumId.ToString().ToInt(), userDetail.UserId);

                    var iconImageSize = CommonMethod.ImageSize();
                    var jsonData = CommonMethod.ManifestFileData(iconImageSize, albumId.ToString(), ealbum.UniqId, userDetail.UserId.ToString(),
                        album.CoupleDetail);
                    System.IO.File.WriteAllText(pathToSave + "/manifest.json", jsonData);

                    var htmlResource = Path.Combine("Resources", "statichtml");
                    DirectoryInfo htmlDiSource = new DirectoryInfo(htmlResource);
                    DirectoryInfo htmlDiTarget = new DirectoryInfo(pathToSave);

                    foreach (FileInfo fi in htmlDiSource.GetFiles())
                    {

                        fi.CopyTo(Path.Combine(htmlDiTarget.ToString(), fi.Name), true);

                    }

                }
            }

            return Ok(albumId);
        }

        [HttpPost]
        [Route("AddLabAlbum")]
        public async Task<IActionResult> AddLabAlbum(PhotographerEAlbumMetaData album)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var albumId = await this.eAlbumProcess.AddAlbumForPhotographer(album, userDetail.UserId);
            var profileDetails = await this.profileProcess.GetProfileById(album.PhotographerId);
            var albumDetail = await this.eAlbumProcess.GetEalbumDetail(albumId, album.PhotographerId);
            var detail = new
            {
                ealbumId = albumId,
                Profile = profileDetails,
                AlbumDetail = albumDetail
            };

            var folder = Path.Combine("Resources", album.PhotographerId.ToString(), albumId.ToString());
            var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);
            if (!Directory.Exists(pathToSave))
            {
                Directory.CreateDirectory(pathToSave);
            }

            var iconfolder = Path.Combine(folder, "icons");
            var pathToSaveIcon = Path.Combine(Directory.GetCurrentDirectory(), iconfolder);
            if (!Directory.Exists(pathToSaveIcon))
            {
                Directory.CreateDirectory(pathToSaveIcon);
            }
            var iconResource = Path.Combine("Resources", "icons");
            DirectoryInfo diSource = new DirectoryInfo(iconResource);
            DirectoryInfo diTarget = new DirectoryInfo(pathToSaveIcon);

            foreach (FileInfo fi in diSource.GetFiles())
            {
                fi.CopyTo(Path.Combine(diTarget.ToString(), fi.Name), true);
            }


            var iconImageSize = CommonMethod.ImageSize();
            var jsonData = CommonMethod.ManifestFileData(iconImageSize, albumId.ToString(), albumDetail.UniqId, profileDetails.UserId.ToString(), albumDetail.CoupleDetail);
            System.IO.File.WriteAllText(pathToSave + "/manifest.json", jsonData);

            var htmlResource = Path.Combine("Resources", "statichtml");
            DirectoryInfo htmlDiSource = new DirectoryInfo(htmlResource);
            DirectoryInfo htmlDiTarget = new DirectoryInfo(pathToSave);

            foreach (FileInfo fi in htmlDiSource.GetFiles())
            {
                fi.CopyTo(Path.Combine(htmlDiTarget.ToString(), fi.Name), true);
            }

            return Ok(detail);
        }

        [HttpPost, DisableRequestSizeLimit]
        [Route("AcUploadImage")]
        public async Task<IActionResult> AcUploadImage()
        {
            var userDetail = await GetUserDetail();

            var httpRequest = Request.Form.Files[0];
            if (httpRequest != null)
            {
                var formData = Request.Form;
                var albumId = formData.Where(x => x.Key == "albumid").Select(x => x.Value).FirstOrDefault();
                var pageType = formData.Where(x => x.Key == "pagetype").Select(x => x.Value).FirstOrDefault();
                var viewPageType = formData.Where(x => x.Key == "viewtype").Select(x => x.Value).FirstOrDefault();
                var imgSize = formData.Where(x => x.Key == "size").Select(x => x.Value).FirstOrDefault();
                var sequence = formData.Where(x => x.Key == "sequenceno").Select(x => x.Value).FirstOrDefault();
                var uniqId = formData.Where(x => x.Key == "uniqid").Select(x => x.Value).FirstOrDefault();
                var parentId = formData.Where(x => x.Key == "parentid").Select(x => x.Value).FirstOrDefault();
                var isAlbumDislay = formData.Where(x => x.Key == "isdisplay").Select(x => x.Value).FirstOrDefault();

                var folder = Path.Combine("Resources", userDetail.UserId.ToString(), albumId);
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }



                var fileName = ContentDispositionHeaderValue.Parse(httpRequest.ContentDisposition).FileName.Replace(" ", "").Trim('"');
                var fullPath = Path.Combine(pathToSave, fileName);
                var dbPath = Path.Combine(folder, fileName);
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    httpRequest.CopyTo(stream);
                    stream.Dispose();
                    //if (viewPageType == "FRONT")
                    //{
                    //    try
                    //    {
                    //        var iconfolder = Path.Combine(folder, "icons");
                    //        var pathToSaveIcon = Path.Combine(Directory.GetCurrentDirectory(), iconfolder);
                    //        if (!Directory.Exists(pathToSaveIcon))
                    //        {
                    //            Directory.CreateDirectory(pathToSaveIcon);
                    //        }

                    //        var iconImageSize = CommonMethod.ImageSize();
                    //        try
                    //        {

                    //            foreach (var icon in iconImageSize)
                    //            {
                    //                Bitmap bmp = new Bitmap(fullPath);
                    //                Bitmap bitmap = ResizeBitmap(bmp, icon.Height, icon.Width);
                    //                bitmap.Save(pathToSaveIcon + "//" + icon.Name + ".png", ImageFormat.Png);
                    //                bitmap.Dispose();
                    //            }

                    //        }
                    //        catch (Exception ex)
                    //        {
                    //            throw new Exception("Bit Map :" + ex.Message);
                    //        }


                    //    }
                    //    catch (Exception ex)
                    //    {
                    //        throw new Exception("New Bit Map Error :" + ex.Message);
                    //    }

                    //    // Resize(fullPath, 72, 72, "70");
                    //}

                }

                if(pageType == "Spread")
                {
                    if (viewPageType == "TPFRONT" || viewPageType == "TPBACK" || viewPageType == "EMBOSS")
                    {
                        var img = new List<string>();
                        var fixedImgPath = Path.Combine("Resources", "FixedImages");
                        var heightTook = 0;
                        if (viewPageType == "TPFRONT" || viewPageType == "EMBOSS")
                        {
                            img.Add(Path.Combine(fixedImgPath, "blankImg.png"));
                            img.Add(fullPath);
                            heightTook = 2;
                        }
                        if (viewPageType == "TPBACK")
                        {
                            img.Add(Path.Combine(fixedImgPath, "blankImg.png"));
                            img.Add(fullPath);
                            heightTook = 1;
                        }
                        var newImg = CombineBitmap(img.ToArray(), heightTook);
                        newImg.Save(fullPath);
                    }
                }
               
                //try
                //{
                //    if (viewPageType == "FRONT")
                //    {
                //        var ealbum = await this.eAlbumProcess.GetEalbumDetail(albumId.ToString().ToInt(), userDetail.UserId);
                //        var iconImageSize = CommonMethod.ImageSize();
                //        var jsonData = CommonMethod.ManifestFileData(iconImageSize, albumId.ToString(), ealbum.UniqId);
                //        System.IO.File.WriteAllText(pathToSave + "/manifest.json", jsonData);
                //    }
                //}
                //catch (Exception ex)
                //{
                //    //throw new Exception("Error File :" + ex.Message);
                //}

                EalbumPagesMetaData page = new EalbumPagesMetaData();
                page.AlbumId = albumId.ToString().ToInt();
                page.ImageLink = fileName;
                page.PageType = pageType;
                page.PageViewType = viewPageType;
                page.SequenceNo = Convert.ToInt32(sequence);
                page.ImageTitle = fileName;
                page.ImageSize = imgSize;
                page.UniqId = uniqId;
                page.ParentId = parentId;
                page.IsAlbumView = Convert.ToString(isAlbumDislay).ToBool();
                await this.eAlbumProcess.AddEalbumPages(page);


            }
            return Ok();
        }

        [HttpPost, DisableRequestSizeLimit]
        [Route("AcUploadPhotographerImage")]
        public async Task<IActionResult> AcUploadPhotographerImage()
        {
            var userDetail = await GetUserDetail();
            string imgFileName = string.Empty;
            var httpRequest = Request.Form.Files[0];
            if (httpRequest != null)
            {
                var formData = Request.Form;
                var albumId = formData.Where(x => x.Key == "albumid").Select(x => x.Value).FirstOrDefault();
                var pageType = formData.Where(x => x.Key == "pagetype").Select(x => x.Value).FirstOrDefault();
                var viewPageType = formData.Where(x => x.Key == "viewtype").Select(x => x.Value).FirstOrDefault();
                var imgSize = formData.Where(x => x.Key == "size").Select(x => x.Value).FirstOrDefault();
                var sequence = formData.Where(x => x.Key == "sequenceno").Select(x => x.Value).FirstOrDefault();
                var uniqId = formData.Where(x => x.Key == "uniqid").Select(x => x.Value).FirstOrDefault();
                var parentId = formData.Where(x => x.Key == "parentid").Select(x => x.Value).FirstOrDefault();
                var isAlbumDislay = formData.Where(x => x.Key == "isdisplay").Select(x => x.Value).FirstOrDefault();
                var photographerid = formData.Where(x => x.Key == "photographerid").Select(x => x.Value).FirstOrDefault();

                var folder = Path.Combine("Resources", photographerid.ToString(), albumId);
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }


                var mainFileName = ContentDispositionHeaderValue.Parse(httpRequest.ContentDisposition).FileName;
                imgFileName = mainFileName;
                var fileName = mainFileName.Replace(" ", "").Trim('"');
                var fullPath = Path.Combine(pathToSave, fileName);
                var dbPath = Path.Combine(folder, fileName);
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    httpRequest.CopyTo(stream);
                    stream.Dispose();
                    //if (viewPageType == "FRONT")
                    //{
                    //    try
                    //    {
                    //        var iconfolder = Path.Combine(folder, "icons");
                    //        var pathToSaveIcon = Path.Combine(Directory.GetCurrentDirectory(), iconfolder);
                    //        if (!Directory.Exists(pathToSaveIcon))
                    //        {
                    //            Directory.CreateDirectory(pathToSaveIcon);
                    //        }

                    //        var iconImageSize = CommonMethod.ImageSize();
                    //        try
                    //        {
                    //            foreach (var icon in iconImageSize)
                    //            {
                    //                Bitmap bmp = new Bitmap(fullPath);
                    //                Bitmap bitmap = ResizeBitmap(bmp, icon.Height, icon.Width);
                    //                bitmap.Save(pathToSaveIcon + "//" + icon.Name + ".png", ImageFormat.Png);
                    //                bitmap.Dispose();
                    //            }

                    //        }
                    //        catch (Exception ex)
                    //        {
                    //            throw new Exception("Bit Map :" + ex.Message);
                    //        }


                    //    }
                    //    catch (Exception ex)
                    //    {
                    //        throw new Exception("New Bit Map Error :" + ex.Message);
                    //    }

                    //    // Resize(fullPath, 72, 72, "70");
                    //}

                }

                //try
                //{
                //    if (viewPageType == "FRONT")
                //    {
                //        var ealbum = await this.eAlbumProcess.GetEalbumDetail(albumId.ToString().ToInt(), userDetail.UserId);
                //        var iconImageSize = CommonMethod.ImageSize();
                //        var jsonData = CommonMethod.ManifestFileData(iconImageSize, albumId.ToString(), ealbum.UniqId);
                //        System.IO.File.WriteAllText(pathToSave + "/manifest.json", jsonData);
                //    }
                //}
                //catch (Exception ex)
                //{
                //    //throw new Exception("Error File :" + ex.Message);
                //}
                if (pageType == "Spread")
                {
                    if (viewPageType == "TPFRONT" || viewPageType == "TPBACK" || viewPageType == "EMBOSS")
                    {
                        var img = new List<string>();
                        var fixedImgPath = Path.Combine("Resources", "FixedImages");
                        var heightTook = 0;
                        if (viewPageType == "TPFRONT" || viewPageType == "EMBOSS")
                        {
                            img.Add(Path.Combine(fixedImgPath, "blankImg.png"));
                            img.Add(fullPath);
                            heightTook = 2;
                        }
                        if (viewPageType == "TPBACK")
                        {
                            img.Add(Path.Combine(fixedImgPath, "blankImg.png"));
                            img.Add(fullPath);
                            heightTook = 2;
                        }
                        var newImg = CombineBitmap(img.ToArray(), heightTook);
                        newImg.Save(fullPath);
                    }
                }

                EalbumPagesMetaData page = new EalbumPagesMetaData();
                page.AlbumId = albumId.ToString().ToInt();
                page.ImageLink = fileName;
                page.PageType = pageType;
                page.PageViewType = viewPageType;
                page.SequenceNo = Convert.ToInt32(sequence);
                page.ImageTitle = fileName;
                page.ImageSize = imgSize;
                page.UniqId = uniqId;
                page.ParentId = parentId;
                page.IsAlbumView = Convert.ToString(isAlbumDislay).ToBool();
                await this.eAlbumProcess.AddEalbumPages(page);


            }
            return Ok(imgFileName);
        }
        public static Bitmap ResizeBitmap(Bitmap bmp, int width, int height)
        {
            Bitmap bitmap = new Bitmap(width, height);
            using (Graphics graphics = Graphics.FromImage(bitmap))
            {
                graphics.DrawImage(bmp, 0, 0, width, height);
            }
            return bitmap;
        }


        public static Bitmap ResizeImage(Image image, int width, int height)
        {

            var dest_Rect = new Rectangle(0, 0, width, height);
            var dest_Image = new Bitmap(width, height);

            dest_Image.SetResolution(image.HorizontalResolution, image.VerticalResolution);

            using (var graphics = Graphics.FromImage(dest_Image))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                using (var wrapMode = new ImageAttributes())
                {
                    wrapMode.SetWrapMode(WrapMode.TileFlipXY);
                    graphics.DrawImage(image, dest_Rect, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, wrapMode);
                }
            }
            return dest_Image;
        }

        [HttpPost, DisableRequestSizeLimit]
        [Route("AcUploadIcons")]
        public async Task<IActionResult> AcUploadIcons()
        {
            var userDetail = await GetUserDetail();

            var httpRequest = Request.Form.Files[0];
            if (httpRequest != null)
            {
                var formData = Request.Form;
                var albumId = formData.Where(x => x.Key == "albumid").Select(x => x.Value).FirstOrDefault();

                var folder = Path.Combine("Resources", userDetail.UserId.ToString(), albumId, "icons");
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }

                var iconImageSize = CommonMethod.ImageSize();
                foreach (var img in iconImageSize)
                {
                    var fileName = ContentDispositionHeaderValue.Parse(httpRequest.ContentDisposition).FileName.Replace(" ", "").Trim('"');
                    var fullPath = Path.Combine(pathToSave, img.Name);
                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        httpRequest.CopyTo(stream);
                    }
                }



            }
            return Ok();
        }


        [HttpGet]
        [Route("GetAlbumDetail")]
        public async Task<IActionResult> GetAlbumDetail(int albumId)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var albumDetail = await this.eAlbumProcess.GetEalbumDetail(albumId, userDetail.UserId);

            return Ok(albumDetail);
        }

        [HttpGet]
        [Route("GetAlbumPageDetail")]
        public async Task<IActionResult> GetAlbumPageDetail(int albumId)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var albumDetail = await this.eAlbumProcess.GetEalbumPageDetail(albumId);

            return Ok(albumDetail);
        }

        [HttpPost]
        [Route("AcGetEAlbum")]
        public async Task<IActionResult> AcGetEAlbum(Pagination pageDetail)
        {
            var userDetail = await GetUserDetail();

            AlbumDetailMetaData album = new AlbumDetailMetaData();
            album.PageIndex = pageDetail.PageIndex;
            album.PageSize = pageDetail.PageSize;
            album.Search = pageDetail.FilterString;
            album.UserId = userDetail.UserId;
            album.Status = pageDetail.Status;

            var ealbum = await this.eAlbumProcess.GetEalbums(album);
            return Ok(ealbum);
        }

        [HttpPost]
        [Route("AcPublishedEAlbum")]
        public async Task<IActionResult> AcPublishedEAlbum(AlbumPublishMetaData album)
        {
            var userDetail = await GetUserDetail();

            await this.eAlbumProcess.UpdateAlbumStatus(album.AlbumId, userDetail.UserId, AlbumStatus.PUBLISHED.ToString());
            return Ok();
        }

        [HttpPost]
        [Route("AcDeletePage")]
        public async Task<IActionResult> AcDeletePage(AlbumPageMetaData album)
        {
            var userDetail = await GetUserDetail();

            var folder = Path.Combine("Resources", userDetail.UserId.ToString(), album.AlbumId.ToString());
            var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);
            var isFileExist = "";
            var albumDetail = await this.eAlbumProcess.GetEalbumPageDetail(album.AlbumId);
            var pageDetail = albumDetail.Where(x => x.AlbumPageId == album.AlbumPageId).FirstOrDefault();
            if (pageDetail != null)
            {
                if (System.IO.File.Exists(pathToSave + "/" + pageDetail.ImageLink))
                {
                    isFileExist = "File Exist Work/" + pathToSave + "/" + pageDetail.ImageLink;
                    System.IO.File.Delete(pathToSave + "/" + pageDetail.ImageLink);
                }
                else
                {
                    isFileExist = "File Not Work/" + pathToSave + "/" + pageDetail.ImageLink;
                }

                await this.eAlbumProcess.DeleteAlbum(album.AlbumPageId, userDetail.UserId,
                "ealbum_pages");
            }


            return Ok(isFileExist);
        }

        [HttpPost]
        [Route("AcDeleteAllPage")]
        public async Task<IActionResult> AcDeleteAllPage(AlbumPageMetaData album)
        {
            var userDetail = await GetUserDetail();

            var folder = Path.Combine("Resources", userDetail.UserId.ToString(), album.AlbumId.ToString());
            var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

            var albumDetail = await this.eAlbumProcess.GetEalbumPageDetail(album.AlbumId);

            foreach (var pg in albumDetail)
            {
                if (pg.PageViewType == "PAGE")
                {
                    System.IO.File.Delete(pathToSave + "/" + pg.ImageLink);
                    await this.eAlbumProcess.DeleteAlbum(pg.AlbumPageId, userDetail.UserId,
                    "ealbum_pages");
                }
            }
            return Ok();
        }

        [HttpPost]
        [Route("AcDeleteAlbum")]
        public async Task<IActionResult> AcDeleteAlbum(AlbumPageMetaData album)
        {
            var userDetail = await GetUserDetail();

            var folder = Path.Combine("Resources", userDetail.UserId.ToString(), album.AlbumId.ToString());
            var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);


            var albumDetail = await this.eAlbumProcess.GetEalbumPageDetail(album.AlbumId);
            await this.eAlbumProcess.DeleteAlbumDetail(album.AlbumId, userDetail.UserId);
            foreach (var pg in albumDetail)
            {
                System.IO.File.Delete(pathToSave + "/" + pg.ImageLink);
            }
            return Ok();
        }

        [HttpGet]
        [Route("GetCustomerAlbumPageDetail")]
        public async Task<IActionResult> GetCustomerAlbumPageDetail(int albumId)
        {

            string newFileName = string.Empty;

            var albumDetail = await this.eAlbumProcess.GetEalbumPageDetail(albumId);

            return Ok(albumDetail);
        }

        [HttpPost]
        [Route("AcUpdateSequence")]
        public async Task<IActionResult> AcUpdateSequence(List<ImagePageSequenceMetaData> sequnce)
        {
            var userDetail = await GetUserDetail();
            foreach (var seq in sequnce)
            {
                await this.eAlbumProcess.UpdateAlbumSequence(seq);
            }

            return Ok();
        }

        [HttpPost]
        [Route("GetPhotgraperId")]
        public async Task<IActionResult> GetPhotgraperId(PhotographerMetaData album)
        {

            var userDetail = await GetUserDetail();

            var photogrpherId = await this.eAlbumProcess.GetPhotgrapherId(album);

            return Ok(photogrpherId);
        }

        [HttpGet]
        [Route("GetDashboardDetail")]
        public async Task<IActionResult> GetDashboardDetail()
        {
            var userDetail = await GetUserDetail();
            var albumDetail = await this.eAlbumProcess.GetUserDashboardDetail(userDetail.UserId);
            var modifiedTitle = CommonProcess.DashboardTitle(albumDetail);
            return Ok(modifiedTitle);
        }

        [HttpGet]
        [Route("FnGetDashboardDetailView")]
        public async Task<IActionResult> FnGetDashboardDetailView(string code)
        {
            var userDetail = await GetUserDetail();
            var albumDetail = await this.eAlbumProcess.GetEalbumsByCode(code, userDetail.UserId);
            return Ok(albumDetail);
        }

        public static System.Drawing.Bitmap CombineBitmap(string[] files,int imgHeight)
        {
            //read all images into memory
            List<System.Drawing.Bitmap> images = new List<System.Drawing.Bitmap>();
            System.Drawing.Bitmap finalImage = null;

            try
            {
                int width = 0;
                int height = 0;

                int i = 1;
                foreach (string image in files)
                {
                    //create a Bitmap from the file and add it to the list
                    System.Drawing.Bitmap bitmap = new System.Drawing.Bitmap(image);

                    //update the size of the final bitmap
                    
                    if(i == imgHeight)
                    {
                        height = bitmap.Height;
                        width = bitmap.Width;
                    }
                    //height = bitmap.Height > height ? bitmap.Height : height;

                    images.Add(bitmap);
                    i++;
                }

                //create a bitmap to hold the combined image
                finalImage = new System.Drawing.Bitmap(width * 2, height);

                //get a graphics object from the image so we can draw on it
                using (System.Drawing.Graphics g = System.Drawing.Graphics.FromImage(finalImage))
                {
                    //set background color
                    g.Clear(System.Drawing.Color.LightGray);

                    //go through each image and draw it on the final image
                    int j = 1;
                    int offset = 0;
                    foreach (System.Drawing.Bitmap image in images)
                    {
                        
                        g.DrawImage(image,
                          new System.Drawing.Rectangle(offset, 0, finalImage.Width / 2, image.Height));
                        offset += finalImage.Width / 2;
                    }
                }

                return finalImage;
            }
            catch (Exception ex)
            {
                if (finalImage != null)
                    finalImage.Dispose();

                throw ex;
            }
            finally
            {
                //clean up memory
                foreach (System.Drawing.Bitmap image in images)
                {
                    image.Dispose();
                }
            }
        }

    }
}
