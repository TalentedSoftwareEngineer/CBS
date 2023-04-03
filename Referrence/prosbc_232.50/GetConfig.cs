using System;
using System.Collections.Generic;
using System.Text;
using System.Xml;


namespace ProsbcService
{
    public class ServerConfig
    {
        public string DBConn;
        public string ImportPath;
        public string ServerName;//database name
        public string UserName;
        public string Password;
        public string DatabaseName;
        public string DefineCols;
        public string sftp_user;
        public string sftp_password;
        public string sftp_server;
        public string sftp_path;
        public string sftp_startdate;
        public int sftp_port = 1954;//22
        public bool bActive;
        public bool bRate, bLrn;
        public string LNPServer;
        public string sftp_publickey;
    }

    public class GetConfig
    {
        public List<ServerConfig> serverConfigs;
        public string AutoInterval;
        public string CDRSConn;

        public GetConfig()
        {
            serverConfigs = new List<ServerConfig>();
            string strConfigFilePath = AppDomain.CurrentDomain.SetupInformation.ApplicationBase + "Config.xml";
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.Load(strConfigFilePath);
            #region
            AutoInterval = xmlDoc.DocumentElement.ChildNodes[0].ChildNodes[0].InnerText; //seconds
            try
            {
                int.Parse(AutoInterval);
            }
            catch
            {
                AutoInterval = "120";
            }
            CDRSConn = xmlDoc.DocumentElement.ChildNodes[0].ChildNodes[1].InnerText;
            #endregion

            for (int ii = 1; ii < xmlDoc.DocumentElement.ChildNodes.Count; ii++)
            {
                ServerConfig serverConfig = new ServerConfig();
                serverConfig.DBConn = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[0].InnerText;
                serverConfig.ImportPath = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[1].InnerText;
                serverConfig.ServerName = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[2].InnerText;
                serverConfig.UserName = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[3].InnerText;
                serverConfig.Password = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[4].InnerText;
                serverConfig.DatabaseName = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[5].InnerText;
                serverConfig.DefineCols = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[6].InnerText;
                serverConfig.sftp_user = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[7].InnerText;
                serverConfig.sftp_password = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[8].InnerText;
                serverConfig.sftp_server = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[9].InnerText;
                serverConfig.sftp_path = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[10].InnerText;
                serverConfig.sftp_startdate = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[11].InnerText;

                try
                {
                    serverConfig.bActive = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[12].InnerText=="1";
                }
                catch
                {
                    serverConfig.bActive = true;
                }
                try
                {
                    serverConfig.bRate = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[13].InnerText == "1";
                }
                catch
                {
                    serverConfig.bRate = true;
                }
                try
                {
                    serverConfig.bLrn = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[14].InnerText == "1";
                }
                catch
                {
                    serverConfig.bLrn = false;
                }
                try
                {
                    serverConfig.LNPServer = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[15].InnerText;
                }
                catch
                {
                    serverConfig.LNPServer = "";
                }
                serverConfig.sftp_port = int.Parse(xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[16].InnerText);
                serverConfig.sftp_publickey = xmlDoc.DocumentElement.ChildNodes[ii].ChildNodes[17].InnerText;

                serverConfigs.Add(serverConfig);
            }

        }
    }
}




//<?xml version="1.0" encoding="utf-8" ?>
//<config>
//<commom>
//    <AutoInterval>15</AutoInterval>
//    <CDRSConn>data source=zouxu;database=entice;uid=sa;password=s1p0rd3r</CDRSConn>
//</common>
//<entice>
//    <DBConn>data source=zouxu;database=entice;uid=sa;password=s1p0rd3r</DBConn>
//    <ImportPath>e:\entice</ImportPath>
//    <ServerName>zouxu</ServerName>
//    <UserName>sa</UserName>
//    <Password>s1p0rd3r</Password>
//    <DatabaseName>entice</DatabaseName>
//    <DefineCols>col1,0,1,char(1).col2,1,64,varchar(64).col3,65,64,varchar(64).col4,129,32,varchar(32).col5,161,3,varchar(3).col6,164,32,varchar(32).col7,196,3,varchar(3).col8,199,32,varchar(32).col9,231,3,varchar(3).col10,234,32,varchar(32).col11,266,3,varchar(3).col12,269,1,varchar(1).col13,270,32,varchar(32).col14,302,8,varchar(8).col15,310,6,varchar(6).col16,316,6,varchar(6).col17,322,6,varchar(6).col18,328,6,varchar(6).col19,334,1,varchar(1).col20,335,10,varchar(10).col21,345,10,varchar(10).col22,355,10,varchar(10).col23,365,10,varchar(10).col24,375,10,varchar(10).col25,385,3,varchar(3).col26,388,4,varchar(4).col27,392,4,varchar(4).col28,396,10,varchar(10).col29,406,10,varchar(10).col30,416,10,varchar(10).col31,426,2,varchar(2).col32,428,15,varchar(15).col33,443,15,varchar(15).col34,458,6,varchar(6).col35,464,6,varchar(6).col36,470,15,varchar(15).col37,485,6,varchar(6).col38,491,6,varchar(6).col39,497,10,varchar(10).col40,507,10,varchar(10).col41,517,10,varchar(10).col42,527,10,varchar(10).col43,537,10,varchar(10).col44,547,2,varchar(2).col45,549,3,varchar(3).col46,552,3,varchar(3).col47,555,4,varchar(4).col48,559,6,varchar(6).col49,565,24,varchar(24)</DefineCols>
//    <sftp_user></sftp_user>
//    <sftp_password></sftp_password>
//    <sftp_server></sftp_server>
//    <sftp_path></sftp_path>
//    <sftp_startdate></sftp_startdate>
//    <active>1</active>
//    <rate>1</rate>
//</entice>
//<entice2>
//    <DBConn>data source=zouxu;database=entice;uid=sa;password=s1p0rd3r</DBConn>
//    <ImportPath>e:\entice</ImportPath>
//    <ServerName>zouxu</ServerName>
//    <UserName>sa</UserName>
//    <Password>s1p0rd3r</Password>
//    <DatabaseName>entice</DatabaseName>
//    <DefineCols>col1,0,1,char(1).col2,1,64,varchar(64).col3,65,64,varchar(64).col4,129,32,varchar(32).col5,161,3,varchar(3).col6,164,32,varchar(32).col7,196,3,varchar(3).col8,199,32,varchar(32).col9,231,3,varchar(3).col10,234,32,varchar(32).col11,266,3,varchar(3).col12,269,1,varchar(1).col13,270,32,varchar(32).col14,302,8,varchar(8).col15,310,6,varchar(6).col16,316,6,varchar(6).col17,322,6,varchar(6).col18,328,6,varchar(6).col19,334,1,varchar(1).col20,335,10,varchar(10).col21,345,10,varchar(10).col22,355,10,varchar(10).col23,365,10,varchar(10).col24,375,10,varchar(10).col25,385,3,varchar(3).col26,388,4,varchar(4).col27,392,4,varchar(4).col28,396,10,varchar(10).col29,406,10,varchar(10).col30,416,10,varchar(10).col31,426,2,varchar(2).col32,428,15,varchar(15).col33,443,15,varchar(15).col34,458,6,varchar(6).col35,464,6,varchar(6).col36,470,15,varchar(15).col37,485,6,varchar(6).col38,491,6,varchar(6).col39,497,10,varchar(10).col40,507,10,varchar(10).col41,517,10,varchar(10).col42,527,10,varchar(10).col43,537,10,varchar(10).col44,547,2,varchar(2).col45,549,3,varchar(3).col46,552,3,varchar(3).col47,555,4,varchar(4).col48,559,6,varchar(6).col49,565,24,varchar(24)</DefineCols>
//    <sftp_user></sftp_user>
//    <sftp_password></sftp_password>
//    <sftp_server></sftp_server>
//    <sftp_servername></sftp_servername>
//    <sftp_path></sftp_path>
//    <sftp_startdate></sftp_startdate>
//    <active>1</active>
//    <rate>1</rate>
//</entice2>
//</config>
