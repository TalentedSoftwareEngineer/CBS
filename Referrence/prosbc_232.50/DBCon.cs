using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Threading;

namespace ProsbcService
{
    class DBCon
    {
        public string error_str = "";
        public int currpage = 0;
        public int totalpage = 0;
        public int totalcount = 0;
        private string connectStr = "";

        public DBCon(string conStr)
        {
            //
            // TODO: Add constructor logic here
            //
            connectStr = conStr;
        }

        public string ExecuteScalar(string str)
        {
            SqlConnection con = new SqlConnection(connectStr);
            SqlCommand cmd = null;
            string serial = "";
            try
            {
                con.Open();
                cmd = new SqlCommand(str, con);
                cmd.CommandTimeout = 0;
                object obj = cmd.ExecuteScalar();
                if (obj != null)
                    serial = obj.ToString();
            }
            catch (Exception ex)
            {
                error_str = "ExecuteScalar " + str + " error:" + ex.ToString();
                SetLog(error_str);
            }
            con.Close();
            return serial;
        }

        //必须要执行成功，如果有错误，休息一分钟后，再执行
        public bool ExecuteNonQueryMustRunIt(string str)
        {
            bool bOk = false;
            while (!bOk)
            {
                error_str = "";
                SqlConnection con = new SqlConnection(connectStr);
                SqlCommand cmd = null;
                try
                {
                    con.Open();
                    cmd = new SqlCommand(str, con);
                    cmd.CommandTimeout = 0;
                    cmd.ExecuteNonQuery();
                    bOk = true;
                }
                catch (Exception ex)
                {
                    error_str = "ExecuteNonQuery " + str + " get error:" + ex.ToString();
                    SetLog(error_str);
                }
                con.Close();
                if (!bOk)
                {
                    //休息一分钟，再执行
                    Thread.Sleep(1000 * 60);
                }
            }
            return bOk;
        }

        public bool ExecuteNonQuery(string str)
        {
            error_str = "";
            SqlConnection con = new SqlConnection(connectStr);
            SqlCommand cmd = null;
            bool bOk = false;
            try
            {
                con.Open();
                cmd = new SqlCommand(str, con);
                cmd.CommandTimeout = 0;
                cmd.ExecuteNonQuery();
                bOk = true;
            }
            catch (Exception ex)
            {
                error_str = "ExecuteNonQuery " + str + " get error:" + ex.ToString();
                SetLog(error_str);
            }
            con.Close();
            return bOk;
        }
        public bool ExecuteSqlTransaction(string str)
        {
            error_str = "";
            bool bOk = false;
            using (SqlConnection con = new SqlConnection(connectStr))
            {
                con.Open();

                SqlCommand command = con.CreateCommand();
                command.CommandTimeout = 0;
                SqlTransaction transaction;

                // Start a local transaction.
                transaction = con.BeginTransaction("SampleTransaction");

                // Must assign both transaction object and connection
                // to Command object for a pending local transaction
                command.Connection = con;
                command.Transaction = transaction;

                try
                {
                    command.CommandText = str;
                    command.ExecuteNonQuery();

                    // Attempt to commit the transaction.
                    transaction.Commit();
                    bOk = true;
                }
                catch (Exception ex)
                {
                    error_str = "ExecuteNonQuery " + str + " get error:" + ex.ToString();
                    SetLog(error_str);

                    // Attempt to roll back the transaction.
                    try
                    {
                        transaction.Rollback();
                    }
                    catch (Exception ex2)
                    {
                        error_str = "roll back " + str + " get error:" + ex2.ToString();
                        SetLog(error_str);
                    }
                }
                con.Close();
                return bOk;
            }
        }

        public DataSet ExecuteDataSet(string str)
        {
            error_str = "";
            SqlConnection con = new SqlConnection(connectStr);
            SqlCommand cmd = null;
            DataSet ds = null;
            try
            {
                con.Open();
                cmd = new SqlCommand(str, con);
                cmd.CommandTimeout = 0;
                SqlDataAdapter adp = new SqlDataAdapter(cmd);
                ds = new DataSet();
                adp.Fill(ds);
            }
            catch (Exception ex)
            {
                ds = null;
                error_str = "ExecuteDataSet **" + str + "** error:" + ex.ToString();
                SetLog(error_str);
            }
            con.Close();
            return ds;

        }
        public DataSet ExecuteDataSet(string str, int startIndex, int pagesize)
        {
            SqlConnection con = new SqlConnection(connectStr);
            SqlCommand cmd = null;
            DataSet ds = null;
            try
            {
                con.Open();
                cmd = new SqlCommand(str, con);
                cmd.CommandTimeout = 0;
                SqlDataAdapter adp = new SqlDataAdapter(cmd);
                ds = new DataSet();
                adp.Fill(ds, startIndex, pagesize, "db");
            }
            catch (Exception ex)
            {
                error_str = "ExecuteNonQuery error:" + ex.ToString();
                SetLog(error_str);
            }
            con.Close();
            return ds;

        }
        public DataSet ExecutePager(string SQLStetement, string keyfield, string OrderSql, int PageNumber, int PageSize)
        {
            //example 
            //DataSet ds = db.ExecutePager("select * from customer ","customerid",," order by customername ",2,3);
            if (PageNumber < 1) PageNumber = 1;
            string sql = "SELECT TOP " + PageSize.ToString() + " table1.* "
                + " FROM ( " + SQLStetement + " ) table1 "
                + " WHERE table1." + keyfield + " NOT IN "
                + " ( SELECT TOP " + (PageSize * (PageNumber - 1)).ToString() + " table2." + keyfield + " FROM ( " + SQLStetement + " ) table2 ORDER BY table2." + keyfield
                + "  ) "
                + " " + OrderSql;
            string sql1 = "SELECT count(table1." + keyfield + ") "
                + " FROM ( " + SQLStetement + " ) table1 ";
            ////test
            //SetLogSQL("pagesql:"+sql);
            currpage = PageNumber;
            //get total page
            totalcount = int.Parse(getValue(ExecuteScalar(sql1), "0"));
            totalpage = totalcount % PageSize == 0 ? (totalcount / PageSize) : (totalcount / PageSize + 1);

            DataSet ds = ExecuteDataSet(sql);
            SetLog("pagesql:" + sql + " --totalcount:" + totalcount.ToString()
                + " --currpage:" + currpage.ToString()
                + " --pagesize:" + PageSize.ToString()
                + "-- totalpage:" + totalpage.ToString());
            return ds;
        }

        private void SetLog(string strInput)
        {
            string strFileName;
            strFileName = AppDomain.CurrentDomain.SetupInformation.ApplicationBase + "runtime-log" + DateTime.Now.ToString("yyyyMMdd") + ".txt";
            StreamWriter w = new StreamWriter(strFileName, true);
            w.WriteLine(strInput + "    " + DateTime.Now.ToString());
            w.Close();
        }
        public string getValue(object obj, string default_str)
        {
            string ss = default_str;
            if (obj != null)
            {
                ss = obj.ToString();
            }
            if (ss == "")
                ss = default_str;
            return ss;
        }
    }

}
