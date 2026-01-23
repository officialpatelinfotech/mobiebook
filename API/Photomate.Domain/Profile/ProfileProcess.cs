using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Domain.Profile
{
    public class ProfileProcess
    {
        private Repository repo;       
        MySqlDatabaseContext mySqlContext;
        public ProfileProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);            
        }

         
        public async Task UpdateProfile(UserProfileMetadata userProfileMetadata)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["userId"] = new MySqlParameter("userId", userProfileMetadata.UserId);
            param["full_name"] = new MySqlParameter("full_name", userProfileMetadata.FullName.Trim());
            param["business_name"] = new MySqlParameter("business_name", userProfileMetadata.BusinessName);
            param["phone"] = new MySqlParameter("phone", userProfileMetadata.Phone);
            param["business_logo"] = new MySqlParameter("business_logo", userProfileMetadata.Logo);
            param["address1"] = new MySqlParameter("address1", userProfileMetadata.Address1);
            param["address2"] = new MySqlParameter("address2", userProfileMetadata.Address2);
            param["pincode"] = new MySqlParameter("pincode", userProfileMetadata.PinCode);
            param["city"] = new MySqlParameter("city", userProfileMetadata.City);
            param["country"] = new MySqlParameter("country", userProfileMetadata.Country);
            param["county"] = new MySqlParameter("county", userProfileMetadata.County);
            await this.repo.InsertAsync("update_profile", param);
        }

        public async Task<ViewUserProfileMetadata> GetProfileById(int userId)
        {
            ViewUserProfileMetadata userProfile = new ViewUserProfileMetadata();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["register_user_id"] = new MySqlParameter("register_user_id", userId);

            var data = this.repo.GetAsync("get_profile_by_id", param);


            await Task.Run(() => {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        userProfile.UserId = rows.Rows[i]["register_user_id"].ToString().ToInt();
                        userProfile.FullName = rows.Rows[i]["full_name"].ToString();
                        userProfile.Email = rows.Rows[i]["email_address"].ToString();
                        userProfile.BusinessName = rows.Rows[i]["business_name"].ToString();
                        userProfile.Address1 = rows.Rows[i]["address1"].ToString();
                        userProfile.Address2 = rows.Rows[i]["address2"].ToString();
                        userProfile.City = rows.Rows[i]["city"].ToString();
                        userProfile.Country = rows.Rows[i]["country"].ToString();
                        userProfile.County = rows.Rows[i]["county"].ToString();
                        userProfile.Logo = rows.Rows[i]["business_logo"].ToString();
                        userProfile.Phone = rows.Rows[i]["phone"].ToString();
                        userProfile.PinCode = rows.Rows[i]["pincode"].ToString();
                    }
                }

            });

            return userProfile;
        }

    }
}
