//by zouxu 20120505 ,entice8
//for .102.50
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.ServiceProcess;
using System.Text;
using System.Timers;
using System.Collections;
using System.Xml;
using System.Data.SqlClient;
using System.IO;
using System.IO.Compression; 
using System.Net;
using System.Threading;
using MySql.Data.MySqlClient;

//.102.50

namespace ProsbcService
{
    public partial class Service1 : ServiceBase
    {
        private bool m_WorkFlag = false;

        private string m_TempLogID = "";
        private GetConfig objConfig;
        public static System.Collections.ArrayList month_table_list = new System.Collections.ArrayList();
        public static System.Collections.ArrayList imported_month_table_list = new System.Collections.ArrayList();
        public static ArrayList imported_files = new ArrayList();

        public Service1()
        {
            InitializeComponent();

            try
            {
                objConfig = new GetConfig();
                SetLog("server count:"+objConfig.serverConfigs.Count.ToString());
            }
            catch (Exception ex)
            {
                SetLog( ex.ToString());
            }
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                SetLog("Starting Service");
                this.timer1.Interval = int.Parse(objConfig.AutoInterval) * 60 * 1000;
                this.timer1.Enabled = true;
            }
            catch (Exception ex)
            {
                SetLog(ex.ToString());
            }
        }

        protected override void OnStop()
        {
            SetLog( "Ending Service");
            this.timer1.Enabled = false;
        }
        private void SetLog(string strInput)
        {
            string strFileName = AppDomain.CurrentDomain.SetupInformation.ApplicationBase + "logs\\runtime-log" + DateTime.Now.ToString("yyyyMMdd") + ".txt";
            StreamWriter w = new StreamWriter(strFileName, true);
            w.WriteLine(strInput + "    " + DateTime.Now.ToString());
            w.Close();
        }

        private void timer1_Elapsed(object sender, ElapsedEventArgs e)
        {
            try
            {
                ImportCDRData();
            }
            catch (Exception ex)
            {
                SetLog( "import CDR Data Cause Error (" + ex.ToString() + ")");
            }

            return;
        }
        #region import cdr data
        #region sftp
        private System.Collections.ArrayList getFileListFromSftpserver(ServerConfig serverConfig)
        {
            Renci.SshNet.SftpClient sftp;
            if (serverConfig.sftp_publickey == "")
            {
                sftp = new Renci.SshNet.SftpClient(serverConfig.sftp_server, serverConfig.sftp_port, serverConfig.sftp_user, serverConfig.sftp_password);
            }
            else
            {
                Renci.SshNet.PrivateKeyFile pKeyFile = new Renci.SshNet.PrivateKeyFile(serverConfig.sftp_publickey);
                Renci.SshNet.PrivateKeyFile[] pKeyList = new Renci.SshNet.PrivateKeyFile[1] { pKeyFile };
                sftp = new Renci.SshNet.SftpClient(serverConfig.sftp_server, serverConfig.sftp_port, serverConfig.sftp_user, pKeyList);
            }
            try
            {
                sftp.Connect();
                System.Collections.ArrayList list = new System.Collections.ArrayList();
                var files = sftp.ListDirectory(serverConfig.sftp_path);
                foreach (var file in files)
                {
                    string name = file.Name;

                    list.Add(name);

                }
                sftp.Disconnect();
                return list;
            }
            catch (Exception ex)
            {
                SetLog("getFileListFromSftpserver " + serverConfig.sftp_server + " (" + ex.ToString() + ")");
                return null;
            }
        }
        private bool DownloadFile(string filename, ServerConfig serverConfig)
        {
            bool ok = false;
            try
            {
                Renci.SshNet.SftpClient sftp;
                if (serverConfig.sftp_publickey == "")
                {
                    sftp = new Renci.SshNet.SftpClient(serverConfig.sftp_server, serverConfig.sftp_port, serverConfig.sftp_user, serverConfig.sftp_password);
                }
                else
                {
                    Renci.SshNet.PrivateKeyFile pKeyFile = new Renci.SshNet.PrivateKeyFile(serverConfig.sftp_publickey);
                    Renci.SshNet.PrivateKeyFile[] pKeyList = new Renci.SshNet.PrivateKeyFile[1] { pKeyFile };
                    sftp = new Renci.SshNet.SftpClient(serverConfig.sftp_server, serverConfig.sftp_port, serverConfig.sftp_user, pKeyList);
                }

                sftp.Connect();
                string remotefile = serverConfig.sftp_path + "/" + filename;
                string localfile = serverConfig.ImportPath + "\\" + filename;
                using (var file = File.OpenWrite(localfile))
                {
                    sftp.DownloadFile(remotefile, file);
                }

                sftp.Disconnect();
                ok = true;
            }
            catch (Exception ex)
            {
                SetLog("import CDR Data Cause Error (" + ex.ToString() + ")");
            }

            return ok;
        }

        public void UnGzipFile(string path, string decomPath, bool overwrite, ServerConfig serverConfig)
        {
            //decomPath = serverConfig.ImportPath + "\\" + decomPath;
            path = serverConfig.ImportPath + "\\" + path;

            //for overwriting purposes
            if (File.Exists(decomPath))
            {
                if (overwrite)
                {
                    File.Delete(decomPath);
                }
                else
                {
                    throw new IOException("The decompressed path you specified already exists and cannot be overwritten.");
                }
            }
            //create our file streams
            GZipStream stream = new GZipStream(new FileStream(path, FileMode.Open, FileAccess.ReadWrite), CompressionMode.Decompress);
            FileStream decompressedFile = new FileStream(decomPath, FileMode.OpenOrCreate, FileAccess.Write);
            //data represents a byte from the compressed file
            //it's set through each iteration of the while loop
            int data;
            while ((data = stream.ReadByte()) != -1) //iterates over the data of the compressed file and writes the decompressed data
            {
                decompressedFile.WriteByte((byte)data);
            }
            //close our file streams 
            decompressedFile.Close();
            stream.Close();
        }

        private bool wrongFilename(string filename)
        {
            if (filename.Length < 20)
                return true;
            else
                return !(filename.Length == "cdr_2021-04-06_06-30-00.log.gz".Length && filename.Substring(0, 6) == "cdr_20");
        }

        private bool CheckImportFile(string filename,ServerConfig serverConfig)
        {
            #region
            string sImportingFile = serverConfig.sftp_server + "_" + filename;
            if (imported_files.IndexOf(sImportingFile) >= 0)
            {
                return false;
            }
            #endregion
            //不用判断文件时间，只判断文件名称
            #region
            //like cdr_2021-04-06_06-30-00.log.gz
            if (wrongFilename(filename))
                return  false;

            string strTemDayTableName = "";
            string strTemp = "";
            if (filename.Substring(0, filename.LastIndexOf(".")).Length >= 8)
            {
                strTemDayTableName = filename.Substring(4, 10);
                try
                {
                    strTemp = strTemDayTableName;
                    DateTime.Parse(strTemp);
                }
                catch (Exception ex)
                {
                    SetLog("filename:" + filename + " strTemDayTableName:" + strTemDayTableName + "  " + ex.ToString());
                    strTemDayTableName = "";

                }
            }
            if (strTemDayTableName == "")
                return false;
            else
            {
                //m_TemDayTableName = "D" + strTemDayTableName;
                //m_MonthTableName = "M" + strTemDayTableName.Substring(0, 6);
            }

            //if (DateTime.Parse(strTemp) < DateTime.Parse("2012-04-30"))
            if (DateTime.Parse(strTemp) < DateTime.Parse(serverConfig.sftp_startdate))
                return false;

            SqlConnection conn = new SqlConnection(serverConfig.DBConn);

            string filefullname = serverConfig.ImportPath + "\\" + filename;
            //string strSql = "select count(*) as count from CDR_Nextone_Log"
            //    + " where FileName='" + filefullname + "'"
            //    + " and SucessFlag=1";
            //换了路径，所以要使用like,不能用精确匹配
            string strSql = "select count(*) as count from imported_Log"
                + " where FileName like '%" + filename.Replace("_processed", "") + "%'"
                + " and sftp_server='" + serverConfig.sftp_server + "'"
                + " and SucessFlag=1";


            conn.Open();
            SqlCommand cmd = new SqlCommand(strSql, conn);
            string count = cmd.ExecuteScalar().ToString();
            conn.Close();

            bool bNotExited = count == "0";
            if (!bNotExited)
            {
                imported_files.Add(sImportingFile);
            }
            return bNotExited;
            #endregion
        }


        #endregion
        private void ImportCDRData()
        {
            #region
            if (m_WorkFlag)
                return;
            else
            {
                m_WorkFlag = true;

                #region import prosbc cdrs
                try
                {
                    for (int jj = 0; jj < objConfig.serverConfigs.Count ; jj++)
                    {
                        //加上active的判断。这样设置起来方便一点。active=1的才进行导入
                        if (!objConfig.serverConfigs[jj].bActive)
                            continue;
                        ServerConfig serverConfig = (objConfig.serverConfigs[jj] as ServerConfig);
                        #region start import cdr data
                        try
                        {
                            SetLog("start Import prosbc cdrs for server " + serverConfig.sftp_server);
                            System.Collections.ArrayList cdrfiles = new ArrayList();
                            cdrfiles = getFileListFromSftpserver(serverConfig);
							//由于sftp server原因，这个地方延迟1分钟，避免竞争。
                            Thread.Sleep(1000*60);
                            int countlimit = 0; //只允许一次导入48个文件，即1天的数据
                            Thread.Sleep(1000 * 60);
                            for (int ii = 0; ii < cdrfiles.Count; ii++)
                            {
                                //if (countlimit > 48)
                                //{
                                //    break;
                                //}
                                string filename = (string)cdrfiles[ii];
                                string filefullname = serverConfig.ImportPath + "\\" + filename;
                                string filefullname_unzip = filefullname.Replace(".gz", "");

                                if (wrongFilename(filename))
                                    continue;
                                if (CheckImportFile(filename, serverConfig)) //用修改后的名字
                                {
                                    countlimit++;
                                    SetLog("download file from server:" + filename);
                                    DownloadFile(filename, serverConfig);//用实际名字
                                    UnGzipFile(filename, filefullname_unzip, true, serverConfig);
                                    SetLog( "start import new CDR Data");

                                    FileInfo finfo = new FileInfo(filefullname_unzip);
                                    if (getCDRData(filefullname, filefullname_unzip, ',', finfo.LastWriteTime.ToString(), serverConfig))
                                    {
                                        //okay
                                    }
                                    //break;
                                }

                            }
                        }
                        catch (Exception ex)
                        {
                            SetLog("import CDR Data failed (" + ex.ToString() + ") for server " + serverConfig.DatabaseName);
                        }
                        #endregion
                    }
                    //#region 自动创建invoice ，rate service had done it
                    //AutoCreateInvoice();
                    //#endregion
                }
                catch (Exception ex)
                {
                    SetLog("import CDR Data failed (" + ex.ToString() + ") ");
                }
                //dtSuccFile = null;
                SetLog( "end ImportCDRData New");
                #endregion
                m_WorkFlag = false;
            }
            #endregion
        }
        public static string GetSQLDate_str(object date)
        {
            string res = "";
            if (date != null && date.ToString().Trim() != "")
            {
                try
                {
                    DateTime dt = DateTime.Parse(date.ToString().Trim());
                    //select convert(dt, 101); 
                    res = dt.ToString("yyyy-MM-dd");
                }
                catch
                {
                    res = "";
                }
            }
            if (res == "1900-01-01")
                res = "";
            return res;
        }
        public DateTime getSqlDate(string datestr)
        {
            //datestr must like 2009-05-06
            try
            {
                DateTime dt;
                int year = int.Parse(datestr.Substring(0, 4));
                int month = int.Parse(datestr.Substring(5, 2));
                int day = int.Parse(datestr.Substring(8, 2));
                //int hour = int.Parse(datestr.Substring(11, 2));
                //int minute = int.Parse(datestr.Substring(14, 2));
                //int second = int.Parse(datestr.Substring(17, 2));
                //dt = new DateTime(year, month, day, hour, minute, second);
                dt = new DateTime(year, month, day);
                return dt;
            }
            catch (Exception ex)
            {
                SetLog("getSqlDate:" + " " + datestr + ex.ToString());
                return DateTime.Now;
            }
        }

        private DataTable dt=null;

        /// <summary>  
        /// 时间戳转为C#格式时间  
        /// </summary>  
        /// <param name="timeStamp">Unix时间戳格式</param>  
        /// <returns>C#格式时间</returns>  
        public static string getTime(string timeStamp)
        {
            DateTime dtStart = TimeZone.CurrentTimeZone.ToLocalTime(new DateTime(1970, 1, 1));
            long lTime = long.Parse(timeStamp + "0000000");
            TimeSpan toNow = new TimeSpan(lTime);
            return dtStart.Add(toNow).ToString("yyyy-MM-dd HH:mm:ss");
        }  
        /*
         * 
         filename : sftp server下载的文件名
         SourceFileName : 处理后的实际文件名
         * 
         * 
         */

        private bool getCDRData(string filefullname, string SourceFileName, char cDelimite, string strFileTime, ServerConfig serverConfig)
        {
            imported_month_table_list = new System.Collections.ArrayList(); 
            bool bSuccess = true;
            string strSql = "insert into imported_Log(FileName,StartImportTime,sftp_server)"
                + " values('" + filefullname + "',getdate(),'" + serverConfig.sftp_server + "')"
                + " select @@identity from imported_Log";
            SqlConnection conn = new SqlConnection(serverConfig.DBConn);
            conn.Open();
            MySqlConnection mycon = new MySqlConnection("server=208.78.161.221;uid=dipvutel;pwd=t1tt13z8u7y*U&Y");
            //MySqlConnection mycon = new MySqlConnection("server=api.minixel.com;uid=dipvutel;pwd=t1tt13z8u7y*U&Y");
            MySqlCommand mycmd = new MySqlCommand("call lrn.freelrn('')", mycon);
            if (serverConfig.bLrn)
            {
                mycon.Open();
            }

            SqlCommand cmd = new SqlCommand(strSql, conn);
            cmd.CommandTimeout = 1200;
            m_TempLogID = cmd.ExecuteScalar().ToString();

            strSql = "if exists(select * from dbo.sysobjects where id=object_id(N'[dbo].[cdr_import_data_temp]')"
                + " and OBJECTPROPERTY(id,N'IsUserTable')=1) drop table cdr_import_data_temp";
            cmd.CommandText = strSql;
            cmd.ExecuteNonQuery();

            strSql = "select * into cdr_import_data_temp from cdr_import_data where 1=2";
            cmd.CommandText = strSql;
            cmd.ExecuteNonQuery();

            #region create dt
            dt = new DataTable();
            dt.Columns.Add("StatusType");
            dt.Columns.Add("SessionId");
            dt.Columns.Add("LegId_Originate");
            dt.Columns.Add("LegId_Answer");
            dt.Columns.Add("StartTime");
            dt.Columns.Add("ConnectedTime");
            dt.Columns.Add("Calling");
            dt.Columns.Add("Called");
            dt.Columns.Add("NAP_Originate");
            dt.Columns.Add("NAP_Answer");
            dt.Columns.Add("Protocol");
            dt.Columns.Add("Direction");
            dt.Columns.Add("EndTime");
            dt.Columns.Add("FreedTime");
            dt.Columns.Add("Duration");
            dt.Columns.Add("TerminationCause");
            dt.Columns.Add("TerminationSource_BEG");
            dt.Columns.Add("TerminationSource_END");
            dt.Columns.Add("Media_Originate");
            dt.Columns.Add("Media_Answer");
            dt.Columns.Add("Rtp_Rx");
            dt.Columns.Add("Rtp_Tx");
            dt.Columns.Add("T38_Rx");
            dt.Columns.Add("T38_Tx");
            dt.Columns.Add("Error_FromNetwork");
            dt.Columns.Add("Error_ToNetwork");
            dt.Columns.Add("MOS");
            dt.Columns.Add("NetworkQuality");
            dt.Columns.Add("Datetime1");
            dt.Columns.Add("Datetime2");
            dt.Columns.Add("Datetime3");
            dt.Columns.Add("Datetime4");
            dt.Columns.Add("lrn");
            dt.Columns.Add("__weight");
            #endregion

            #region get datatable
            int iCount = 0;

            using (StreamReader sr = new StreamReader(SourceFileName))
            {
                String line;
                while ((line = sr.ReadLine()) != null)
                {
                    #region
                    if (line != "")
                    {
                        string[] cdr_list = line.Split(cDelimite);

                        if (cdr_list.Length == 1)
                        {
                            continue;
                        }

                        DataRow dr = dt.NewRow();
                        iCount++;
                        //only test 
                        //if (iCount > 5)
                        //    return false;
                        dr["StatusType"] = cdr_list[1];//BEG or END
                        string[] dd = cdr_list[0].Split('.');
                        string datetime = dd[0];
                        string lid = "";
                        string nap = "";
                        string media = "";
                        string terminationSource = "";
                        foreach (string field in cdr_list)
                        {
                            #region
                            String sField = field.Replace("\n", "").Trim();
                            string[] value = field.Split('=');
                            if (value.Length == 1)
                            {
                                continue;
                            }
                            string sName = "";
                            sName = "SessionId"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "StartTime"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "ConnectedTime"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "Calling"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "Called"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "NAP"; if ((value[0]) == sName) nap = value[1].Replace("'", "");
                            sName = "Direction"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "EndTime"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "FreedTime"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "Duration"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");
                            sName = "TerminationCause"; if ((value[0]) == sName) dr[sName] = value[1].Replace("'", "");

                            sName = "LegId";
                            if ((value[0]) == sName)
                                lid = value[1].Replace("'", "");

                            sName = "TerminationSource";
                            if ((value[0]) == sName)
                                terminationSource = value[1].Replace("'", "");

                            sName = "Media";
                            if ((value[0]) == sName)
                                media = value[1].Replace("'", "");
                            #endregion
                        }

                        if (dr["StatusType"].ToString() == "BEG")
                        {
                            dr["TerminationSource_BEG"] = terminationSource;
                            if (dr["Direction"].ToString() == "originate")
                            {
                                dr["Datetime1"] = datetime;
                            }
                            else if (dr["Direction"].ToString() == "answer")
                            {
                                dr["Datetime2"] = datetime;
                            }
                        }
                        else if (dr["StatusType"].ToString() == "END")
                        {
                            dr["TerminationSource_END"] = terminationSource;
                            if (dr["Direction"].ToString() == "originate")
                            {
                                dr["Datetime3"] = datetime;
                            }
                            else if (dr["Direction"].ToString() == "answer")
                            {
                                dr["Datetime4"] = datetime;
                            }
                        }

                        if (dr["Direction"].ToString() == "originate")
                        {
                            dr["LegId_Originate"] = lid;
                            dr["NAP_Originate"] = nap;
                            dr["Media_Originate"] = media;

                        }
                        else if (dr["Direction"].ToString() == "answer")
                        {
                            dr["LegId_Answer"] = lid;
                            dr["NAP_Answer"] = nap;
                            dr["Media_Answer"] = media;
                        }
                        //add to list, list will remove double cdrs
                        #region lrn
                        dr["lrn"] = dr["Calling"].ToString();
                        if (serverConfig.bLrn)
                        {
                            //col4 calling number
                            string calling =getNumber(dr["Calling"].ToString());
                            mycmd.CommandText = "call lrn.freelrn('" + calling + "')";

                            string lrn = dr["Calling"].ToString();
                            try
                            {
                                lrn = mycmd.ExecuteScalar().ToString();
                                //SetLog("get " + dr["col4"].ToString() + "'s lrn :" + lrn);
                                dr["lrn"] = lrn;
                            }
                            catch (Exception e)
                            {
                                SetLog("get lrn error:" + e.ToString());
                                //SetLog("sql:" + mycmd.CommandText);
                            }

                        }
                        #endregion
                        addCallLog(dr,cmd,serverConfig);
                        //add_list(dr);
                        //dt.Rows.Add(dr);
                    }
                    #endregion
                }
                sr.Close();
            }

            #endregion
            #region write to temp table
            try
            {
                //write to log
                strSql = "update imported_Log set imported_Log.EndImportTime=getdate()"
                            + ",imported_Log.SucessFlag='1'"
                            + ",imported_Log.Calls= " + iCount.ToString()
                            + " from imported_Log "
                            + " where imported_Log.ID='" + m_TempLogID + "'"
                            ;
                cmd.CommandText = strSql;
                cmd.ExecuteNonQuery();
            }

            catch (Exception eee)
            {
                SetLog(eee.ToString());
            }
            #endregion

            #region add to tb_import table
            foreach (string sTableName in imported_month_table_list)
            {
                strSql = "if not exists(  " +
                    " SELECT 1 FROM radius..tb_import WHERE tb_name = '" + sTableName + "'  " +
                    " )  " +
                    " insert into radius..tb_import (tb_name) values ('" + sTableName + "')  " +
                    " else  " +
                    " update radius..tb_import set status=null  WHERE tb_name = '" + sTableName + "'    " +
                    "  "
                    ;
                cmd.CommandText = strSql;
                cmd.ExecuteNonQuery();
            }
            #endregion
            conn.Close();
            return bSuccess;
        }
        private string getNumber(string sNumber)
        {
            if (sNumber.Length <= 10)
                return sNumber;
            else
            {
                return sNumber.Substring(sNumber.Length - 10, 10);
            }
        }
        #region
        private string getMonthTableName(DataRow dr)
        {
            //输出：cdr_import_data_202211
            //取开始时间
            string tableName = "cdr_import_data_";
            DateTime dtStart = TimeZone.CurrentTimeZone.ToLocalTime(new DateTime(1970, 1, 1));
            long lTime = long.Parse(dr["StartTime"].ToString() + "0000000");
            TimeSpan toNow = new TimeSpan(lTime);
            tableName += dtStart.Add(toNow).ToString("yyyyMM");
            return tableName;
        }
        private void createMonthTable(string tableName, SqlCommand cmd)
        {
            if (month_table_list.IndexOf(tableName) < 0)
            {
                //create table
                string sSql = "if not exists(select * from dbo.sysobjects where id=object_id(N'[dbo].["+tableName+"]') "
                    + " and OBJECTPROPERTY(id,N'IsUserTable')=1) "
                    + " CREATE TABLE [dbo].["+tableName+"]  ( "
                    + " 	[id] [bigint] IDENTITY(1,1) NOT NULL, "
                    + " 	[SessionId] [varchar](50) NULL, "
                    + " 	[LegId_Originate] [varchar](50) NULL, "
                    + " 	[LegId_Answer] [varchar](50) NULL, "
                    + " 	[StartTime] [datetime] NULL, "
                    + " 	[ConnectedTime] [datetime] NULL, "
                    + " 	[Calling] [varchar](50) NULL, "
                    + " 	[Called] [varchar](50) NULL, "
                    + " 	[NAP_Originate] [varchar](50) NULL, "
                    + " 	[NAP_Answer] [varchar](50) NULL, "
                    + " 	[Protocol] [varchar](50) NULL, "
                    + " 	[Direction] [varchar](50) NULL, "
                    + " 	[EndTime] [datetime] NULL, "
                    + " 	[FreedTime] [datetime] NULL, "
                    + " 	[TerminationCause] [varchar](50) NULL, "
                    + " 	[TerminationSource_BEG] [varchar](50) NULL, "
                    + " 	[TerminationSource_END] [varchar](50) NULL, "
                    + " 	[Media_Originate] [varchar](50) NULL, "
                    + " 	[Media_Answer] [varchar](50) NULL, "
                    + " 	[Rtp_Rx] [varchar](50) NULL, "
                    + " 	[Rtp_Tx] [varchar](50) NULL, "
                    + " 	[T38_Rx] [varchar](50) NULL, "
                    + " 	[T38_Tx] [varchar](50) NULL, "
                    + " 	[Error_FromNetwork] [varchar](50) NULL, "
                    + " 	[Error_ToNetwork] [varchar](50) NULL, "
                    + " 	[MOS] [varchar](50) NULL, "
                    + " 	[NetworkQuality] [varchar](50) NULL, "
                    + " 	[Duration] [int] NULL, "
                    + " 	[Datetime1] [datetime] NULL, "
                    + " 	[Datetime2] [datetime] NULL, "
                    + " 	[Datetime3] [datetime] NULL, "
                    + " 	[Datetime4] [datetime] NULL, "
                    + " 	[ServerName] [varchar](20) NULL, "
                    + " 	[status] [int] NULL, "
                    + " 	[lrn] [varchar](50) NULL, "
                    + "  CONSTRAINT [PK_"+tableName+"] PRIMARY KEY NONCLUSTERED  "
                    + " ( "
                    + " 	[id] ASC "
                    + " ) "
                    + " ) ON [PRIMARY] "
                    ;
                cmd.CommandText = sSql;
                cmd.ExecuteNonQuery();
                //create index
                sSql = "if not exists( "
                    + " SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('"+tableName+"', N'U')  "
                    + " and NAME='index_sessionid_"+tableName+"' "
                    + " ) "
                    + " CREATE NONCLUSTERED INDEX index_sessionid_"+tableName+" ON [dbo].["+tableName+"] "
                    + " ( "
                    + " 	[SessionId] ASC "
                    + " ) ON [PRIMARY] "
                    + " "
                    ;
                cmd.CommandText = sSql;
                cmd.ExecuteNonQuery();

                sSql = "if not exists( "
                    + " SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('" + tableName + "', N'U')  "
                    + " and NAME='index_starttime_" + tableName + "' "
                    + " ) "
                    + " CREATE NONCLUSTERED INDEX index_starttime_" + tableName + " ON [dbo].[" + tableName + "] "
                    + " ( "
                    + " 	[StartTime] DESC "
                    + " ) ON [PRIMARY] "
                    + " "
                    ;
                cmd.CommandText = sSql;
                cmd.ExecuteNonQuery();

                sSql = "if not exists( "
                                 + " SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('" + tableName + "', N'U')  "
                                 + " and NAME='index_nap_o_" + tableName + "' "
                                 + " ) "
                                 + " CREATE NONCLUSTERED INDEX index_nap_o_" + tableName + " ON [dbo].[" + tableName + "] "
                                 + " ( "
                                 + " 	[NAP_Originate] ASC "
                                 + " ) ON [PRIMARY] "
                                 + " "
                                 ;
                cmd.CommandText = sSql;
                cmd.ExecuteNonQuery();

                sSql = "if not exists( "
                                 + " SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('" + tableName + "', N'U')  "
                                 + " and NAME='index_nap_a_" + tableName + "' "
                                 + " ) "
                                 + " CREATE NONCLUSTERED INDEX index_nap_a_" + tableName + " ON [dbo].[" + tableName + "] "
                                 + " ( "
                                 + " 	[NAP_Answer] ASC "
                                 + " ) ON [PRIMARY] "
                                 + " "
                                 ;
                cmd.CommandText = sSql;
                cmd.ExecuteNonQuery();
                
                month_table_list.Add(tableName);
            }
        }

        private void addCallLog(DataRow dr, SqlCommand cmd, ServerConfig serverConfig)
        {
            string sSql = "";
            string sMonthTableName = getMonthTableName(dr);
            if (imported_month_table_list.IndexOf(sMonthTableName) < 0)
            {
                imported_month_table_list.Add(sMonthTableName);
            }
            //create table if not exist
            createMonthTable(sMonthTableName,cmd);
            try
            {
                //get cdr from sql server
                bool bExist = false;
                sSql = "select count(*) from " + sMonthTableName + " where SessionId='" + dr["SessionId"] + "'";
                cmd.CommandText = sSql;
                bExist = cmd.ExecuteScalar().ToString() != "0";
                if (!bExist)
                {
                    //insert it if not exists
                    if (dr["StatusType"].ToString() == "BEG")
                    {
                        #region
                        if (dr["Direction"].ToString() == "answer")
                        {
                            string fieldlist = "[SessionId],lrn"
                              + ",[LegId_Answer],[StartTime],[ConnectedTime],[Calling],[Called]"
                              + ",[NAP_Answer],[Protocol],[Direction],[Datetime2],[ServerName]";

                            sSql = "insert into " + sMonthTableName + " (" + fieldlist + ") values("
                                + "'" + dr["SessionId"] + "'"
                                + ",'" + dr["lrn"] + "'"
                                + ",'" + dr["LegId_Answer"] + "'" + ",'" + getTime(dr["StartTime"].ToString()) + "'"
                                + ",'" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",'" + dr["Calling"] + "'" + ",'" + dr["Called"] + "'"
                                + ",'" + dr["NAP_Answer"] + "'" + ",'" + dr["Protocol"] + "'"
                                + ",'" + dr["Direction"] + "'" + ",'" + dr["Datetime2"] + "'"
                                + ",'" + serverConfig.sftp_server + "'" + ")"
          ;
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        else if (dr["Direction"].ToString() == "originate")
                        {
                            string fieldlist = "[SessionId],lrn"
                              + ",[LegId_Originate],[StartTime],[ConnectedTime],[Calling],[Called]"
                              + ",[NAP_Originate],[Protocol],[Direction],[Datetime1],[ServerName]";

                            sSql = "insert into " + sMonthTableName + " (" + fieldlist + ") values("
                                + "'" + dr["SessionId"] + "'"
                                + ",'" + dr["lrn"] + "'"
                                + ",'" + dr["LegId_Originate"] + "'" + ",'" + getTime(dr["StartTime"].ToString()) + "'"
                                + ",'" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",'" + dr["Calling"] + "'" + ",'" + dr["Called"] + "'"
                                + ",'" + dr["NAP_Originate"] + "'" + ",'" + dr["Protocol"] + "'"
                                + ",'" + dr["Direction"] + "'" + ",'" + dr["Datetime1"] + "'"
                                + ",'" + serverConfig.sftp_server + "'" + ")"
          ;
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        #endregion
                    }
                    else if (dr["StatusType"].ToString() == "END")
                    {
                        #region
                        if (dr["Direction"].ToString() == "answer")
                        {
                            string fieldlist = "[SessionId],lrn"
                              + ",[LegId_Answer],[StartTime],[ConnectedTime],[Calling],[Called]"
                              + ",[NAP_Answer],[Direction],[EndTime],[FreedTime],[TerminationCause]"
                              + ",[TerminationSource_BEG] ,[TerminationSource_END],[Media_Originate],[Media_Answer],[Rtp_Rx]"
                              + ",[Rtp_Tx],[T38_Rx],[T38_Tx],[Error_FromNetwork],[Error_ToNetwork],[MOS],[NetworkQuality]"
                              + ",[Duration],[Datetime4],[ServerName]";

                            sSql = "insert into " + sMonthTableName + " (" + fieldlist + ") values("
                                + "'" + dr["SessionId"] + "'"
                                + ",'" + dr["lrn"] + "'"
                                + ",'" + dr["LegId_Answer"] + "'" + ",'" + getTime(dr["StartTime"].ToString()) + "'"
                                + ",'" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",'" + dr["Calling"] + "'" + ",'" + dr["Called"] + "'"
                                + ",'" + dr["NAP_Answer"] + "'"
                                + ",'" + dr["Direction"] + "'"
                                + ",'" + getTime(dr["EndTime"].ToString()) + "'" + ",'" + getTime(dr["FreedTime"].ToString()) + "'"
                                + ",'" + dr["TerminationCause"] + "'" + ",'" + dr["TerminationSource_BEG"] + "'" + ",'" + dr["TerminationSource_END"] + "'"
                                + ",'" + dr["Media_Originate"] + "'" + ",'" + dr["Media_Answer"] + "'" + ",'" + dr["Rtp_Rx"] + "'"
                                + ",'" + dr["Rtp_Tx"] + "'" + ",'" + dr["T38_Rx"] + "'" + ",'" + dr["T38_Tx"] + "'"
                                + ",'" + dr["Error_FromNetwork"] + "'" + ",'" + dr["Error_ToNetwork"] + "'" + ",'" + dr["MOS"] + "'"
                                + ",'" + dr["NetworkQuality"] + "'" + ",'" + dr["Duration"] + "'" 
                                + ",'" + dr["Datetime4"] + "'"
                                + ",'" + serverConfig.sftp_server + "'" + ")"
          ;
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        else if (dr["Direction"].ToString() == "originate")
                        {
                            string fieldlist = "[SessionId],lrn"
                              + ",[LegId_Originate],[StartTime],[ConnectedTime],[Calling],[Called]"
                              + ",[NAP_Originate],[Direction],[EndTime],[FreedTime],[TerminationCause]"
                              + ",[TerminationSource_BEG] ,[TerminationSource_END],[Media_Originate],[Media_Answer],[Rtp_Rx]"
                              + ",[Rtp_Tx],[T38_Rx],[T38_Tx],[Error_FromNetwork],[Error_ToNetwork],[MOS],[NetworkQuality]"
                              + ",[Duration],[Datetime3],[ServerName]";

                            sSql = "insert into " + sMonthTableName + " (" + fieldlist + ") values("
                                + "'" + dr["SessionId"] + "'"
                                + ",'" + dr["lrn"] + "'"
                                + ",'" + dr["LegId_Originate"] + "'" + ",'" + getTime(dr["StartTime"].ToString()) + "'"
                                + ",'" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",'" + dr["Calling"] + "'" + ",'" + dr["Called"] + "'"
                                + ",'" + dr["NAP_Originate"] + "'"
                                + ",'" + dr["Direction"] + "'"
                                + ",'" + getTime(dr["EndTime"].ToString()) + "'" + ",'" + getTime(dr["FreedTime"].ToString()) + "'"
                                + ",'" + dr["TerminationCause"] + "'" + ",'" + dr["TerminationSource_BEG"] + "'" + ",'" + dr["TerminationSource_END"] + "'"
                                + ",'" + dr["Media_Originate"] + "'" + ",'" + dr["Media_Answer"] + "'" + ",'" + dr["Rtp_Rx"] + "'"
                                + ",'" + dr["Rtp_Tx"] + "'" + ",'" + dr["T38_Rx"] + "'" + ",'" + dr["T38_Tx"] + "'"
                                + ",'" + dr["Error_FromNetwork"] + "'" + ",'" + dr["Error_ToNetwork"] + "'" + ",'" + dr["MOS"] + "'"
                                + ",'" + dr["NetworkQuality"] + "'" + ",'" + dr["Duration"] + "'" 
                                + ",'" + dr["Datetime3"] + "'"
                                + ",'" + serverConfig.sftp_server + "'" + ")"
          ;
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        #endregion
                    }

                }
                else
                {
                    //update if exists
                    if (dr["StatusType"].ToString() == "BEG")
                    {
                        #region
                        if (dr["Direction"].ToString() == "answer")
                        {
                            if (dr["Duration"].ToString() == "0")
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Answer =  '" + dr["LegId_Answer"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Answer='" + dr["NAP_Answer"] + "'" + ",Calling='" + dr["Protocol"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + ",'" + ",Datetime2='" + dr["Datetime2"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null "
                                    + " where SessionId='" + dr["SessionId"] + "'"
                                    + " and isnull(Duration,0)=0 "
                                    ;
                            }
                            else
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Answer =  '" + dr["LegId_Answer"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Answer='" + dr["NAP_Answer"] + "'" + ",Calling='" + dr["Protocol"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + ",'" + ",Datetime2='" + dr["Datetime2"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null "
                                    + " where SessionId='" + dr["SessionId"] + "'"
                                    ;
                            }
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        else if (dr["Direction"].ToString() == "originate")
                        {

                            if (dr["Duration"].ToString() == "0")
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Originate =  '" + dr["LegId_Originate"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Originate='" + dr["NAP_Originate"] + "'" + ",Calling='" + dr["Protocol"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + "," + ",Datetime1='" + dr["Datetime1"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                    + " where SessionId='" + dr["SessionId"] + "' "
                                    + " and isnull(Duration,0)=0 "
                                    ;
                            }
                            else
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Originate =  '" + dr["LegId_Originate"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Originate='" + dr["NAP_Originate"] + "'" + ",Calling='" + dr["Protocol"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + "," + ",Datetime1='" + dr["Datetime1"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                    + " where SessionId='" + dr["SessionId"] + "' "
                                    ;
                            }
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        #endregion
                    }
                    else if (dr["StatusType"].ToString() == "END")
                    {
                        #region
                        if (dr["Direction"].ToString() == "answer")
                        {
                            if (dr["Duration"].ToString() == "0")
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Answer =  '" + dr["LegId_Answer"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Answer='" + dr["NAP_Answer"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + ",EndTime='" + getTime(dr["EndTime"].ToString())
                                    + "'" + ",FreedTime='" + getTime(dr["FreedTime"].ToString()) + "'"
                                    + ",TerminationCause='" + dr["TerminationCause"] + "'" + ",TerminationSource_BEG='" + dr["TerminationSource_BEG"]
                                    + "'" + ",TerminationSource_END='" + dr["TerminationSource_END"] + "'"
                                    + ",Media_Originate='" + dr["Media_Originate"] + "'" + ",Media_Answer='" + dr["Media_Answer"] + "'"
                                    + ",Rtp_Rx='" + dr["Rtp_Rx"] + "'" + ",Rtp_Tx='" + dr["Rtp_Tx"] + "'" + ",T38_Rx='" + dr["T38_Rx"] + "'"
                                    + ",T38_Tx='" + dr["T38_Tx"] + "'"
                                    + ",Error_FromNetwork='" + dr["Error_FromNetwork"] + "'" + ",Error_ToNetwork='" + dr["Error_ToNetwork"] + "'"
                                    + ",MOS='" + dr["MOS"] + "'" + ",NetworkQuality='" + dr["NetworkQuality"] + "'" + ",Duration='" + dr["Duration"] + "'"
                                    + ",Datetime4='" + dr["Datetime4"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                    + " where SessionId='" + dr["SessionId"] + "' "
                                    + " and isnull(Duration,0)=0 "
                                    ;
                            }
                            else
                            {
                                sSql = "update " + sMonthTableName + " set "
                                     + " LegId_Answer =  '" + dr["LegId_Answer"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                     + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                     + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                     + ",NAP_Answer='" + dr["NAP_Answer"] + "'"
                                     + ",Direction='" + dr["Direction"] + "'" + ",EndTime='" + getTime(dr["EndTime"].ToString())
                                     + "'" + ",FreedTime='" + getTime(dr["FreedTime"].ToString()) + "'"
                                     + ",TerminationCause='" + dr["TerminationCause"] + "'" + ",TerminationSource_BEG='" + dr["TerminationSource_BEG"]
                                     + "'" + ",TerminationSource_END='" + dr["TerminationSource_END"] + "'"
                                     + ",Media_Originate='" + dr["Media_Originate"] + "'" + ",Media_Answer='" + dr["Media_Answer"] + "'"
                                     + ",Rtp_Rx='" + dr["Rtp_Rx"] + "'" + ",Rtp_Tx='" + dr["Rtp_Tx"] + "'" + ",T38_Rx='" + dr["T38_Rx"] + "'"
                                     + ",T38_Tx='" + dr["T38_Tx"] + "'"
                                     + ",Error_FromNetwork='" + dr["Error_FromNetwork"] + "'" + ",Error_ToNetwork='" + dr["Error_ToNetwork"] + "'"
                                     + ",MOS='" + dr["MOS"] + "'" + ",NetworkQuality='" + dr["NetworkQuality"] + "'" + ",Duration='" + dr["Duration"] + "'"
                                     + ",Datetime4='" + dr["Datetime4"] + "'"
                                     + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                     + " where SessionId='" + dr["SessionId"] + "' "
                                     ;
                            }
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        else if (dr["Direction"].ToString() == "originate")
                        {
                            if (dr["Duration"].ToString() == "0")
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Originate =  '" + dr["LegId_Originate"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Originate='" + dr["NAP_Originate"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + ",EndTime='" + getTime(dr["EndTime"].ToString())
                                    + "'" + ",FreedTime='" + getTime(dr["FreedTime"].ToString()) + "'"
                                    + ",TerminationCause='" + dr["TerminationCause"] + "'" + ",TerminationSource_BEG='" + dr["TerminationSource_BEG"]
                                    + "'" + ",TerminationSource_END='" + dr["TerminationSource_END"] + "'"
                                    + ",Media_Originate='" + dr["Media_Originate"] + "'" + ",Media_Answer='" + dr["Media_Answer"] + "'"
                                    + ",Rtp_Rx='" + dr["Rtp_Rx"] + "'" + ",Rtp_Tx='" + dr["Rtp_Tx"] + "'" + ",T38_Rx='" + dr["T38_Rx"] + "'"
                                    + ",T38_Tx='" + dr["T38_Tx"] + "'"
                                    + ",Error_FromNetwork='" + dr["Error_FromNetwork"] + "'" + ",Error_ToNetwork='" + dr["Error_ToNetwork"] + "'"
                                    + ",MOS='" + dr["MOS"] + "'" + ",NetworkQuality='" + dr["NetworkQuality"] + "'" + ",Duration='" + dr["Duration"] + "'"
                                    + ",Datetime3='" + dr["Datetime3"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                    + " where SessionId='" + dr["SessionId"] + "' "
                                    + " and isnull(Duration,0)=0 "
                                    ;
                            }
                            else
                            {
                                sSql = "update " + sMonthTableName + " set "
                                    + " LegId_Originate =  '" + dr["LegId_Originate"] + "'" + ",StartTime='" + getTime(dr["StartTime"].ToString()) + "'"
                                    + ",ConnectedTime='" + getTime(dr["ConnectedTime"].ToString()) + "'" + ",Calling='" + dr["Calling"] + "'"
                                    + ",Called='" + dr["Called"] + "'"
                                    + ",lrn='" + dr["lrn"] + "'"
                                    + ",NAP_Originate='" + dr["NAP_Originate"] + "'"
                                    + ",Direction='" + dr["Direction"] + "'" + ",EndTime='" + getTime(dr["EndTime"].ToString())
                                    + "'" + ",FreedTime='" + getTime(dr["FreedTime"].ToString()) + "'"
                                    + ",TerminationCause='" + dr["TerminationCause"] + "'" + ",TerminationSource_BEG='" + dr["TerminationSource_BEG"]
                                    + "'" + ",TerminationSource_END='" + dr["TerminationSource_END"] + "'"
                                    + ",Media_Originate='" + dr["Media_Originate"] + "'" + ",Media_Answer='" + dr["Media_Answer"] + "'"
                                    + ",Rtp_Rx='" + dr["Rtp_Rx"] + "'" + ",Rtp_Tx='" + dr["Rtp_Tx"] + "'" + ",T38_Rx='" + dr["T38_Rx"] + "'"
                                    + ",T38_Tx='" + dr["T38_Tx"] + "'"
                                    + ",Error_FromNetwork='" + dr["Error_FromNetwork"] + "'" + ",Error_ToNetwork='" + dr["Error_ToNetwork"] + "'"
                                    + ",MOS='" + dr["MOS"] + "'" + ",NetworkQuality='" + dr["NetworkQuality"] + "'" + ",Duration='" + dr["Duration"] + "'"
                                    + ",Datetime3='" + dr["Datetime3"] + "'"
                                    + ",ServerName='" + serverConfig.sftp_server + "',status = null"
                                    + " where SessionId='" + dr["SessionId"] + "' "
                                    ;
                            }
                            cmd.CommandText = sSql;
                            cmd.ExecuteNonQuery();
                        }
                        #endregion
                    }
                }
            }
            catch (Exception ex)
            {
                SetLog(ex.ToString());
                SetLog("sql:"+sSql);
            } 
        }
        //private void add_list(DataRow dr)'
        //{
        //    bool bUpdate = false;
        //    for (int ii = 0; ii < dt.Rows.Count;ii++ )
        //        {
        //            if (dt.Rows[ii]["SessionId"].ToString() == dr["SessionId"].ToString())
        //            {
        //                dt.Rows[ii].BeginEdit();
        //                if (dr["Duration"] != null)
        //                {
        //                    dt.Rows[ii]["Duration"] = dr["Duration"];
        //                }
        //                if (dr["StatusType"].ToString() == "BEG")
        //                {
        //                    dt.Rows[ii]["TerminationSource_BEG"] = dr["TerminationSource_BEG"];
        //                    if (dr["Direction"].ToString() == "originate")
        //                    {
        //                        dt.Rows[ii]["Datetime1"] = dr["Datetime1"];
        //                    }
        //                    else if (dr["Direction"].ToString() == "answer")
        //                    {
        //                        dt.Rows[ii]["Datetime2"] = dr["Datetime2"];
        //                    }
        //                }
        //                else if (dr["StatusType"].ToString() == "END")
        //                {
        //                    dt.Rows[ii]["TerminationSource_END"] = dr["TerminationSource_END"];
        //                    if (dr["Direction"].ToString() == "originate")
        //                    {
        //                        dt.Rows[ii]["Datetime3"] = dr["Datetime3"];
        //                    }
        //                    else if (dr["Direction"].ToString() == "answer")
        //                    {
        //                        dt.Rows[ii]["Datetime4"] = dr["Datetime4"];
        //                    }
        //                }
        //                if (dr["Direction"].ToString() == "originate")
        //                {
        //                    dt.Rows[ii]["LegId_Originate"] = dr["LegId_Originate"];
        //                    dt.Rows[ii]["NAP_Originate"] = dr["NAP_Originate"];
        //                    dt.Rows[ii]["Media_Originate"] = dr["Media_Originate"];

        //                }
        //                else if (dr["Direction"].ToString() == "answer")
        //                {
        //                    dt.Rows[ii]["LegId_Answer"] = dr["LegId_Answer"];
        //                    dt.Rows[ii]["NAP_Answer"] = dr["NAP_Answer"];
        //                    dt.Rows[ii]["Media_Answer"] = dr["Media_Answer"];
        //                }
        //                dt.Rows[ii].EndEdit();
        //                bUpdate = true;
        //                break;
        //            }
        //        }

        //    if (!bUpdate)
        //    {
        //        dt.Rows.Add(dr);
        //    }
        //}
        #endregion
        /// <summary>
        /// 判断文件是否可以导入
        /// 1.根据文件的最后修改时间是否和数据库里面保存的该文件的最后修改时间一致，不一致则说明该文件可以导入
        /// 2.因为以前导入文件没有FileTime字段，所以要排除FileTime为NULL的记录
        /// </summary>
        /// <param name="finfo"></param>
        /// <returns></returns>
        private bool CheckImportFile(FileInfo finfo,ServerConfig serverConfig)
        {
            #region
            //like cdr1.txt.20090206233101
            if (wrongFilename(finfo.Name))
                return  false;

            string strTemDayTableName = "";
            string strTemp = "";
            if (finfo.Name.Substring(0, finfo.Name.LastIndexOf(".")).Length >= 8)
            {
                strTemDayTableName = finfo.Name.Substring(9, 8);
                try
                {
                    strTemp = strTemDayTableName.Substring(0, 4) + "-"
                        + strTemDayTableName.Substring(4, 2) + "-"
                        + strTemDayTableName.Substring(6, 2);
                    DateTime.Parse(strTemp);
                }
                catch
                {
                    strTemDayTableName = "";
                }
            }
            if (strTemDayTableName == "")
                return false;
            else
            {
                //m_TemDayTableName = "D"+strTemDayTableName;
                //m_MonthTableName = "M" + strTemDayTableName.Substring(0, 6);
            }

            //if ( DateTime.Parse(strTemp) < DateTime.Parse("2012-04-30"))
            //    return false;
            if (DateTime.Parse(strTemp) < DateTime.Parse(serverConfig.sftp_startdate))
                return false;

            SqlConnection conn = new SqlConnection(serverConfig.DBConn);

            string strLastFileTime = "";
            string strSql = "select FileTime from CDR_Nextone_Log"
                + " where FileName='" + finfo.FullName + "'"
                + " and SucessFlag=1"
                + " order by FileTime desc";

            conn.Open();
            SqlCommand  cmd = new SqlCommand(strSql, conn);
            DataSet ds = new DataSet();
            SqlDataAdapter da = new SqlDataAdapter();
            da.SelectCommand = cmd;
            da.Fill(ds);
            conn.Close();

            if (ds.Tables[0].Rows.Count == 0)
                return true;

            if (ds.Tables[0].Rows.Count > 0 && ds.Tables[0].Rows[0]["FileTime"].ToString() != "")
                strLastFileTime = ds.Tables[0].Rows[0]["FileTime"].ToString();

            if (strLastFileTime != "" && DateTime.Parse(strLastFileTime) < DateTime.Parse(finfo.LastWriteTime.ToString()))
                return true;
            else
                return false;
            #endregion
        }

        public static string getValue(object obj, string default_str)
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
        #endregion
    }
}
