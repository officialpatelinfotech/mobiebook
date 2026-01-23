using MySql.Data.MySqlClient;
using Photomate.Domain.Config;
using Photomate.Domain.PhotoMate.DBContext;
using Photomate.Model.ViewModel;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Domain.Mp3
{
    public class ManageMp3Process
    {
        private Repository repo;
        MySqlDatabaseContext mySqlContext;
        public ManageMp3Process(MySqlDatabaseContext context)
        {
            this.mySqlContext = context;
            this.repo = new Repository(this.mySqlContext);
        }


        public async Task AddMp3(AddMp3Metadata mp3Details, int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["mp3_id"] = new MySqlParameter("mp3_id", mp3Details.Mp3Id);
            param["mp3_title"] = new MySqlParameter("mp3_title", mp3Details.Title.Trim());
            param["mp3_size"] = new MySqlParameter("mp3_size", mp3Details.Size);
            param["mp3_duration"] = new MySqlParameter("mp3_duration", mp3Details.Duration);
            param["mp3_link"] = new MySqlParameter("mp3_link", mp3Details.Link);
            param["mp3_file_name"] = new MySqlParameter("mp3_file_name", mp3Details.Description);
            param["isactive"] = new MySqlParameter("isactive", mp3Details.IsActive);
            param["mp3_description"] = new MySqlParameter("mp3_description", mp3Details.Description);
            param["created_by"] = new MySqlParameter("created_by", mp3Details.UserId);
            param["modified_by"] = new MySqlParameter("modified_by", mp3Details.UserId);

            await this.repo.InsertAsync("add_mp3", param);  
        }

        public async Task AddFavourate(FavourateMp3Metadata mp3Details)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["mp3id"] = new MySqlParameter("mp3id", mp3Details.Mp3Id);
            param["userid"] = new MySqlParameter("userid", mp3Details.UserId);
            param["isactive"] = new MySqlParameter("isactive", mp3Details.IsActive);

            await this.repo.InsertAsync("add_mp3_fav", param);
        }

        public async Task<List<ManageMp3Metadata>> GetAllMp3List(int userId)
        {
            List<ManageMp3Metadata> mp3List = new List<ManageMp3Metadata>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["user_id"] = new MySqlParameter("user_id", userId);
            var data = this.repo.GetAsync("get_all_mp3", param);

            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        ManageMp3Metadata mp3Files = new ManageMp3Metadata();
                        mp3Files.Title = rows.Rows[i]["mp3_title"].ToString();
                        mp3Files.Mp3Id = rows.Rows[i]["mp3_id"].ToString().ToInt();
                        mp3Files.Link = rows.Rows[i]["mp3_link"].ToString();
                        mp3Files.Size = rows.Rows[i]["mp3_size"].ToString();
                        mp3Files.Duration = rows.Rows[i]["mp3_duration"].ToString();
                        mp3Files.FileName = rows.Rows[i]["file_name"].ToString();
                        mp3Files.Description = rows.Rows[i]["description_detail"].ToString();
                        mp3Files.SelectedUserId = rows.Rows[i]["userid"].ToString().ToInt();
                        mp3Files.IsActive = rows.Rows[i]["isactive"].ToString().ToBool();
                        mp3Files.IsDefault = rows.Rows[i]["isdefault"].ToString().ToBool();

                        mp3List.Add(mp3Files);
                    }
                }

            });

            return mp3List;
        }

        public async Task DeleteMp3(int mp3_id)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["mp3id"] = new MySqlParameter("mp3id", mp3_id);
            await this.repo.InsertAsync("delete_mp3", param);
        }

        public async Task SetDefaultMp3(int mp3_id, int userId)
        {
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["mp3id"] = new MySqlParameter("mp3id", mp3_id);
            param["userid"] = new MySqlParameter("userid", userId);
            await this.repo.InsertAsync("set_default_mp3", param);
        }

        public async Task<List<AudioDropdownMetaData>> GetDropdownList(int userId)
        {
            List<AudioDropdownMetaData> audios = new List<AudioDropdownMetaData>();
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();
            param["userid"] = new MySqlParameter("userid", userId);
            var data = this.repo.GetAsync("get_audio", param);
            await Task.Run(() =>
            {
                if (data.Tables.Count > 0)
                {
                    var rows = data.Tables[0];
                    for (var i = 0; i < rows.Rows.Count; i++)
                    {
                        AudioDropdownMetaData audio = new AudioDropdownMetaData();
                        audio.AudioId = rows.Rows[i]["mp3_id"].ToString().ToInt();
                        audio.Title = rows.Rows[i]["mp3_title"].ToString();
                        audio.IsDefault = rows.Rows[i]["isactive"].ToString().ToBool();
                        audio.IsFavorite = rows.Rows[i]["isdefault"].ToString().ToBool();
                        audios.Add(audio);
                    }
                }

            });

            return audios;
        }

        public async Task<int> AddMp3Win(AddMp3Metadata mp3Details, int userId)
        {
            int mp3Id = 0;
            Dictionary<string, MySqlParameter> param = new Dictionary<string, MySqlParameter>();

            param["mp3_id"] = new MySqlParameter("mp3_id", mp3Details.Mp3Id);
            param["mp3_title"] = new MySqlParameter("mp3_title", mp3Details.Title.Trim());
            param["mp3_size"] = new MySqlParameter("mp3_size", mp3Details.Size);
            param["mp3_duration"] = new MySqlParameter("mp3_duration", mp3Details.Duration);
            param["mp3_link"] = new MySqlParameter("mp3_link", mp3Details.Link);
            param["mp3_file_name"] = new MySqlParameter("mp3_file_name", mp3Details.Description);
            param["isactive"] = new MySqlParameter("isactive", mp3Details.IsActive);
            param["mp3_description"] = new MySqlParameter("mp3_description", mp3Details.Description);
            param["created_by"] = new MySqlParameter("created_by", mp3Details.UserId);
            param["modified_by"] = new MySqlParameter("modified_by", mp3Details.UserId);
            param["mp3Id"] = new MySqlParameter("mp3Id", mp3Id);
            param["mp3Id"].Direction = ParameterDirection.Output;

            var val = await this.repo.InsertAsync("add_mp3_win", param, "mp3Id");
            return val;
        }
    }
}
