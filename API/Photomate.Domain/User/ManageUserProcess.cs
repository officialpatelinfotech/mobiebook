using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Domain.Coupon
{
    public class ManageUserProcess
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public ManageUserProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
        }

        public async Task<ManageViewUserMetaData> GetUserList(PaginationUserMetaData pageDetail)
        {
            int totalRecord = 0;
            ManageViewUserMetaData userDetails = new ManageViewUserMetaData();
            List<ViewUserProfileMetadata> users = new List<ViewUserProfileMetadata>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["page_index"] = new MySqlParameter("page_index", pageDetail.PageIndex);
            param["page_size"] = new MySqlParameter("page_size", pageDetail.PageSize);           
            param["business_id"] = new MySqlParameter("business_id", pageDetail.BusinessTypeId);
            param["search"] = new MySqlParameter("search", pageDetail.FilterString);
            param["total_record"] = new MySqlParameter("total_record", totalRecord);
            param["total_record"].Direction = ParameterDirection.Output;
            var data = this.repo.GetAsync("get_user_list_by_business", out totalRecord, param);
            userDetails.TotalRecord = totalRecord;
            await Task.Run(() => {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        ViewUserProfileMetadata user = new ViewUserProfileMetadata();
                        user.FullName = rows.Rows[i]["full_name"].ToString();
                        user.UserId = rows.Rows[i]["register_user_id"].ToString().ToInt();
                        user.BusinessName = rows.Rows[i]["business_name"].ToString();
                        user.Email = rows.Rows[i]["email_address"].ToString();
                        user.Phone = rows.Rows[i]["phone"].ToString();
                        user.Logo = rows.Rows[i]["business_logo"].ToString();
                        user.Address1 = rows.Rows[i]["address1"].ToString();
                        user.Address2 = rows.Rows[i]["address2"].ToString();
                        user.PinCode = rows.Rows[i]["pincode"].ToString();
                        user.City = rows.Rows[i]["city"].ToString();
                        user.County = rows.Rows[i]["county"].ToString();
                        user.Country = rows.Rows[i]["country"].ToString();
                        user.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        user.IsActive = rows.Rows[i]["isactive"].ToString().ToBool();
                        user.IsWindowApp = rows.Rows[i]["is_window_app"].ToString().ToBool();
                       // user.WindowAppActivateDate = rows.Rows[i]["window_app_active_date"].ToString().ToDateTime();
                       // user.WindowAppDeactivateDate = rows.Rows[i]["window_app_deactivate_date"].ToString().ToDateTime();
                        users.Add(user);
                    }
                }

            });

            userDetails.UserDetails = users;

            return userDetails;
        }

    }
}
