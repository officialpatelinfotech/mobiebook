using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Photomate.Domain.PhotoMate.DBContext
{
    public class Repository
    {
        private MySqlDatabaseContext dbContext;
        public Repository(MySqlDatabaseContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task InsertAsync(string procedure,
            Dictionary<string, MySqlParameter> procParameters)
        {
            using MySqlCommand cmd = new MySqlCommand(procedure, this.dbContext.connection);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            foreach (var param in procParameters)
            {
                cmd.Parameters.Add(param.Value);
            }
            cmd.Connection.Open();
            try
            {
                var resp = await cmd.ExecuteNonQueryAsync();
            }
            catch
            {
                throw;
            }
            finally
            {
                cmd.Connection.Close();
            }

        }

        public DataSet GetAsync(string procedure,
            Dictionary<string, MySqlParameter> procParameters = null)
        {
            DataSet ds = new DataSet();
            using MySqlCommand cmd = new MySqlCommand(procedure, this.dbContext.connection);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;

            if (procParameters != null)
            {
                foreach (var param in procParameters)
                {
                    cmd.Parameters.Add(param.Value);
                }
            }

            using (MySqlDataAdapter da = new MySqlDataAdapter(cmd))
            {
                da.Fill(ds);
            }
            return ds;
        }

        public async Task<int> InsertAsync(string procedure,
           Dictionary<string, MySqlParameter> procParameters,string outputName)
        {
            int outParam = 0;
            using MySqlCommand cmd = new MySqlCommand(procedure, this.dbContext.connection);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            foreach (var param in procParameters)
            {
                cmd.Parameters.Add(param.Value);
            }
            cmd.Connection.Open();
            try
            {
                var resp = await cmd.ExecuteNonQueryAsync();
                var respValue = cmd.Parameters[outputName].Value;
                outParam = Convert.ToInt32(respValue);
            }
            catch
            {
                throw;
            }
            finally
            {
                cmd.Connection.Close();
            }
            return outParam;
        }

        public DataSet GetAsync(string procedure,
            out int total,
            Dictionary<string, MySqlParameter> procParameters = null)
        {
            DataSet ds = new DataSet();
            using MySqlCommand cmd = new MySqlCommand(procedure, this.dbContext.connection);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;

            string paramName = string.Empty;
            if (procParameters != null)
            {
                foreach (var param in procParameters)
                {
                    var val = param.Value;
                    if(val.Direction == ParameterDirection.Output)
                    {
                        paramName = val.ParameterName;
                    }
                    cmd.Parameters.Add(param.Value);
                }
               
            }
            
            using (MySqlDataAdapter da = new MySqlDataAdapter(cmd))
            {
                da.Fill(ds);
                var respValue = cmd.Parameters[paramName].Value;
                total = Convert.ToInt32(respValue);
            }
            return ds;
        }

    }
}
