using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Photomate.Domain.Common;
using Photomate.Domain.Config;
using Photomate.Domain.Coupon;
using Photomate.Domain.EAlbum;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using Photomate.Registration;
using PhotoMateAPI.ErrorHanding;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")] 
    [ApiController] 
    public class RegisterUserController : ControllerBase
    {
        MySqlDatabaseContext mySqlContext;
        private Repository repo;
        private ManageRegistrationProcess registerProcess;
        private CommonProcess commonProcess;
        private EAlbumProcess eAlbumProcess;

        public RegisterUserController(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
            this.registerProcess = new ManageRegistrationProcess(this.mySqlContext);
            this.commonProcess = new CommonProcess(this.mySqlContext);
            this.eAlbumProcess = new EAlbumProcess(context);
        }

        [HttpPost]
        [Route("RegisterUser")] 
        public async Task<IActionResult> RegisterUser(AddUserRegisterMetaData userDetails)
        {
            EntityCounterMetaData entityDetail = new EntityCounterMetaData();
            entityDetail.EntityTitle = userDetails.UserName.Trim();
            entityDetail.EntityType = TableDetailContent.Email;

            var count = await this.commonProcess.EntityCounter(entityDetail);
            if (count > 0)
                throw new AppException("Email already exist.");
            EntityCounterMetaData entityDetailPhone = new EntityCounterMetaData();
            entityDetailPhone.EntityTitle = userDetails.Phone.Trim();
            entityDetailPhone.EntityType = TableDetailContent.Phone;
            var phoneCount = await this.commonProcess.EntityCounter(entityDetailPhone);
            if (phoneCount > 0)
                throw new AppException("Phone already exist.");
            var id = Guid.NewGuid().ToString();
            userDetails.VarificationCode = id;
            await this.registerProcess.RegisterUser(userDetails);
            return Ok(); 
        }

        [HttpPost]
        [Route("LoginUser")]
        public async Task<IActionResult> LoginUser(LoginUserMetaData loginDetails)
        {
            UserDetailResponse resp = new UserDetailResponse();
            var userDetail = await this.registerProcess.LoginUserForAuthentication(loginDetails.UserName, loginDetails.UserPassword);
            if (!string.IsNullOrEmpty(userDetail.UserName))
            {                
                if (userDetail.Password == loginDetails.UserPassword)
                {
                    resp.UserName = userDetail.UserName;
                    resp.UserId = userDetail.UserId;
                    resp.UserType = userDetail.UserTypeName;
                    resp.UserTypeId = userDetail.UserTypeId;
                    resp.FullName = userDetail.FullName;
                    resp.Logo = userDetail.Logo;
                    resp.IsWindowApp = userDetail.IsWindowApp;

                    var getUserMenu = await commonProcess.GetPageDetail((int)resp.UserTypeId);
                    if (getUserMenu.Count > 0)
                    {
                        resp.UserMenuDetails = JsonConvert.SerializeObject(getUserMenu);
                    }

                    var token = await this.registerProcess.GetTokenDetail(resp.UserId);
                    resp.Token = token;
                }
                else
                {
                    throw new AppException("Password not valid");
                }
            }
            else
            {
                throw new AppException("User id not valid");
            }
            return Ok(resp);
        }

        [HttpPost]
        [Route("SaveForgotPassword")]
        public async Task<IActionResult> SaveForgotPassword(ForgotPasswordMetaData forgotUser)
        {
            await this.registerProcess.SaveForgotPassword(forgotUser);
            return Ok();
        }

        [HttpPost]
        [Route("UpdateForgotPassword")]
        public async Task<IActionResult> UpdateForgotPassword(UpdatePasswordMetaData forgotUser)
        {
            await this.registerProcess.UpdateForgotPassword(forgotUser);
            return Ok();
        }

        [HttpPost]
        [Route("AdminLoginUser")]
        public async Task<IActionResult> AdminLoginUser(LoginUserMetaData loginDetails)
        {
            UserDetailResponse resp = new UserDetailResponse();
            var userDetail = await this.registerProcess.LoginUserForAuthentication(loginDetails.UserName, loginDetails.UserPassword);
            if (!string.IsNullOrEmpty(userDetail.UserName))
            {
                if (userDetail.Password == loginDetails.UserPassword)
                {
                    resp.UserName = userDetail.UserName;
                    resp.UserId = userDetail.UserId;
                    resp.UserType = userDetail.UserTypeName;
                    resp.UserTypeId = userDetail.UserTypeId;

                    var getUserMenu = await commonProcess.GetPageDetail(7);
                    if (getUserMenu.Count > 0)
                    {
                        resp.UserMenuDetails = JsonConvert.SerializeObject(getUserMenu);
                    }

                    var token = await this.registerProcess.GetTokenDetail(resp.UserId);
                    resp.Token = token;
                }
                else
                {
                    throw new AppException("Password not valid");
                }
            }
            else
            {
                throw new AppException("User id not valid");
            }
            return Ok(resp);
        }

        [HttpPost]
        [Route("AcValidateCustomer")]
        public async Task<IActionResult> AcValidateCustomer(ValidateCustomerMetaData customer)
        {
            var validation = await this.eAlbumProcess.ValidateEAlbumCustomer(customer);
            if(validation.EAlbumId > 0)
            {
                return Ok(validation);
            }
            else{
                return Ok(false);
            }
            
        }

        [HttpGet]
        [Route("AcGetUserDetail")]
        public async Task<IActionResult> AcGetUserDetail(int ealbumId)
        {
            var userDetail = await this.eAlbumProcess.UserId(ealbumId);
            return Ok(userDetail);

        }

        [HttpPost]
        [Route("AcResetPassword")]
        public async Task<IActionResult> AcResetPassword(ResetPasswordMetaData uniqDetail)
        {
            var reqDetail = await this.registerProcess.GetForgotPasswordDetail(uniqDetail.UniqId);
            if(reqDetail.ExpiredOn <= DateTime.Now && reqDetail.IsUsed == false)
            {
                await this.registerProcess.ResetUserPassword(reqDetail.UserId, uniqDetail.Password);
            }
            else
            {
                throw new AppException("You are requesting with wrong request id.Please generate new request");
            }
            return Ok();

        }

        [HttpGet]
        [Route("FnValidateAlbum")]
        public async Task<IActionResult> FnValidateAlbum(string uniqId)
        {
            var reqDetail = await this.eAlbumProcess.GetEalbumsByUniqCode(uniqId);
            if (reqDetail == null)
            {
                throw new AppException("It's not valid url.");
            }
            
            return Ok(reqDetail);

        }

    }
}
