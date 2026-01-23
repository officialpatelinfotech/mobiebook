using MySql.Data.MySqlClient;
using Photomate.Domain.Common;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Registration
{
    public class ManageRegistrationProcess
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public ManageRegistrationProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
        }


        public async Task RegisterUser(AddUserRegisterMetaData registerUser)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_name"] = new MySqlParameter("user_name", registerUser.UserName);
            param["user_password"] = new MySqlParameter("user_password", registerUser.UserPassword.Trim());
            param["phone"] = new MySqlParameter("phone", registerUser.Phone.Trim());
            param["full_name"] = new MySqlParameter("full_name", registerUser.FullName);
            param["business_type_id"] = new MySqlParameter("business_type_id", registerUser.BusinessTypeId);
            param["emailverifieddate"] = new MySqlParameter("emailverifieddate", DateTime.UtcNow);
            param["isactive"] = new MySqlParameter("isactive", true);
            param["verification_code"] = new MySqlParameter("verification_code", CommonMethod.GetUniqId());

            await this.repo.InsertAsync("add_user", param);
        }


        public async Task<LoginUserDetailMetaData> LoginUser(string userName)
        {
            LoginUserDetailMetaData userDetail = new LoginUserDetailMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["user_name"] = new MySqlParameter("user_name", userName);
            var userDetails = this.repo.GetAsync("login_user", param);
            if (userDetails.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (userDetails.Tables.Count > 0)
                    {
                        var rows = userDetails.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userDetail.UserId = rows.Rows[i]["UserId"].ToString().ToInt();
                            userDetail.UserName = rows.Rows[i]["UserName"].ToString();
                            userDetail.FullName = rows.Rows[i]["full_name"].ToString();
                            userDetail.Logo = rows.Rows[i]["business_logo"].ToString();
                            userDetail.Password = rows.Rows[i]["user_password"].ToString();
                            userDetail.UserTypeId = rows.Rows[i]["UserTypeId"].ToString().ToInt();
                            userDetail.UserTypeName = rows.Rows[i]["BusinessType"].ToString();
                            userDetail.SaltPassword = rows.Rows[i]["user_password"].ToString();
                            userDetail.IsWindowApp = rows.Rows[i]["is_window_app"].ToString().ToBool();
                        }
                    }
                });
            }

            return userDetail;
        }

        public async Task<string> GetTokenDetail(int userId)
        {
            var couponUinqId = CommonMethod.GetUniqId();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["register_user_id"] = new MySqlParameter("register_user_id", userId);
            param["user_token"] = new MySqlParameter("user_token", couponUinqId);
            await this.repo.InsertAsync("login_token", param);
            return couponUinqId;
        }

        public async Task SaveForgotPassword(ForgotPasswordMetaData forgotUser)
        {
            var id = Guid.NewGuid().ToString();

            CommonProcess cm = new CommonProcess();
            var userDetail = await LoginUser(forgotUser.Email);
            var msg = FormatMessage(userDetail, id);
            cm.SendMail(forgotUser.Email, GlobalConstant.ForgotPasswordSubject, msg);

            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["username"] = new MySqlParameter("username", forgotUser.Email);
            param["user_uniq_id"] = new MySqlParameter("user_uniq_id", id);
            await this.repo.InsertAsync("save_forgot_password", param);

        }

        public string FormatMessage(LoginUserDetailMetaData user,string uniqCode)
        {
            string msg = GlobalConstant.ForgotPasswordMessage;
            msg = msg.Replace("[NAME]", user.FullName);
            msg = msg.Replace("[EMAIL]", user.UserName);
            msg = msg.Replace("[LINK]", "https://mobiebook.online/#/authenticate/changepassword?code="+ uniqCode);
            return msg;
        }
        public async Task UpdateForgotPassword(UpdatePasswordMetaData forgotUser)
        {
            var id = Guid.NewGuid().ToString();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_name"] = new MySqlParameter("user_name", forgotUser.Email);
            param["user_password"] = new MySqlParameter("user_password", forgotUser.Password);
            await this.repo.InsertAsync("update_password", param);
        }

        public async Task<UserDetailByTokenMetaData> GetUserDetailByToken(string token)
        {
            UserDetailByTokenMetaData userDetail = new UserDetailByTokenMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["token"] = new MySqlParameter("token", token);
            var userDetails = this.repo.GetAsync("get_user_detail_by_token", param);
            if (userDetails.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (userDetails.Tables.Count > 0)
                    {
                        var rows = userDetails.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userDetail.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                            userDetail.ActivityId = rows.Rows[i]["user_activity_id"].ToString().ToInt();
                            userDetail.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                            userDetail.ExpiredOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                            userDetail.UserToken = rows.Rows[i]["uniq_key"].ToString();
                            userDetail.UserType = rows.Rows[i]["business_type_id"].ToString().ToInt();
                        }
                    }
                });
            }

            return userDetail;
        }

        public async Task<LoginUserDetailMetaData> AdminLoginUser(string userName)
        {
            LoginUserDetailMetaData userDetail = new LoginUserDetailMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["user_name"] = new MySqlParameter("user_name", userName);
            var userDetails = this.repo.GetAsync("login_user", param);
            if (userDetails.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (userDetails.Tables.Count > 0)
                    {
                        var rows = userDetails.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userDetail.UserId = rows.Rows[i]["UserId"].ToString().ToInt();
                            userDetail.UserName = rows.Rows[i]["UserName"].ToString();
                            userDetail.FullName = rows.Rows[i]["full_name"].ToString();
                            userDetail.Logo = rows.Rows[i]["business_logo"].ToString();
                            userDetail.Password = rows.Rows[i]["user_password"].ToString();
                            userDetail.UserTypeId = rows.Rows[i]["UserTypeId"].ToString().ToInt();
                            userDetail.UserTypeName = rows.Rows[i]["BusinessType"].ToString();

                        }
                    }
                });
            }

            return userDetail;
        }

        public async Task<ForgotPasswordDetail> GetForgotPasswordDetail(string uniqId)
        {
            ForgotPasswordDetail userDetail = new ForgotPasswordDetail();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["uniq_id"] = new MySqlParameter("uniq_id", uniqId);
            var forgotPasswordDetail = this.repo.GetAsync("get_forgot_password_detail", param);
            if (forgotPasswordDetail.Tables.Count > 0)
            {
                await Task.Run(() =>
                {
                    if (forgotPasswordDetail.Tables.Count > 0)
                    {
                        var rows = forgotPasswordDetail.Tables[0];
                        for (var i = 0; i < rows.Rows.Count; i++)
                        {
                            userDetail.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                            userDetail.ExpiredOn = rows.Rows[i]["requestexpireon"].ToString().ToDateTime();
                            userDetail.RequestedOn = rows.Rows[i]["requested_on"].ToString().ToDateTime();
                            userDetail.UniqId = rows.Rows[i]["request_uniq_id"].ToString();
                            userDetail.IsUsed = rows.Rows[i]["isused"].ToString().ToBool();
                            userDetail.ForgotPasswordId = rows.Rows[i]["forgot_pasword_id"].ToString().ToInt();
                        }
                    }
                });
            }

            return userDetail;
        }

        public async Task ResetUserPassword(int? userId,string password)
        {
            var id = Guid.NewGuid().ToString();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            param["password_val"] = new MySqlParameter("password_val", password);
            await this.repo.InsertAsync("Reset_user_password", param);
        }

        public async Task UpdateUserWindowApp(int? userId, bool status)
        {
           
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_id"] = new MySqlParameter("user_id", userId);
            param["active_status"] = new MySqlParameter("active_status", status);
            await this.repo.InsertAsync("window_app_activation", param);
        }

        public async Task UpdateUserStatus(int? userId, bool status)
        {            
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_id"] = new MySqlParameter("user_id", userId);
            param["active_status"] = new MySqlParameter("active_status", status);
            await this.repo.InsertAsync("update_user_status", param);
        }

    }
}
