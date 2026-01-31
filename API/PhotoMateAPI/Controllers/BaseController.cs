using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using Photomate.Registration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        MySqlDatabaseContext mySqlContext;
        private ManageRegistrationProcess registerProcess;
        public BaseController(
            MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.registerProcess = new ManageRegistrationProcess(this.mySqlContext);
        }

        public async Task<UserDetailByTokenMetaData>  GetUserDetail()
        {
            StringValues headerValues;
            var token = string.Empty;
            if (Request.Headers.TryGetValue("AuthKey", out headerValues))
            {
                token = headerValues.FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                throw new UnauthorizedAccessException("Unauthorized: missing AuthKey");
            }

            var userDetail = await this.registerProcess.GetUserDetailByToken(token);
            if (userDetail == null || userDetail.UserId <= 0)
            {
                throw new UnauthorizedAccessException("Unauthorized: invalid or expired AuthKey");
            }

            return userDetail;
        }

        //public async Task<UserDetailByTokenMetaData> GetCustomerUserDetail()
        //{
        //    StringValues headerValues;
        //    var token = string.Empty;
        //    if (Request.Headers.TryGetValue("CustomerAuthKey", out headerValues))
        //    {
        //        token = headerValues.FirstOrDefault();
        //    }

        //    return await this.registerProcess.GetUserDetailByToken(token);
        //}
    }
}
