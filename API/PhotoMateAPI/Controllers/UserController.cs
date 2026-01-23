using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
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
    public class UserController : BaseController
    {
        MySqlDatabaseContext mySqlContext;
        private ManageUserProcess userProcess;
        private CommonProcess commonProcess;
        private ManageRegistrationProcess registerProcess;
       
        public UserController(MySqlDatabaseContext context)
            :base(context)
        {
            this.mySqlContext = context;
            this.userProcess = new ManageUserProcess(this.mySqlContext);
            this.commonProcess = new CommonProcess(this.mySqlContext);
            this.registerProcess = new ManageRegistrationProcess(this.mySqlContext);
        }


        [HttpPost]
        [Route("AcGetUserList")]
        public async Task<IActionResult> AcGetUserList(PaginationUserMetaData pageDetail)
        {
            await GetUserDetail();
            var userDetails = await this.userProcess.GetUserList(pageDetail);
            return Ok(userDetails);
        }


        [HttpPost]
        [Route("AcUpdateUserWindowAppStatus")]
        public async Task<IActionResult> AcUpdateUserWindowAppStatus(UserWindowAppStatus app)
        {
            await this.registerProcess.UpdateUserWindowApp(app.UserId, app.Status);
            return Ok();
        }

        [HttpPost]
        [Route("AcUpdateUserStatus")]
        public async Task<IActionResult> AcUpdateUserStatus(UserWindowAppStatus app)
        {
            await this.registerProcess.UpdateUserStatus(app.UserId, app.Status);
            return Ok();
        }

        [HttpGet]
        [Route("FnGetSettingDetail")]
        public async Task<IActionResult> FnGetSettingDetail()
        {
            var userDetail = await GetUserDetail();
            var setting = await this.commonProcess.GetSettingDetail((int)userDetail.UserType);
            return Ok(setting);
        }

        [HttpPost]
        [Route("AcUpdateSetting")]
        public async Task<IActionResult> AcUpdateSetting(UpdateSettingMetaData setting)
        {
            var userDetail = await GetUserDetail();
            await this.commonProcess.UpdateSettingDetail(setting);
            return Ok();
        }

    }
}
