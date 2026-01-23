using System;


namespace Photomate.Domain.Config
{
    public static class ExtensionMethod
    {
        public static Int32 ToInt(this string val)
        {
            if (string.IsNullOrEmpty(val))
                return 0;

            return Convert.ToInt32(val);
        }

        public static Double ToDouble(this string val)
        {
            if (string.IsNullOrEmpty(val))
                return 0;

            return Convert.ToDouble(val);
        }

        public static DateTime? ToDateTime(this string val)
        {
            if (string.IsNullOrEmpty(val))
                return null;

            if (val == null)
                return null;

            if (val == "null")
                return null;

            return Convert.ToDateTime(val);
        }

        public static bool? ToBool(this string val)
        {
            if (string.IsNullOrEmpty(val))
                return null;

            if(val == "1" || val == "true")
            {
                return true;
            }
            else
            {
                return false;
            }

            return Convert.ToBoolean(val);
        }
    }
}
