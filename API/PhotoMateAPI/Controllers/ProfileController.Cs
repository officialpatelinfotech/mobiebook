using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using Photomate.Domain.Common;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Domain.Profile;
using Photomate.Model.ViewModel;
using PhotoMateAPI.ErrorHanding;

namespace PhotoMateAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        MySqlDatabaseContext mySqlContext;
        private Repository repo;
        private ProfileProcess profileProcess;
        private CommonProcess commonProcess;

        public ProfileController(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
            this.profileProcess = new ProfileProcess(this.mySqlContext);
            this.commonProcess = new CommonProcess(this.mySqlContext);
        }


        [HttpPost]
        [Route("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile(UserProfileMetadata profileData)
        {
            string newFileName = string.Empty;

            if (!string.IsNullOrEmpty(profileData.Logo))
            {
                var logo = profileData.Logo.Substring(profileData.Logo.LastIndexOf(',') + 1);
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
            profileData.Logo = newFileName;
            await this.profileProcess.UpdateProfile(profileData);
            return Ok();
        }


        [HttpGet]
        [Route("GetProfileById")]
        public async Task<IActionResult> GetProfileById(int userId)
        {
            var profileDetails = await this.profileProcess.GetProfileById(userId);
            return Ok(profileDetails);
        }

    }
}
