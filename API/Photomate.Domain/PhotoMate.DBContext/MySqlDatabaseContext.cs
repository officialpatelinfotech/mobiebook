using MySql.Data.MySqlClient;
using System;

namespace Photomate.Domain.PhotoMate.DBContext
{
    public class MySqlDatabaseContext : IDisposable
    {
        public MySqlConnection connection;

        public MySqlDatabaseContext(string connectionString)
        {
            connection = new MySqlConnection(connectionString);
        }
        public void Dispose() => connection.Dispose();
    }
}
