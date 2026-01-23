using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Photomate.Domain.Common;
using Photomate.Domain.Config;
using Photomate.Domain.Coupon;
using Photomate.Domain.Mp3;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using Photomate.Registration;
using PhotoMateAPI.ErrorHanding;

namespace PhotoMateAPI.Controllers
{
    //[EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class Mp3Controller : BaseController
    {
        MySqlDatabaseContext mySqlContext;
        private ManageMp3Process mp3Process;
        private CommonProcess commonProcess;
        
        public Mp3Controller(MySqlDatabaseContext context)
            : base(context)
        {
            this.mySqlContext = context;
            this.mp3Process = new ManageMp3Process(this.mySqlContext);
            this.commonProcess = new CommonProcess(this.mySqlContext);
        }

        [HttpPost]
        [Route("AddMp3")]
        public async Task<IActionResult> AddMp3(AddMp3ListMetaData mp3Details)
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();
            foreach (var files in mp3Details.AddMp3MetaData)
            {
                EntityCounterMetaData entityDetail = new EntityCounterMetaData();
                entityDetail.EntityTitle = files.Title.Trim();
                entityDetail.EntityType = TableDetailContent.Mp3;

                var count = await this.commonProcess.EntityCounter(entityDetail);
                if (count == 0)
                {

                    if (!string.IsNullOrEmpty(files.Link))
                    {
                        var logo = files.Link.Substring(files.Link.LastIndexOf(',') + 1);
                        byte[] imageBytes = Convert.FromBase64String(logo);

                        newFileName = System.Guid.NewGuid().ToString() + ".mp3";
                        var imageDataStream = new MemoryStream(imageBytes);
                        imageDataStream.Position = 0;

                        string path = Path.Combine(Directory.GetCurrentDirectory(), "Resources/Mp3Files", newFileName);
                        using (Stream stream = new FileStream(path, FileMode.Create))
                        {
                            imageDataStream.CopyTo(stream);
                        }
                        files.Link = newFileName;

                    }
                    await this.mp3Process.AddMp3(files, userDetail.UserId);
                }
            }

            return Ok();
        }

        [HttpPost]
        [Route("AddAudio")]
        public async Task<IActionResult> AddAudio()
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var httpRequest = Request.Form.Files[0];
            if(httpRequest != null)
            {
                var folder = Path.Combine("Resources/Mp3Files", userDetail.UserId.ToString());
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }
                newFileName = System.Guid.NewGuid().ToString() + ".mp3";

                string path = Path.Combine(Directory.GetCurrentDirectory(), "Resources/Mp3Files", newFileName);

               // var fileName = ContentDispositionHeaderValue.Parse(httpRequest.ContentDisposition).FileName.Replace(" ", "").Trim('"');
               // var fullPath = Path.Combine(pathToSave, newFileName);
               // var dbPath = Path.Combine(folder, newFileName);
                using (var stream = new FileStream(path, FileMode.Create))
                {
                    httpRequest.CopyTo(stream);
                }

                EntityCounterMetaData entityDetail = new EntityCounterMetaData();
                entityDetail.EntityTitle = newFileName;//httpRequest.FileName.Replace(" ", "").Trim('"');
                entityDetail.EntityType = TableDetailContent.Mp3;

                var count = await this.commonProcess.EntityCounter(entityDetail);
                if(count == 0)
                {
                    AddMp3Metadata audioDetails = new AddMp3Metadata();
                    audioDetails.Description = "";
                    audioDetails.Duration = "";
                    audioDetails.FileName = newFileName;
                    audioDetails.IsActive = true;
                    audioDetails.Link = newFileName;
                    audioDetails.Size = httpRequest.Length.ToString();
                    audioDetails.UserId = userDetail.UserId;
                    audioDetails.Mp3Id = 0;
                    audioDetails.Title = httpRequest.FileName;

                    await this.mp3Process.AddMp3(audioDetails, userDetail.UserId);
                }
            }
            return Ok();
        }


        [HttpPost]
        [Route("AddFavourate")]
        public async Task<IActionResult> AddFavourate(FavourateMp3Metadata mp3Details)
        {
            await this.mp3Process.AddFavourate(mp3Details);
            return Ok();
        }

        [HttpGet]
        [Route("GetMp3List")]
        public async Task<IActionResult> GetMp3List(int userId)
        {
            var userDetail = await GetUserDetail();
            var getMp3 = await this.mp3Process.GetAllMp3List(userDetail.UserId);
            var ordBy = getMp3.OrderBy(x => x.FileName).ToList();
            return Ok(getMp3);
        }

        [HttpPost]
        [Route("DeleteMp3")]
        public async Task<IActionResult> DeleteMp3(FavourateMp3Metadata mp3Details)
        {
            var userDetail = await GetUserDetail();
            await this.mp3Process.DeleteMp3(mp3Details.Mp3Id);
            return Ok();
        }

        [HttpPost]
        [Route("SetDefaultMp3")]
        public async Task<IActionResult> SetDefaultMp3(FavourateMp3Metadata mp3Details)
        {
            var userDetail = await GetUserDetail();
            await this.mp3Process.SetDefaultMp3(mp3Details.Mp3Id, userDetail.UserId);
            return Ok();
        }

        [HttpGet]
        [Route("GetAudioDropdown")]
        public async Task<IActionResult> GetAudioDropdown()
        {
            var userDetail = await GetUserDetail();
            var getMp3 = await this.mp3Process.GetDropdownList(userDetail.UserId);
            return Ok(getMp3);
        }

        [HttpPost]
        [Route("AddAudioWin")]
        public async Task<IActionResult> AddAudioWin()
        {
            string newFileName = string.Empty;
            var userDetail = await GetUserDetail();

            var httpRequest = Request.Form.Files[0];
            var mp3Id = 0;
            if (httpRequest != null)
            {
                var folder = Path.Combine("Resources/Mp3Files", userDetail.UserId.ToString());
                var pathToSave = Path.Combine(Directory.GetCurrentDirectory(), folder);

                if (!Directory.Exists(pathToSave))
                {
                    Directory.CreateDirectory(pathToSave);
                }
                newFileName = System.Guid.NewGuid().ToString() + ".mp3";

                string path = Path.Combine(Directory.GetCurrentDirectory(), "Resources/Mp3Files", newFileName);

                // var fileName = ContentDispositionHeaderValue.Parse(httpRequest.ContentDisposition).FileName.Replace(" ", "").Trim('"');
                // var fullPath = Path.Combine(pathToSave, newFileName);
                // var dbPath = Path.Combine(folder, newFileName);
                using (var stream = new FileStream(path, FileMode.Create))
                {
                    httpRequest.CopyTo(stream);
                }

                EntityCounterMetaData entityDetail = new EntityCounterMetaData();
                entityDetail.EntityTitle = newFileName;//httpRequest.FileName.Replace(" ", "").Trim('"');
                entityDetail.EntityType = TableDetailContent.Mp3;

                var count = await this.commonProcess.EntityCounter(entityDetail);
                if (count == 0)
                {
                    AddMp3Metadata audioDetails = new AddMp3Metadata();
                    audioDetails.Description = "";
                    audioDetails.Duration = "";
                    audioDetails.FileName = newFileName;
                    audioDetails.IsActive = true;
                    audioDetails.Link = newFileName;
                    audioDetails.Size = httpRequest.Length.ToString();
                    audioDetails.UserId = userDetail.UserId;
                    audioDetails.Mp3Id = 0;
                    audioDetails.Title = httpRequest.FileName;

                    mp3Id = await this.mp3Process.AddMp3Win(audioDetails, userDetail.UserId);
                }
            }
            return Ok(mp3Id);
        }


    }
}
