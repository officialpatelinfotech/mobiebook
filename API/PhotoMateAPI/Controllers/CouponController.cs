using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Photomate.Domain.Common;
using Photomate.Domain.Config;
using Photomate.Domain.Coupon;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using Photomate.Registration;
using PhotoMateAPI.ErrorHanding;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class CouponController : BaseController
    {
        MySqlDatabaseContext mySqlContext;
        private ManageCouponProcess couponProcess;
        private CommonProcess commonProcess;
        private ManageRegistrationProcess registerProcess;      
        public CouponController(MySqlDatabaseContext context)
            :base(context)
        {
            this.mySqlContext = context;
            this.couponProcess = new ManageCouponProcess(this.mySqlContext);
            this.commonProcess = new CommonProcess(this.mySqlContext);
            this.registerProcess = new ManageRegistrationProcess(this.mySqlContext);
        }


        [HttpPost]
        [Route("AddCoupon")]
        public async Task<IActionResult> AddCoupon(AddCouponMetaData couponDetail)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            EntityCounterMetaData entityDetail = new EntityCounterMetaData();
            entityDetail.EntityTitle = couponDetail.Title.Trim();
            entityDetail.EntityType = TableDetailContent.Coupon;

            var count = await this.commonProcess.EntityCounter(entityDetail);
            if (count > 0)
                throw new AppException("Coupon title already exist.");

            if (!string.IsNullOrEmpty(couponDetail.ImageLink))
            {
                var logo = couponDetail.ImageLink.Substring(couponDetail.ImageLink.LastIndexOf(',') + 1);
                byte[] imageBytes = Convert.FromBase64String(logo);

                newFileName = System.Guid.NewGuid().ToString() + ".jpg";
                var imageDataStream = new MemoryStream(imageBytes);
                imageDataStream.Position = 0;

                string path = Path.Combine(Directory.GetCurrentDirectory(), "Upload", newFileName);
                using (Stream stream = new FileStream(path, FileMode.Create))
                {
                    imageDataStream.CopyTo(stream);
                }

            }
            couponDetail.ImageLink = newFileName;
            
            await this.couponProcess.AddCoupon(couponDetail, userDetail.UserId);
            return Ok();
        }


        [HttpGet]
        [Route("GetCouponById")]
        public async Task<IActionResult> GetCouponById(int couponId)
        {
            var userDetail = await GetUserDetail();
            var getCoupon = await this.couponProcess.GetCouponById(couponId);
            return Ok(getCoupon);
        }

        [HttpPost]
        [Route("AcGetCoupon")]
        public async Task<IActionResult> AcGetCoupon(Pagination pageDetail)
        {
            var userDetail = await GetUserDetail();
            var getCoupon = await this.couponProcess.GetCoupondDetail(pageDetail);
            return Ok(getCoupon);
        }

        [HttpPost]
        [Route("DeleteCoupon")]
        public async Task<IActionResult> DeleteCoupon([FromBody] int couponId)
        {
            var userDetail = await GetUserDetail();            
            await this.couponProcess.DeleteCoupon(couponId, userDetail.UserId, TableDetailToDelete.Coupon);
            return Ok();
        }

        [HttpGet]
        [Route("GetCustomerCoupon")]
        public async Task<IActionResult> GetCustomerCoupon()
        {
            var userDetail = await GetUserDetail();
            var getCoupon = await this.couponProcess.GetUserCoupondDetail(userDetail.UserId);
            return Ok(getCoupon);
        }

        [HttpPost]
        [Route("AcBuyCoupon")]
        public async Task<IActionResult> AcBuyCoupon(AddCartMetaData cart)
        {
            var userDetail = await GetUserDetail();
            var getCoupon = await this.couponProcess.GetCouponById((int)cart.CouponId);
            await this.couponProcess.BuyCoupon(getCoupon, cart, userDetail.UserId);

            return Ok(getCoupon);
        }


        [HttpPost]
        [Route("AcCartDetail")]
        public async Task<IActionResult> AcCartDetail()
        {
            var userDetail = await GetUserDetail();
            var carts = await this.couponProcess.GetUserCartDetail(userDetail.UserId);
            return Ok(carts);
        }

        [HttpPost]
        [Route("DeleteCartItem")]
        public async Task<IActionResult> DeleteCartItem([FromBody] int requestId)
        {
            var userDetail = await GetUserDetail();
            await this.couponProcess.DeleteCoupon(requestId, userDetail.UserId, TableDetailToDelete.CartTable);
            return Ok();
        }

        [HttpPost]
        [Route("UpdateCartStatus")]
        public async Task<IActionResult> UpdateCartStatus(List<UpdateCartStatusMetaData> request)
        {
            var userDetail = await GetUserDetail();
            foreach (var cart in request)
            {
                int isUpdateQty = 0;
                if (cart.StatusId == (int)CouponStatusEnum.ACCEPTED)
                {
                    isUpdateQty = 1;
                }

                await this.couponProcess.UpdateCartStatus(cart.RequestId,
                userDetail.UserId, isUpdateQty, cart.StatusId);
            }

            return Ok();
        }

        [HttpPost]
        [Route("AcCouponRequest")]
        public async Task<IActionResult> AcCouponRequest(CouponRequestMetaData req)
        {
            var userDetail = await GetUserDetail();
            var carts = await this.couponProcess.GetCustomerCouponRequest(userDetail.UserId,req.StatusId,req.CouponType);
            return Ok(carts);
        }

        [HttpPost]
        [Route("AcGetCustomerCouponRequest")]
        public async Task<IActionResult> AcGetCustomerCouponRequest(CouponRequestMetaData req)
        {
            var userDetail = await GetUserDetail();
           
            // 0 to get all request
            var carts = await this.couponProcess.GetCustomerRequestedCoupons(0, req.StatusId, req.CouponType);
            return Ok(carts);
        }

        [HttpPost]
        [Route("AcGetCustomerApproved")]
        public async Task<IActionResult> AcGetCustomerApproved(ApproveMetaData req)
        {
            var userDetail = await GetUserDetail();
            await this.couponProcess.UpdateRequestStatus(req,(int)CouponStatusEnum.ACCEPTED);
            return Ok();
        }



    }
}
