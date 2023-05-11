/*
SQLyog Community v13.1.9 (64 bit)
MySQL - 10.4.24-MariaDB : Database - lrn
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`lrn` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;

/*Table structure for table `lerg` */

DROP TABLE IF EXISTS `lerg`;

CREATE TABLE `lerg` (
  `id` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `npanxx` varchar(6) COLLATE utf8_unicode_ci NOT NULL,
  `lata` varchar(4) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lata_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ocn` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ocn_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rate_center` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `state` varchar(2) COLLATE utf8_unicode_ci DEFAULT NULL,
  `abbre` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `thousand` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clli` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ilec` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `switch_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `switch_type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `assign_date` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `prefix_type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rate` decimal(12,6) DEFAULT 0.000000,
  `note` longtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*Table structure for table `lerg_history` */

DROP TABLE IF EXISTS `lerg_history`;

CREATE TABLE `lerg_history` (
  `id` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `message` longtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `total` bigint(20) NOT NULL DEFAULT 0,
  `completed` bigint(20) NOT NULL DEFAULT 0,
  `failed` bigint(20) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

