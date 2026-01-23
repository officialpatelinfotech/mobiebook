using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System;
using System.Collections.Generic;
using System.Net.Mail;
using System.Threading.Tasks;

namespace Photomate.Domain.Common
{
    public class CommonProcess
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public CommonProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
        }

        public CommonProcess()
        {

        }

        public async Task<List<MasterViewMetaData>> GetMasterDropdown(string masterCode)
        {
            List<MasterViewMetaData> masterDetails = new List<MasterViewMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["master_code"] = new MySqlParameter("master_code", masterCode);

            var data = this.repo.GetAsync("get_master_content_by_code", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        MasterViewMetaData masterContent = new MasterViewMetaData();
                        masterContent.Id = rows.Rows[i]["master_content_id"].ToString().ToInt();
                        masterContent.Text = rows.Rows[i]["master_value"].ToString();
                        masterContent.MasterCode = rows.Rows[i]["master_code"].ToString();
                        masterDetails.Add(masterContent);
                    }
                }

            });

            return masterDetails;
        }


        public async Task<List<CountryMetaData>> GetCountryDropdown()
        {
            List<CountryMetaData> countries = new List<CountryMetaData>();

            var data = this.repo.GetAsync("get_country_data", null);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        CountryMetaData country = new CountryMetaData();
                        country.CountryId = rows.Rows[i]["country_id"].ToString().ToInt();
                        country.CountryName = rows.Rows[i]["country_name"].ToString();
                        country.CurrencyName = rows.Rows[i]["currency_name"].ToString();
                        country.CurrencySymbol = rows.Rows[i]["currency_symbol"].ToString();
                        countries.Add(country);
                    }
                }

            });

            return countries;
        }

        public async Task<int> EntityCounter(
            EntityCounterMetaData entityDetail)
        {
            int count = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["entity_title"] = new MySqlParameter("entity_title", entityDetail.EntityTitle);
            param["entity_type"] = new MySqlParameter("entity_type", entityDetail.EntityType);

            var data = this.repo.GetAsync("entity_counter", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        count = rows.Rows[i]["Counter"].ToString().ToInt();
                    }
                }

            });

            return count;
        }

        public async Task<List<MenuDetailMetaData>> GetPageDetail(int userTypeId)
        {
            List<MenuDetailMetaData> menuDetails = new List<MenuDetailMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_typeid"] = new MySqlParameter("user_typeid", userTypeId);

            var data = this.repo.GetAsync("get_page_detail", param);

            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        MenuDetailMetaData menuDetail = new MenuDetailMetaData();
                        menuDetail.PageId = rows.Rows[i]["page_id"].ToString().ToInt();
                        menuDetail.PageTitle = rows.Rows[i]["page_title"].ToString();
                        menuDetail.PageCode = rows.Rows[i]["page_code"].ToString();
                        menuDetail.Url = rows.Rows[i]["page_url"].ToString();
                        menuDetail.Icon = rows.Rows[i]["page_icon"].ToString();

                        menuDetails.Add(menuDetail);
                    }
                }

            });

            return menuDetails;
        }

        public void SendMail(string toEmail, string subject, string msg)
        {
            try
            {
                MailMessage mail = new MailMessage();
                SmtpClient SmtpServer = new SmtpClient("smtp.zoho.in");

                mail.From = new MailAddress("noreply@mobiebook.online");
                mail.To.Add(toEmail);
                mail.Subject = subject;
                mail.Body = msg;
                mail.IsBodyHtml = true;

                SmtpServer.Port = 587;
                SmtpServer.Credentials = new System.Net.NetworkCredential("noreply@mobiebook.online", "Andsolutions@2021");
                SmtpServer.EnableSsl = true;

                SmtpServer.Send(mail);

            }
            catch (Exception ex)
            {

            }
        }

        public static List<DashboardMetaData> DashboardTitle(List<DashboardMetaData> data)
        {
            foreach (var x in data)
            {
                switch (x.Code)
                {
                    case "CREATED":
                        x.Title = "TOTAL CREATED";
                        break;
                    case "UPLOADED":
                        x.Title = "TOTAL UPLOADED";
                        break;
                    case "PUBLISHED":
                        x.Title = "TOTAL PUBLISHED";
                        break;
                    case "OPEN":
                        x.Title = "TOTAL OPEN";
                        break;
                    case "VIEWALBUM":
                        x.Title = "TOTAL VIEWERS";
                        break;
                    case "BYPHOTOGRAPHER":
                        x.Title = "TOTAL UPLOADED FROM WEB";
                        break;
                }


            }
            return data;
        }

        public async Task<List<SettingDetail>> GetSettingDetail(int userType)
        {
            List<SettingDetail> settingDetail = new List<SettingDetail>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_type"] = new MySqlParameter("user_type", userType);


            var data = this.repo.GetAsync("get_setting_detail", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        SettingDetail setting = new SettingDetail
                        {
                            SettingId = rows.Rows[i]["settingid"].ToString().ToInt(),
                            IsAlbumUpload = rows.Rows[i]["albumupload"].ToString().ToBool(),
                            IsAudioUpload = rows.Rows[i]["audio_upload"].ToString().ToBool(),
                            UserType = rows.Rows[i]["usertype"].ToString()
                        };
                        settingDetail.Add(setting);
                    }
                }

            });

            return settingDetail;
        }


        public async Task UpdateSettingDetail(UpdateSettingMetaData setting)
        {
            List<SettingDetail> settingDetail = new List<SettingDetail>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["setting_id"] = new MySqlParameter("setting_id", setting.SettingId);
            param["setting_status"] = new MySqlParameter("setting_status", setting.Status);
            param["setting_Type"] = new MySqlParameter("setting_Type", setting.SettingType);

            await this.repo.InsertAsync("update_setting", param);            
        }

    }
}
