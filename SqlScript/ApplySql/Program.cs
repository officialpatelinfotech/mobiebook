using System;
using System.Collections.Generic;
using System.IO;
using MySql.Data.MySqlClient;
using System.Data;

namespace ApplySql
{
    internal static class Program
    {
        private static int Main(string[] args)
        {
            try
            {
                var opts = ParseArgs(args);

                var host = GetOpt(opts, "host", "localhost");
                var port = int.Parse(GetOpt(opts, "port", "3306"));
                var database = GetOpt(opts, "database", null);
                var user = GetOpt(opts, "user", "root");
                var password = GetOpt(opts, "password", null);
                var file = GetOpt(opts, "file", null);
                var query = GetOpt(opts, "query", null);

                if (string.IsNullOrWhiteSpace(database))
                    return Fail("Missing --database");
                if (string.IsNullOrWhiteSpace(file) && string.IsNullOrWhiteSpace(query))
                    return Fail("Missing --file or --query");

                string sqlPath = null;
                string sql = null;
                if (!string.IsNullOrWhiteSpace(file))
                {
                    sqlPath = Path.GetFullPath(file);
                    if (!File.Exists(sqlPath))
                        return Fail($"SQL file not found: {sqlPath}");
                    sql = File.ReadAllText(sqlPath);
                }

                // Allow empty password; if omitted entirely, default to empty to match current API dev config.
                if (password == null)
                    password = string.Empty;

                var csb = new MySqlConnectionStringBuilder
                {
                    Server = host,
                    Port = (uint)port,
                    Database = database,
                    UserID = user,
                    Password = password,
                    CharacterSet = "utf8mb4",
                    // Helpful for running scripts.
                    AllowUserVariables = true,
                };

                using var conn = new MySqlConnection(csb.ConnectionString);
                conn.Open();

                if (!string.IsNullOrWhiteSpace(query))
                {
                    using var cmd = new MySqlCommand(query, conn);
                    using var reader = cmd.ExecuteReader();
                    PrintReader(reader);
                    return 0;
                }

                if (string.IsNullOrWhiteSpace(sql))
                    return Fail("Empty SQL");

                var script = new MySqlScript(conn)
                {
                    // Our patch files use $$ as the delimiter to allow stored procedure bodies.
                    Delimiter = "$$",
                    Query = sql,
                };

                var statements = script.Execute();
                Console.WriteLine($"OK: executed {statements} statement(s) against {host}:{port}/{database}");
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("ERROR: " + ex.Message);
                return 2;
            }
        }

        private static int Fail(string msg)
        {
            Console.Error.WriteLine("ERROR: " + msg);
            Console.Error.WriteLine("Usage:\n  Apply file:  dotnet run --project SqlScript/ApplySql -- --database <db> --file <path.sql> [--host localhost] [--port 3306] [--user root] [--password <pwd>]\n  Run query:   dotnet run --project SqlScript/ApplySql -- --database <db> --query \"SELECT ...\" [--host localhost] [--port 3306] [--user root] [--password <pwd>]\n(password may be empty; use --password=)");
            return 1;
        }

        private static void PrintReader(IDataReader reader)
        {
            var fieldCount = reader.FieldCount;
            for (var i = 0; i < fieldCount; i++)
            {
                if (i > 0) Console.Write("\t");
                Console.Write(reader.GetName(i));
            }
            Console.WriteLine();

            while (reader.Read())
            {
                for (var i = 0; i < fieldCount; i++)
                {
                    if (i > 0) Console.Write("\t");
                    var val = reader.IsDBNull(i) ? "" : Convert.ToString(reader.GetValue(i));
                    Console.Write(val);
                }
                Console.WriteLine();
            }
        }

        private static Dictionary<string, string> ParseArgs(string[] args)
        {
            var opts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < args.Length; i++)
            {
                var a = args[i] ?? string.Empty;
                if (!a.StartsWith("--"))
                    continue;

                var keyVal = a.Substring(2);
                var eq = keyVal.IndexOf('=');
                if (eq >= 0)
                {
                    var key = keyVal.Substring(0, eq);
                    var val = keyVal.Substring(eq + 1);
                    opts[key] = val;
                    continue;
                }

                var keyOnly = keyVal;
                string next = null;
                if (i + 1 < args.Length && !(args[i + 1] ?? string.Empty).StartsWith("--"))
                {
                    next = args[i + 1];
                    i++;
                }

                opts[keyOnly] = next ?? string.Empty;
            }
            return opts;
        }

        private static string GetOpt(Dictionary<string, string> opts, string key, string fallback)
        {
            if (opts.TryGetValue(key, out var val))
                return val;
            return fallback;
        }
    }
}
