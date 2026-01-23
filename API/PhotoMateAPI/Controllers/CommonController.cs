using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Photomate.Domain.Common;
using Photomate.Domain.PhotoMate.DBContext;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class CommonController : ControllerBase
    {
        MySqlDatabaseContext mySqlContext;       
        private int userId = 1;
        private CommonProcess commonProcess;
        public CommonController(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.commonProcess = new CommonProcess(this.mySqlContext);
        }


        /// <summary>
        /// Pass comma separated master code
        /// </summary>
        /// <param name="couponId"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetMasterByCode")]
        public async Task<IActionResult> GetMasterByCode(string masterCode)
        {
            var masterData = await this.commonProcess.GetMasterDropdown(masterCode);
            return Ok(masterData);
        }


        [HttpGet]
        [Route("GetCountryDetail")]
        public async Task<IActionResult> GetCountryDetail()
        {
            var masterData = await this.commonProcess.GetCountryDropdown();
            return Ok(masterData);
        }

        [HttpGet]
        [Route("GetPageDetail")]
        public async Task<IActionResult> GetPageDetail()
        {
            int pageType = 1;
            var masterData = await this.commonProcess.GetPageDetail(pageType);
            return Ok(masterData);
        }

    }
}
