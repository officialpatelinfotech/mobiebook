using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Domain.Coupon
{
    public class ManageCouponProcess
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public ManageCouponProcess(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
        }


        public async Task AddCoupon(AddCouponMetaData couponDetail, int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["coupon_id"] = new MySqlParameter("coupon_id", couponDetail.CouponId);
            param["coupon_title"] = new MySqlParameter("coupon_title", couponDetail.Title.Trim());
            param["coupon_price"] = new MySqlParameter("coupon_price", couponDetail.Price);
            param["country_id"] = new MySqlParameter("country_id", couponDetail.CountryId);
            param["img_link"] = new MySqlParameter("img_link", couponDetail.ImageLink);
            param["description_detail"] = new MySqlParameter("description_detail", couponDetail.Description);
            param["isactive"] = new MySqlParameter("isactive", couponDetail.IsActive);
            param["startedon"] = new MySqlParameter("startedon", couponDetail.StartedOn);
            param["expireon"] = new MySqlParameter("expireon", couponDetail.ExpireOn);
            param["processby"] = new MySqlParameter("processby", userId);
            param["quantity"] = new MySqlParameter("quantity", couponDetail.Quantity);
            param["coupon_typeid"] = new MySqlParameter("coupon_typeid", couponDetail.CouponTypeId);

            await this.repo.InsertAsync("add_coupon", param);
        }

        public async Task<ViewCouponDetail> GetCouponById(int couponId)
        {
            ViewCouponDetail coupon = new ViewCouponDetail();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["coupon_id"] = new MySqlParameter("coupon_id", couponId);

            var data = this.repo.GetAsync("get_coupon_by_id", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        coupon.CouponTitle = rows.Rows[i]["coupon_title"].ToString();
                        coupon.CouponId = rows.Rows[i]["coupon_pricing_id"].ToString().ToInt();
                        coupon.CouponPrice = rows.Rows[i]["coupon_price"].ToString().ToDouble();
                        coupon.CountryId = rows.Rows[i]["country_id"].ToString().ToInt();
                        coupon.ImageLink = rows.Rows[i]["image_link"].ToString();
                        coupon.Description = rows.Rows[i]["description_detail"].ToString();
                        coupon.IsActive = rows.Rows[i]["isactive"].ToString().ToBool();
                        coupon.IsDeleted = rows.Rows[i]["isdeleted"].ToString().ToBool();
                        coupon.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        coupon.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        coupon.StartedOn = rows.Rows[i]["starton"].ToString().ToDateTime();
                        coupon.ExpireOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        coupon.CreatedBy = rows.Rows[i]["created_by"].ToString().ToInt();
                        coupon.ModifiedBy = rows.Rows[i]["modified_by"].ToString().ToInt();
                        coupon.CountryName = rows.Rows[i]["country_name"].ToString();
                        coupon.CurrencyName = rows.Rows[i]["currency_name"].ToString();
                        coupon.CurrencySymbol = rows.Rows[i]["currency_symbol"].ToString();
                        coupon.CreatedByName = rows.Rows[i]["createdbyname"].ToString();
                        coupon.ModifiedByName = rows.Rows[i]["modifiedbyname"].ToString();
                        coupon.Quantity = rows.Rows[i]["quantity"].ToString().ToInt();
                        coupon.CouponTypeId = rows.Rows[i]["coupon_type_id"].ToString().ToInt();
                        coupon.CouponTypeName = rows.Rows[i]["counpon_type_name"].ToString();
                    }
                }

            });

            return coupon;
        }

        public async Task<List<ViewCouponDetail>> GetCoupondDetail(Pagination pageDetail)
        {
            int totalRecord = 0;
            List<ViewCouponDetail> coupons = new List<ViewCouponDetail>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["page_index"] = new MySqlParameter("page_index", pageDetail.PageIndex);
            param["page_size"] = new MySqlParameter("page_size", pageDetail.PageSize);
            param["total_record"] = new MySqlParameter("total_record", totalRecord);
            param["total_record"].Direction = ParameterDirection.Output;

            var data = this.repo.GetAsync("get_coupon_detail", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        ViewCouponDetail coupon = new ViewCouponDetail();
                        coupon.CouponTitle = rows.Rows[i]["coupon_title"].ToString();
                        coupon.CouponId = rows.Rows[i]["coupon_pricing_id"].ToString().ToInt();
                        coupon.CouponPrice = rows.Rows[i]["coupon_price"].ToString().ToDouble();
                        coupon.CountryId = rows.Rows[i]["country_id"].ToString().ToInt();
                        coupon.ImageLink = rows.Rows[i]["image_link"].ToString();
                        coupon.Description = rows.Rows[i]["description_detail"].ToString();
                        coupon.IsActive = rows.Rows[i]["isactive"].ToString().ToBool();
                        coupon.IsDeleted = rows.Rows[i]["isdeleted"].ToString().ToBool();
                        coupon.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        coupon.ModifiedOn = rows.Rows[i]["modifiedon"].ToString().ToDateTime();
                        coupon.StartedOn = rows.Rows[i]["starton"].ToString().ToDateTime();
                        coupon.ExpireOn = rows.Rows[i]["expireon"].ToString().ToDateTime();
                        coupon.CreatedBy = rows.Rows[i]["created_by"].ToString().ToInt();
                        coupon.ModifiedBy = rows.Rows[i]["modified_by"].ToString().ToInt();
                        coupon.CountryName = rows.Rows[i]["country_name"].ToString();
                        coupon.CurrencyName = rows.Rows[i]["currency_name"].ToString();
                        coupon.CurrencySymbol = rows.Rows[i]["currency_symbol"].ToString();
                        coupon.CreatedByName = rows.Rows[i]["createdbyname"].ToString();
                        coupon.ModifiedByName = rows.Rows[i]["modifiedbyname"].ToString();
                        coupon.Quantity = rows.Rows[i]["quantity"].ToString().ToInt();
                        coupon.CouponTypeId = rows.Rows[i]["coupon_type_id"].ToString().ToInt();
                        coupon.CouponTypeName = rows.Rows[i]["counpon_type_name"].ToString();
                        coupons.Add(coupon);
                    }
                }

            });

            return coupons;
        }

        public async Task DeleteCoupon(int couponid, int userid,string tableName)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["entity_id"] = new MySqlParameter("entity_id", couponid);
            param["proces_by"] = new MySqlParameter("proces_by", userid);
            param["entity_table_name"] = new MySqlParameter("entity_table_name", tableName);

            await this.repo.InsertAsync("delete_entity", param);
        }

        public async Task<UserCouponDetailMetaData> GetUserCoupondDetail(int userId)
        {
            UserCouponDetailMetaData coupons = new UserCouponDetailMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);

            var data = this.repo.GetAsync("get_customer_coupon", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        coupons.CustomerCouponId = rows.Rows[i]["customer_coupon_id"].ToString().ToInt();
                        coupons.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        coupons.TotalCoupon = rows.Rows[i]["total_coupon"].ToString().ToInt();
                        coupons.TotalIntrasit = rows.Rows[i]["total_intransit_coupon"].ToString().ToInt();
                        coupons.TotalUsed = rows.Rows[i]["total_used_coupon"].ToString().ToInt();
                    }
                }

            });

            return coupons;
        }


        public async Task BuyCoupon(ViewCouponDetail couponDetail,
            AddCartMetaData cardDetail
            , int userId)
        {
            UserCouponDetailMetaData coupons = new UserCouponDetailMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["requestcouponid"] = new MySqlParameter("requestcouponid", cardDetail.RequestId);
            param["userid"] = new MySqlParameter("userid", userId);
            param["couponid"] = new MySqlParameter("couponid", couponDetail.CouponId);
            param["totalrequest"] = new MySqlParameter("totalrequest", cardDetail.Quantity); // single coupon 
            param["couponqty"] = new MySqlParameter("couponqty", couponDetail.Quantity);
            param["statusid"] = new MySqlParameter("statusid", (int)CouponStatusEnum.OPEN);
            param["usernotes"] = new MySqlParameter("usernotes", cardDetail.Notes);
            param["couponprice"] = new MySqlParameter("couponprice", couponDetail.CouponPrice);          

            await this.repo.InsertAsync("request_coupon", param);
        }

        public async Task ProcessBuyCoupon(ViewCouponDetail couponDetail, int userId)
        {
            UserCouponDetailMetaData coupons = new UserCouponDetailMetaData();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["customercouponrequestid"] = new MySqlParameter("customercouponrequestid", userId);
            param["couponqty"] = new MySqlParameter("couponqty", couponDetail.CouponId);
            param["totalrequestcouponqty"] = new MySqlParameter("totalrequestcouponqty", 1); // single coupon 
            param["acceptedby"] = new MySqlParameter("acceptedby", couponDetail.Quantity);

            await this.repo.InsertAsync("process_request_coupon", param);
        }

        public async Task<List<CartViewMetaData>> GetUserCartDetail(int userId)
        {
            List<CartViewMetaData>  carts = new List<CartViewMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            param["statusid"] = new MySqlParameter("statusid", (int)CouponStatusEnum.OPEN);

            var data = this.repo.GetAsync("get_customer_coupon_by_status", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        CartViewMetaData cart = new CartViewMetaData();
                        cart.RequestId = rows.Rows[i]["customer_coupon_request_id"].ToString().ToInt();
                        cart.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        cart.CouponId = rows.Rows[i]["coupon_id"].ToString().ToInt();
                        cart.RequestQuantity = rows.Rows[i]["total_request_coupon_qty"].ToString().ToInt();
                        cart.CouponQuantity = rows.Rows[i]["coupon_qty"].ToString().ToInt();
                        cart.StatuId = rows.Rows[i]["coupon_qty"].ToString().ToInt();
                        cart.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        cart.AcceptedOn = rows.Rows[i]["acceptedon"].ToString().ToDateTime();
                        cart.AccpetedBy = rows.Rows[i]["accepted_by"].ToString().ToInt();
                        cart.CouponPrice = rows.Rows[i]["coupon_price"].ToString().ToDouble();
                        cart.AcceptedQuantity = rows.Rows[i]["accepted_quantity"].ToString().ToInt();
                        cart.TotalPrice = rows.Rows[i]["total_price"].ToString().ToInt();
                        cart.Notes = rows.Rows[i]["notes"].ToString();
                        cart.CouponTitle = rows.Rows[i]["coupon_title"].ToString();
                        cart.CouponType = rows.Rows[i]["coupon_type"].ToString();                        
                        cart.CurrencySymbol = rows.Rows[i]["symbol"].ToString();
                        carts.Add(cart);
                    }
                }

            });

            return carts;
        }

        public async Task UpdateCartStatus(int? requestId, 
            int userid, int isQtyUpdate,int? statusId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["requestid"] = new MySqlParameter("requestid", requestId);
            param["statusid"] = new MySqlParameter("statusid", statusId);
            param["isupdateqty"] = new MySqlParameter("isupdateqty", isQtyUpdate);
            param["userid"] = new MySqlParameter("userid", userid);
            await this.repo.InsertAsync("update_cart_status", param);
        }

        public async Task<List<CartViewMetaData>> GetCustomerCouponRequest(int userId,
            int? statusid,int? coupontypeid)
        {
            List<CartViewMetaData> carts = new List<CartViewMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            param["statusid"] = new MySqlParameter("statusid", statusid);
            param["coupontypeid"] = new MySqlParameter("coupontypeid", coupontypeid);

            var data = this.repo.GetAsync("get_customer_coupon_request", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        CartViewMetaData cart = new CartViewMetaData();
                        cart.RequestId = rows.Rows[i]["customer_coupon_request_id"].ToString().ToInt();
                        cart.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        cart.CouponId = rows.Rows[i]["coupon_id"].ToString().ToInt();
                        cart.RequestQuantity = rows.Rows[i]["total_request_coupon_qty"].ToString().ToInt();
                        cart.CouponQuantity = rows.Rows[i]["coupon_qty"].ToString().ToInt();
                        cart.StatuId = rows.Rows[i]["coupon_qty"].ToString().ToInt();
                        cart.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        cart.AcceptedOn = rows.Rows[i]["acceptedon"].ToString().ToDateTime();
                        cart.AccpetedBy = rows.Rows[i]["accepted_by"].ToString().ToInt();
                        cart.CouponPrice = rows.Rows[i]["coupon_price"].ToString().ToDouble();
                        cart.AcceptedQuantity = rows.Rows[i]["accepted_quantity"].ToString().ToInt();
                        cart.TotalPrice = rows.Rows[i]["total_price"].ToString().ToInt();
                        cart.Notes = rows.Rows[i]["notes"].ToString();
                        cart.CouponTitle = rows.Rows[i]["coupon_title"].ToString();
                        cart.CouponType = rows.Rows[i]["coupon_type"].ToString();
                        cart.CurrencySymbol = rows.Rows[i]["symbol"].ToString();
                        carts.Add(cart);
                    }
                }

            });

            return carts;
        }


        public async Task<List<CustomerRequestedCoupons>> GetCustomerRequestedCoupons(int userId,
         int? statusid, int? coupontypeid)
        {
            List<CustomerRequestedCoupons> carts = new List<CustomerRequestedCoupons>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            param["statusid"] = new MySqlParameter("statusid", statusid);
            param["coupontypeid"] = new MySqlParameter("coupontypeid", coupontypeid);

            var data = this.repo.GetAsync("get_customer_requested_coupons", param);


            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        CustomerRequestedCoupons cart = new CustomerRequestedCoupons();
                        cart.RequestId = rows.Rows[i]["customer_coupon_request_id"].ToString().ToInt();
                        cart.UserId = rows.Rows[i]["user_id"].ToString().ToInt();
                        cart.CouponId = rows.Rows[i]["coupon_id"].ToString().ToInt();
                        cart.RequestQuantity = rows.Rows[i]["total_request_coupon_qty"].ToString().ToInt();
                        cart.CouponQuantity = rows.Rows[i]["coupon_qty"].ToString().ToInt();
                        cart.StatuId = rows.Rows[i]["status_id"].ToString().ToInt();
                        cart.CreatedOn = rows.Rows[i]["createdon"].ToString().ToDateTime();
                        cart.AcceptedOn = rows.Rows[i]["acceptedon"].ToString().ToDateTime();
                        cart.AccpetedBy = rows.Rows[i]["accepted_by"].ToString().ToInt();
                        cart.CouponPrice = rows.Rows[i]["coupon_price"].ToString().ToDouble();
                        cart.AcceptedQuantity = rows.Rows[i]["accepted_quantity"].ToString().ToInt();
                        cart.TotalPrice = rows.Rows[i]["total_price"].ToString().ToInt();
                        cart.Notes = rows.Rows[i]["notes"].ToString();
                        cart.CouponTitle = rows.Rows[i]["coupon_title"].ToString();
                        cart.CouponType = rows.Rows[i]["coupon_type"].ToString();
                        cart.CurrencySymbol = rows.Rows[i]["symbol"].ToString();
                        cart.FullName = rows.Rows[i]["full_name"].ToString();
                        cart.Email = rows.Rows[i]["email_address"].ToString();
                        cart.BusinessName = rows.Rows[i]["business_name"].ToString();
                        cart.Phone = rows.Rows[i]["phone"].ToString();
                        carts.Add(cart);
                    }
                }

            });

            return carts;
        }



        public async Task UpdateRequestStatus(ApproveMetaData approve, int? statusId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["requestid"] = new MySqlParameter("requestid", approve.RequestId);
            param["statusid"] = new MySqlParameter("statusid", statusId);
            param["userid"] = new MySqlParameter("userid", approve.UserId);
            param["quantity"] = new MySqlParameter("quantity", approve.Quantity);
            param["priceperunit"] = new MySqlParameter("priceperunit", approve.Price);
            param["detail_note"] = new MySqlParameter("detail_note", approve.Notes);
            await this.repo.InsertAsync("update_bulk_coupon_approval", param);
        }

    }
}
