using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using System.Threading.Tasks;

namespace Photomate.Domain.EAlbum
{
    public class EAlbumProcess
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public EAlbumProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);

        }

        public async Task<int> AddAlbum(AddEAlbumMetaData album, int userId)
        {
            int albumnId = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["ealbum_id"] = new MySqlParameter("ealbum_id", album.AlbumId);
            param["eventtitle"] = new MySqlParameter("eventtitle", album.EventTitle);
            param["userid"] = new MySqlParameter("userid", userId);
            param["coupledetail"] = new MySqlParameter("coupledetail", album.CoupleDetail);
            param["audioid"] = new MySqlParameter("audioid", album.AudioId);
            param["eventdate"] = new MySqlParameter("eventdate", album.EventDate);
            param["remark_detail"] = new MySqlParameter("remark_detail", album.Remark);
            param["email"] = new MySqlParameter("email", album.EmailAddress);
            param["mobileno"] = new MySqlParameter("mobileno", album.MobileNo);
            param["pagetype"] = new MySqlParameter("pagetype", album.PageType);
            param["uniqid"] = new MySqlParameter("uniqid", CommonMethod.ShortId());
            param["albumid_detail"] = new MySqlParameter("albumid_detail", albumnId);
            param["albumid_detail"].Direction = ParameterDirection.Output;

            var val = await this.repo.InsertAsync("add_ealbum", param, "albumid_detail");

            return val;
        }

        public async Task<ViewEAlbumDetailMetaData> GetEalbumDetail(int albumId, int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["album_id"] = new MySqlParameter("album_id", albumId);
            param["userid"] = new MySqlParameter("userid", userId);
            var data = this.repo.GetAsync("get_ealbum_detail", param);

            ViewEAlbumDetailMetaData album = new ViewEAlbumDetailMetaData();
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        album.AudioId = rows.Rows[i]["audio_id"].ToString().ToInt();
                        album.CoupleDetail = rows.Rows[i]["couple_detail"].ToString();
                        album.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        album.CustomerId = rows.Rows[i]["customer_id"].ToString().ToInt();
                        album.EAlbumId = rows.Rows[i]["ealbumid"].ToString().ToInt();
                        album.Email = rows.Rows[i]["emailaddress"].ToString();
                        album.EventDate = rows.Rows[i]["event_date"].ToString().ToDateTime();
                        album.EventTitle = rows.Rows[i]["event_title"].ToString();
                        album.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        album.ExpiredOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        album.FullName = rows.Rows[i]["fullname"].ToString();
                        album.Mobile = rows.Rows[i]["mobile"].ToString();
                        album.Mp3Link = rows.Rows[i]["mp3_link"].ToString();
                        album.Mp3Title = rows.Rows[i]["mp3_title"].ToString();
                        album.PageType = rows.Rows[i]["page_type"].ToString();
                        album.PublishedOn = rows.Rows[i]["publishedon"].ToString().ToDateTime();
                        album.Remarks = rows.Rows[i]["remarks"].ToString();
                        album.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        album.Status = rows.Rows[i]["album_status"].ToString();
                        album.UniqId = rows.Rows[i]["uniq_id"].ToString();                       
                    }
                }

            });

            return album;
        }


        public async Task AddEalbumPages(EalbumPagesMetaData pages)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["albumid"] = new MySqlParameter("albumid", pages.AlbumId);
            param["pagelink"] = new MySqlParameter("pagelink", pages.ImageLink);
            param["pagetype"] = new MySqlParameter("pagetype", pages.PageType);
            param["pageviewtype"] = new MySqlParameter("pageviewtype", pages.PageViewType);
            param["sequenceno"] = new MySqlParameter("sequenceno", pages.SequenceNo);
            param["title"] = new MySqlParameter("title", pages.ImageTitle);
            param["imgsize"] = new MySqlParameter("imgsize", pages.ImageSize);
            param["uniqid"] = new MySqlParameter("uniqid", pages.UniqId);
            param["parentid"] = new MySqlParameter("parentid", pages.ParentId);
            param["isalbumdisplay"] = new MySqlParameter("isalbumdisplay", pages.IsAlbumView);

            await this.repo.InsertAsync("add_ealbum_pages", param);

        }

        public async Task<List<EalbumPagesMetaData>> GetEalbumPageDetail(int albumId)
        {
            List<EalbumPagesMetaData> albumPages = new List<EalbumPagesMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["albumId"] = new MySqlParameter("albumId", albumId);

            var data = this.repo.GetAsync("get_album_pages", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        EalbumPagesMetaData page = new EalbumPagesMetaData();
                        page.AlbumPageId = rows.Rows[i]["ealbum_page_id"].ToString().ToInt();
                        page.AlbumId = rows.Rows[i]["ealbum_id"].ToString().ToInt();
                        page.ImageLink = rows.Rows[i]["page_link"].ToString();
                        page.PageType = rows.Rows[i]["page_type"].ToString();
                        page.PageViewType = rows.Rows[i]["page_view_type"].ToString();
                        page.SequenceNo = rows.Rows[i]["page_sequence"].ToString().ToInt();
                        page.ImageSize = rows.Rows[i]["img_size"].ToString();
                        page.ImageTitle = rows.Rows[i]["img_title"].ToString();
                        page.ParentId = rows.Rows[i]["parent_id"].ToString();
                        page.UniqId = rows.Rows[i]["uniq_id"].ToString();
                        page.IsAlbumView = rows.Rows[i]["is_album_view"].ToString().ToBool();
                        albumPages.Add(page);
                    }
                }

            });

            return albumPages;
        }


        public async Task<ManageViewEAlbumMetaData> GetEalbums(AlbumDetailMetaData albumDetail)
        {
            int totalRecord = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", albumDetail.UserId);
            param["page_index"] = new MySqlParameter("page_index", albumDetail.PageIndex);
            param["page_size"] = new MySqlParameter("page_size", albumDetail.PageSize);
            param["search"] = new MySqlParameter("search", albumDetail.Search);
            param["album_status"] = new MySqlParameter("album_status", albumDetail.Status);
            param["total_record"] = new MySqlParameter("total_record", totalRecord);
            param["total_record"].Direction = ParameterDirection.Output;


            var data = this.repo.GetAsync("get_ealbums", out totalRecord, param);
            ManageViewEAlbumMetaData manage = new ManageViewEAlbumMetaData();
            manage.TotalRecord = totalRecord;

            var albums = new List<ViewEAlbumDetailMetaData>();
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        ViewEAlbumDetailMetaData album = new ViewEAlbumDetailMetaData();
                        album.AudioId = rows.Rows[i]["audio_id"].ToString().ToInt();
                        album.CoupleDetail = rows.Rows[i]["couple_detail"].ToString();
                        album.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        album.CustomerId = rows.Rows[i]["customer_id"].ToString().ToInt();
                        album.EAlbumId = rows.Rows[i]["ealbumid"].ToString().ToInt();
                        album.Email = rows.Rows[i]["emailaddress"].ToString();
                        album.EventDate = rows.Rows[i]["event_date"].ToString().ToDateTime();
                        album.EventTitle = rows.Rows[i]["event_title"].ToString();
                        album.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        album.ExpiredOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        album.FullName = rows.Rows[i]["fullname"].ToString();
                        album.Mobile = rows.Rows[i]["mobile"].ToString();
                        album.Mp3Link = rows.Rows[i]["mp3_link"].ToString();
                        album.Mp3Title = rows.Rows[i]["mp3_title"].ToString();
                        album.PageType = rows.Rows[i]["page_type"].ToString();
                        album.PublishedOn = rows.Rows[i]["publishedon"].ToString().ToDateTime();
                        album.Remarks = rows.Rows[i]["remarks"].ToString();
                        album.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        album.ImageLink = rows.Rows[i]["page_link"].ToString();
                        album.Status = rows.Rows[i]["album_status"].ToString();
                        album.UniqId = rows.Rows[i]["uniq_id"].ToString();
                        manage.ViewAlbums.Add(album);
                    }
                }

            });

            return manage;
        }

        public async Task UpdateAlbumStatus(int albumId, int userId, string status)
        {

            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["userid"] = new MySqlParameter("userid", userId);
            param["albumid"] = new MySqlParameter("albumid", albumId);
            param["albumstatus"] = new MySqlParameter("albumstatus", status);

            await this.repo.InsertAsync("update_album_status", param);

        }

        public async Task DeleteAlbum(int albumPageId, int userId, string tableName)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["entity_id"] = new MySqlParameter("entity_id", albumPageId);
            param["proces_by"] = new MySqlParameter("proces_by", userId);
            param["entity_table_name"] = new MySqlParameter("entity_table_name", tableName);

            await this.repo.InsertAsync("delete_entity", param);
        }

        public async Task DeleteAlbumDetail(int albumId, int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["albumid"] = new MySqlParameter("albumid", albumId);
            param["userid"] = new MySqlParameter("userid", userId);


            await this.repo.InsertAsync("delete_album", param);
        }

        public async Task<ViewEAlbumDetailMetaData> ValidateEAlbumCustomer(ValidateCustomerMetaData customer)
        {
            List<EalbumPagesMetaData> albumPages = new List<EalbumPagesMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["albumid"] = new MySqlParameter("albumid", customer.AlbumId);
            param["albumcode"] = new MySqlParameter("albumcode", customer.UniqCode);
            param["email"] = new MySqlParameter("email", customer.Email);
            param["mobile"] = new MySqlParameter("mobile", customer.Mobile);

            var data = this.repo.GetAsync("validate_customer", param);

            ViewEAlbumDetailMetaData album = new ViewEAlbumDetailMetaData();
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        album.AudioId = rows.Rows[i]["audio_id"].ToString().ToInt();
                        album.CoupleDetail = rows.Rows[i]["couple_detail"].ToString();
                        album.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        album.CustomerId = rows.Rows[i]["customer_id"].ToString().ToInt();
                        album.EAlbumId = rows.Rows[i]["ealbumid"].ToString().ToInt();
                        album.Email = rows.Rows[i]["emailaddress"].ToString();
                        album.EventDate = rows.Rows[i]["event_date"].ToString().ToDateTime();
                        album.EventTitle = rows.Rows[i]["event_title"].ToString();
                        album.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        album.ExpiredOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        album.FullName = rows.Rows[i]["fullname"].ToString();
                        album.Mobile = rows.Rows[i]["mobile"].ToString();
                        album.Mp3Link = rows.Rows[i]["mp3_link"].ToString();
                        album.Mp3Title = rows.Rows[i]["mp3_title"].ToString();
                        album.PageType = rows.Rows[i]["page_type"].ToString();
                        album.PublishedOn = rows.Rows[i]["publishedon"].ToString().ToDateTime();
                        album.Remarks = rows.Rows[i]["remarks"].ToString();
                        album.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        album.Status = rows.Rows[i]["album_status"].ToString();
                        album.UniqId = rows.Rows[i]["uniq_id"].ToString();
                    }
                }

            });

            return album;
        }

        public async Task UpdateAlbumSequence(ImagePageSequenceMetaData images)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["ealbumid"] = new MySqlParameter("ealbumid", images.AlbumId);
            param["elabumpageid"] = new MySqlParameter("elabumpageid", images.PageId);
            param["sequenceno"] = new MySqlParameter("sequenceno", images.SequenceNo);


            await this.repo.InsertAsync("update_page_sequence", param);
        }

        public async Task<int> UserId(int elabumId)
        {
            UserDetailByTokenMetaData userDetail = new UserDetailByTokenMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["ealbum_id"] = new MySqlParameter("ealbum_id", elabumId);
            var userDetails = this.repo.GetAsync("get_ealbum_user_id", param);
            var userId = 0;
            if (userDetails.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (userDetails.Tables.Count > 0)
                    {
                        var rows = userDetails.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userId = rows.Rows[i]["user_id"].ToString().ToInt();

                        }
                    }
                });
            }

            return userId;
        }

        public async Task<int> AddAlbumForPhotographer(PhotographerEAlbumMetaData album, int userId)
        {
            int albumnId = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["ealbum_id"] = new MySqlParameter("ealbum_id", album.AlbumId);
            param["eventtitle"] = new MySqlParameter("eventtitle", album.EventTitle);
            // IMPORTANT: Ensure album ownership is always the authenticated user.
            param["userid"] = new MySqlParameter("userid", userId);
            param["coupledetail"] = new MySqlParameter("coupledetail", album.CoupleDetail);
            param["audioid"] = new MySqlParameter("audioid", album.AudioId);
            param["eventdate"] = new MySqlParameter("eventdate", album.EventDate);
            param["remark_detail"] = new MySqlParameter("remark_detail", album.Remark);
            param["email"] = new MySqlParameter("email", album.EmailAddress);
            param["mobileno"] = new MySqlParameter("mobileno", album.MobileNo);
            param["pagetype"] = new MySqlParameter("pagetype", album.PageType);
            param["uniqid"] = new MySqlParameter("uniqid", CommonMethod.ShortId());
            param["created_by_id"] = new MySqlParameter("created_by_id", userId);
            param["albumid_detail"] = new MySqlParameter("albumid_detail", albumnId);
            param["albumid_detail"].Direction = ParameterDirection.Output;

            var val = await this.repo.InsertAsync("add_ealbum_by_lab", param, "albumid_detail");

            return val;
        }

        public async Task<int> GetPhotgrapherId(PhotographerMetaData userName)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["username"] = new MySqlParameter("username", userName.UserName);
            var userDetails = this.repo.GetAsync("get_photographer_user", param);
            var userId = 0;
            if (userDetails.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (userDetails.Tables.Count > 0)
                    {
                        var rows = userDetails.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userId = rows.Rows[i]["register_user_id"].ToString().ToInt();
                        }
                    }
                });
            }

            return userId;
        }

        public async Task<List<DashboardMetaData>> GetUserDashboardDetail(int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);

            var dashboardDetail = this.repo.GetAsync("dashboard_detail", param);
            List<DashboardMetaData> dashboards = new List<DashboardMetaData>();
            if (dashboardDetail.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (dashboardDetail.Tables.Count > 0)
                    {
                        var rows = dashboardDetail.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            DashboardMetaData dashboard = new DashboardMetaData
                            {
                                Code = rows.Rows[i]["title"].ToString(),
                                Counter = rows.Rows[i]["createdalbum"].ToString().ToInt(),
                                Title = ""
                            };
                            dashboards.Add(dashboard);
                        }
                    }
                });
            }

            return dashboards;
        }

        public async Task<ManageViewEAlbumMetaData> GetEalbumsByCode(string code, int userId)
        {
            int totalRecord = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            param["displaycode"] = new MySqlParameter("displaycode", code);


            var data = this.repo.GetAsync("dashboard_detail_view", param);
            ManageViewEAlbumMetaData manage = new ManageViewEAlbumMetaData();
            manage.TotalRecord = totalRecord;

            var albums = new List<ViewEAlbumDetailMetaData>();
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        ViewEAlbumDetailMetaData album = new ViewEAlbumDetailMetaData();
                        album.AudioId = rows.Rows[i]["audio_id"].ToString().ToInt();
                        album.CoupleDetail = rows.Rows[i]["couple_detail"].ToString();
                        album.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        album.CustomerId = rows.Rows[i]["customer_id"].ToString().ToInt();
                        album.EAlbumId = rows.Rows[i]["ealbumid"].ToString().ToInt();
                        album.Email = rows.Rows[i]["emailaddress"].ToString();
                        album.EventDate = rows.Rows[i]["event_date"].ToString().ToDateTime();
                        album.EventTitle = rows.Rows[i]["event_title"].ToString();
                        album.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        album.ExpiredOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        album.FullName = rows.Rows[i]["fullname"].ToString();
                        album.Mobile = rows.Rows[i]["mobile"].ToString();
                        album.Mp3Link = rows.Rows[i]["mp3_link"].ToString();
                        album.Mp3Title = rows.Rows[i]["mp3_title"].ToString();
                        album.PageType = rows.Rows[i]["page_type"].ToString();
                        album.PublishedOn = rows.Rows[i]["publishedon"].ToString().ToDateTime();
                        album.Remarks = rows.Rows[i]["remarks"].ToString();
                        album.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        album.ImageLink = rows.Rows[i]["page_link"].ToString();
                        album.Status = rows.Rows[i]["album_status"].ToString();
                        album.UniqId = rows.Rows[i]["uniq_id"].ToString();
                        manage.ViewAlbums.Add(album);
                    }
                }

            });

            return manage;
        }

        public async Task<EAlbumShortUrl> GetEalbumsByUniqCode(string code)
        {
            int totalRecord = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["uniqid"] = new MySqlParameter("uniqid", code);
            var data = this.repo.GetAsync("get_ealbum_by_uniqid", param);
            ManageViewEAlbumMetaData manage = new ManageViewEAlbumMetaData();
            manage.TotalRecord = totalRecord;

            var album = new EAlbumShortUrl();
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        album.EAlbumId = rows.Rows[i]["ealbumid"].ToString().ToInt();
                        album.CustomerId = rows.Rows[i]["customer_id"].ToString().ToInt();
                        album.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        album.UniqId = rows.Rows[i]["uniq_id"].ToString();
                    }
                }

            });

            return album;
        }
    }
}
