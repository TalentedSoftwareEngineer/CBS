-- MySQL dump 10.13  Distrib 8.0.32, for Linux (x86_64)
--
-- Host: localhost    Database: cbs
-- ------------------------------------------------------
-- Server version	8.0.32-0ubuntu0.20.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cdr_server`
--

DROP TABLE IF EXISTS `cdr_server`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cdr_server` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `port` int NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `public_key` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `path` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `is_rate` tinyint(1) NOT NULL DEFAULT '0',
  `is_lrn` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `table_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `lnp_server` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cdr_server`
--

LOCK TABLES `cdr_server` WRITE;
/*!40000 ALTER TABLE `cdr_server` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdr_server` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuration`
--

DROP TABLE IF EXISTS `configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuration` (
  `type` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `value` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuration`
--

LOCK TABLES `configuration` WRITE;
/*!40000 ALTER TABLE `configuration` DISABLE KEYS */;
INSERT INTO `configuration` VALUES ('cdr.home','/root/cbs/cdr'),('lerg.home','/root/cbs/lerg'),('system.banner',''),('system.logo','');
/*!40000 ALTER TABLE `configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credentials`
--

DROP TABLE IF EXISTS `credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credentials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` enum('USER','CUSTOMER') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `password` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `salt` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credentials`
--

LOCK TABLES `credentials` WRITE;
/*!40000 ALTER TABLE `credentials` DISABLE KEYS */;
INSERT INTO `credentials` VALUES (1,'sadmin','USER',1,'$2a$10$EKzlr5DHZntsNIRgIaAHEO/BsAibsJxnsAKeg/fcedI6KTMQ2XMfS','$2a$10$EKzlr5DHZntsNIRgIaAHEO',NULL,NULL,1,'2023-04-03 05:02:27');
/*!40000 ALTER TABLE `credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` enum('CUSTOMER','VENDOR') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `company_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `company_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','PENDING','TEMP ON HOLD') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `rate_type` enum('FIXED','INTER/INTRA') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `flat_rate` decimal(20,6) DEFAULT NULL,
  `default_rate` decimal(20,6) DEFAULT NULL,
  `init_duration` bigint DEFAULT NULL,
  `succ_duration` bigint DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'CUSTOMER','DIP','DIPVTEL LLC','Ricky','Keele','ricky@gmail.com',1,'ACTIVE','FIXED',0.008000,0.017500,6,6,NULL,1,'2023-02-26 18:24:29',1,'2023-04-20 13:20:47');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_billing`
--

DROP TABLE IF EXISTS `customer_billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_billing` (
  `id` bigint NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `method` enum('PREPAID','POSTPAID') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `cycle` int DEFAULT NULL,
  `start` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_billing`
--

LOCK TABLES `customer_billing` WRITE;
/*!40000 ALTER TABLE `customer_billing` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_billing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_info`
--

DROP TABLE IF EXISTS `customer_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_info` (
  `id` bigint NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `state` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `country` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `zip` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ssn` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_customer_info` FOREIGN KEY (`id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_info`
--

LOCK TABLES `customer_info` WRITE;
/*!40000 ALTER TABLE `customer_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_rate`
--

DROP TABLE IF EXISTS `customer_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_rate` (
  `id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `prefix` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `destination` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `inter_rate` decimal(20,6) NOT NULL DEFAULT '0.000000',
  `intra_rate` decimal(20,6) NOT NULL DEFAULT '0.000000',
  `init_duration` bigint NOT NULL DEFAULT '0',
  `succ_duration` bigint NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_customer_rate_customer` (`customer_id`),
  CONSTRAINT `FK_customer_rate_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_rate`
--

LOCK TABLES `customer_rate` WRITE;
/*!40000 ALTER TABLE `customer_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_rg`
--

DROP TABLE IF EXISTS `customer_rg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_rg` (
  `id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `rgid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `partition_id` bigint DEFAULT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `direction` enum('INBOUND','OUTBOUND') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `description` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ID_customer_rg_rgid` (`rgid`),
  KEY `ID_customer_rg_pid` (`partition_id`),
  KEY `FK_customer_rg_customer` (`customer_id`),
  CONSTRAINT `FK_customer_rg_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_rg`
--

LOCK TABLES `customer_rg` WRITE;
/*!40000 ALTER TABLE `customer_rg` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_rg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `privilege`
--

DROP TABLE IF EXISTS `privilege`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `privilege` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `category` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `is_single` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `privilege`
--

LOCK TABLES `privilege` WRITE;
/*!40000 ALTER TABLE `privilege` DISABLE KEYS */;
INSERT INTO `privilege` VALUES (1,'Read Logo Management','Administration',0),(2,'Write Logo Management','Administration',0),(3,'Read Banner Management','Administration',0),(4,'Write Banner Management','Administration',0),(5,'Read Lerg Management','Administration',0),(6,'Write Lerg Management','Administration',0),(7,'Read CDRS Import','Administration',0),(8,'Write CDRS Import','Administration',0),(9,'CDR Import History','Administration',1),(10,'CDR Log','Administration',1),(11,'Read LRN Management','Administration',0),(12,'Write LRN Management','Administration',0),(101,'Read Customers','Client Management',0),(102,'Write Customers','Client Management',0),(103,'Read Roles','Client Management',0),(104,'Write Roles','Client Management',0),(105,'Read Users','Client Management',0),(106,'Write Users','Client Management',0),(201,'Read Vendors','Vendor Management',0),(202,'Write Vendors','Vendor Management',0),(203,'Read Vendor Rates','Vendor Management',0),(204,'Write Vendor Rates','Vendor Management',0),(205,'Vendor Comparation','Vendor Management',1),(301,'Read Buy Numbers','Number Management',0),(302,'Write Buy Numbers','Number Management',0),(303,'Read Customer Numbers','Number Management',0),(304,'Write Customer Numbers','Number Management',0),(305,'Read TFN Numbers','Number Management',0),(306,'Write TFN Numbers','Number Management',0),(307,'Read DID Numbers','Number Management',0),(308,'Write DID Numbers','Number Management',0);
/*!40000 ALTER TABLE `privilege` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Super Admin','super admin roles',0,'2022-12-22 01:15:57',1,'2023-04-21 08:57:39'),(2,'COMPANY_ADMIN','default company admin',1,'2023-03-08 13:36:40',1,'2023-04-25 10:17:27'),(3,'COMPANY_USER','default company user role',1,'2023-03-27 13:34:46',1,'2023-04-25 10:17:54');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_privilege`
--

DROP TABLE IF EXISTS `role_privilege`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_privilege` (
  `id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `privilege_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_role_privilege_privilege` (`privilege_id`),
  KEY `FK_role_privilege_role` (`role_id`),
  CONSTRAINT `FK_role_privilege_privilege` FOREIGN KEY (`privilege_id`) REFERENCES `privilege` (`id`),
  CONSTRAINT `FK_role_privilege_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_privilege`
--

LOCK TABLES `role_privilege` WRITE;
/*!40000 ALTER TABLE `role_privilege` DISABLE KEYS */;
INSERT INTO `role_privilege` VALUES ('08bafd2e-c30f-4e9f-8064-705d73506ca7',1,101),('0a6693d3-e6b3-4e3f-b293-254df75aed8e',1,11),('17c8b77c-261c-4e69-820e-3f00f9f41658',1,9),('26c6de30-259d-459d-8550-03792500697f',1,2),('2a29361f-c76c-4b3e-b5d1-46e3f5dbabc7',1,203),('30fc165f-8d22-45aa-ac5f-6adf3e9da38e',1,306),('377b90d2-cf58-4383-a53f-474dad6e62cc',1,104),('3c103fb9-fdc7-4aba-94a3-f60932df1da5',1,12),('3d72d865-ddc9-4f09-921b-12f1b2bc251c',1,102),('4a624738-8397-4854-88ba-8e04cf6214d4',1,304),('4c11ca41-cc33-4796-90eb-042f2b09992f',1,8),('4f5d7cf4-e72a-471a-bc99-ddc6b23c82b9',1,6),('6339fa21-7a6e-4184-892a-75ebb3019e5e',1,7),('6bf332d5-3208-4b3f-819a-54b9be67b01e',1,303),('6e196ca6-5327-4d92-beee-6e1e97ad2f53',1,105),('6ff9a1dd-377a-481a-9160-24229bfc3ce7',1,1),('75ec8aee-ff50-4784-801c-6b44f4765d78',1,302),('7d415bb6-a626-45da-baf5-fca6bbb4aece',1,201),('804dbaed-a673-4a53-b49a-46450804dff4',1,106),('8fef00b5-1df1-46e3-95d2-696cc6e2a1b7',1,305),('994b33e1-b6b7-41c1-aaae-d1a915bf9aa8',1,301),('9d8f048d-cc61-4eff-b1bc-136715a325a5',1,3),('acab1317-057f-499f-8e90-71b60fad38d2',1,202),('b7679401-0a82-4bad-bb51-3d3a16e1690b',1,307),('cfd12587-783a-40f2-bc50-c4546db9c436',1,308),('de91b2a7-db7d-4ccc-92a2-b680ea72c6ea',1,4),('e1dd28e0-880e-4fa8-bf75-c74b8813a0f7',1,10),('e6d27d23-ef22-4a65-a249-1929bddb6fd8',1,5),('f3c25b70-8462-4e6c-9ae3-66ae3cdcd879',1,204),('fbeb0f90-9538-4617-8ac1-48a2ebd23fcd',1,103),('fe035af5-a755-4a06-b95d-e1cbae3c46fd',1,205);
/*!40000 ALTER TABLE `role_privilege` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tfn_number`
--

DROP TABLE IF EXISTS `tfn_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tfn_number` (
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tfn_num` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `trans_num` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resp_org` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,6) NOT NULL DEFAULT '0.000000',
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tfn_number`
--

LOCK TABLES `tfn_number` WRITE;
/*!40000 ALTER TABLE `tfn_number` DISABLE KEYS */;
/*!40000 ALTER TABLE `tfn_number` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `role_id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `ui_settings` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_user_role` (`role_id`),
  KEY `FK_user_customer` (`customer_id`),
  CONSTRAINT `FK_user_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  CONSTRAINT `FK_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'sadmin',1,1,'admin@admin.com','RICKY','Keele',1,'{\"colorScheme\":\"light\",\"customLogoImg\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAACyElEQVR4nO3dvWtTcRTG8efcpAGbKFIQEYpzoXSqBm0Gg1ScnRQUHB2CQ3WxoJLFl8UWLEEcheBk/wIDdrGC0i4aqLgWRKTFl6SW2t6fiw6FiiTnJOdefD5juTy95NsL/YW+AERERERERERE9L8Qy7FyuZr92D40KQhFCMYQwgiAPICDAAq/L2sB+AKgDZEVBLwNkNdH8p8bCwvVbcv7SQOTAOPjjwc2oq0bAagAONzlzCcBaoNx7v7S0pWfFveVBuoAwydn9hW2cw0gTFjcECCLrezW5Oqraz9s9pIt0g4Utgdu2b34ABAmCju5m3Z7yaYOAOC8wcZuIVww30woiwBHDTb6sZlIFgGyBhv92EwkiwCkkNivtEuVheB9D3/xHUADcTxdf3T6vXaMT0Dn9gM4J1G0ePHqi2HtGAN0KQBDEsuMdocBdM5qBxhA54B2gAGcMYAzBnCW2HPAv0xNTffl88zO3uvpPp8AZwzgjAGcMYAzBnDGAM4YwBkDOGMAZ6k9Cff6hNovfAKcMYAzBnDGAM4YwFlqvwu6fL2058efPHjZ0+us8QlwxgDOGMAZAzhjAGfq3xEbOT7Xk59iPlYc68WsuXqtrHoN+QQ4YwBnDOCMJ+EOr7PGJ8AZAzhjAGcM4IwBnPEkrMSTcMoxgDMGcMaTcIfXWeMT4IwBnDGAMwZwxgDOeBJW4kk45RjAGQM4YwCdr9oBBlCRhnaBAbokwHqcgfqPFjFA574BMr+TkRNPH576oB2zeDc0hn3InXqtnNp3ajth8cKtGmzsJj3YTCh9AMG8wX3sFuSZ+WZCqQNk2tFtAMsG9/LHcmZDqoZ7iaYO0GxWWpv5QgkidwGsKabWJODOZr5QajYrLe19pYXpv7EaHa3m4vzQmRBQBGQUwAiAQez9b6w2AKxA8E4Q3kTt9efNZnXL8n6IiIiIiIiIiIiS5Bdlk55v36/b1gAAAABJRU5ErkJggg==\",\"customAvatar\":\"data:image/png;base64,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\",\"darkTheme\":{\"pace\":\"yellow\",\"label\":\"Material Design Indigo\",\"mode\":\"dark\",\"key\":\"md-dark-indigo\"},\"lightTheme\":{\"pace\":\"blue\",\"label\":\"Material Design Indigo\",\"mode\":\"light\",\"key\":\"md-light-indigo\"}}',NULL,NULL,1,'2023-04-25 08:08:19');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_info`
--

DROP TABLE IF EXISTS `user_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_info` (
  `id` bigint NOT NULL,
  `country` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `province` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `zip_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `tel1` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `tel2` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mobile` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `fax` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_user_profile_user` FOREIGN KEY (`id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_info`
--

LOCK TABLES `user_info` WRITE;
/*!40000 ALTER TABLE `user_info` DISABLE KEYS */;
INSERT INTO `user_info` VALUES (1,'United States','200 Windward Passage','FL','Clearwater Beach','33767',NULL,NULL,'17272008240','',NULL,NULL,1,'2023-04-03 04:59:21');
/*!40000 ALTER TABLE `user_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_rate`
--

DROP TABLE IF EXISTS `vendor_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_rate` (
  `id` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `npanxx` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `lata` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ocn` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `state` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ocn_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `category` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `inter_rate` decimal(20,6) NOT NULL DEFAULT '0.000000',
  `intra_rate` decimal(20,6) NOT NULL DEFAULT '0.000000',
  `init_duration` bigint NOT NULL DEFAULT '0',
  `succ_duration` bigint NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_vendor_rate_customer` (`customer_id`),
  KEY `ID_vendor_rate_customer_npanxx` (`npanxx`,`customer_id`),
  CONSTRAINT `FK_vendor_rate_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_rate`
--

LOCK TABLES `vendor_rate` WRITE;
/*!40000 ALTER TABLE `vendor_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_rate` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-30  5:50:19
