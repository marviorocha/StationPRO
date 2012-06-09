<?php

define('TPLN_VERSION', '3.5'); // TPLN version do not touch please!

/***************************** Configuration ***************************************************/
define('TPLN_LANG','en'); // default Error language 'en' , 'fr'

define('TPLN_WEB_PATH', 'http://www.mywebsite.com/TPLN') ; // your website TPLN url NO slash at end ! (absolute path)
define('TPLN_OUTPUT_CHARSET', 'utf-8'); // display errors in this charset default utf-8

define('TPLN_DEFAULT_IND', false); // allows TPLN to activate default directory and default extension template (1=true and 0=false)
define('TPLN_DEFAULT_PATH', TPLN_PATH.'/templates'); // allows TPLN to activate default directory template if no dir found (absolute path recommended NO slash at end)
define('TPLN_DEFAULT_EXT', 'html'); // allows TPLN to activate default extension template if no extension found (not dot at all)

define('TPLN_ERROR_LANG', 'en'); // default Error language 'en' , 'fr'
define('TPLN_ERROR_ALERT', false);  // activate Mail error alert ? (1=true and 0=false)
define('TPLN_MAIL_ADMIN', 'myadmin@domain.com'); // email adress for error alert (for the webmaster)
define('TPLN_MAIL_EXPEDITOR', 'alert@domain.com'); // the expeditor email by default
define('TPLN_ERROR_LOGS', false);  // activate error logs ? (1=true and 0=false)
define('TPLN_ERROR_LOGS_FILE', TPLN_PATH.'/error_logs.txt'); // default error logs file

define('TPLN_CACHE_DIR', TPLN_PATH.'/cached'); // default cache dir slash NO slash at end !
define('TPLN_CACHE_TIME', 3600); // default cache time in seconds

define('TPLN_PARSE_GLOBALS', true); // allows TPLN to Parse automatically GET, POST, SESSION variable (1=true and 0=false)
define('TPLN_AUTO_CLEAN_BLOCS', true); // allows TPLN to clean orphans blocs after Write() or Output() methods: (recommanded) (1=true and 0=false)
define('TPLN_AUTO_UNSET_TEMPLATE', true); // allows TPLN to clean templates after Write or Output methods (recommanded for performance)(1=true and 0=false)

define('TPLN_ERROR_URI', ''); // alows TPLN to redirect on a specific url on error (let it empty if you don't want it)

define('TPLN_DBUG_CLASS', true); // include dbug  (1=true and 0=false) ex: new dBug($my_arr);
define('TPLN_SQL_QUERY_DEBUG', true); // 0 or 1 to view query on sql error


/***************************** Db configuration  ***************************************************/
/*
	pdo version => http://fr.php.net/manual/en/book.pdo.php
 
    mysql  -> MySQL
    pgsql  -> PostgreSQL
    ibase  -> InterBase
    msql   -> Mini SQL
    mssql  -> Microsoft SQL Server
    oci8   -> Oracle 7/8/8i
    odbc   -> ODBC (Open Database Connectivity)
    sybase -> SyBase
    ifx    -> Informix
    fbsql  -> FrontBase
*/
include(APPPATH.'/config/database.php');

define('TPLN_DB_TYPE_DEFAULT','mysql'); // your SGBD by defaut option
define('TPLN_DB_HOST_DEFAULT', $db[$active_group]['hostname']); // your host by defaut
define('TPLN_DB_LOGIN_DEFAULT', $db[$active_group]['username']); // your login by defaut
define('TPLN_DB_PASSWORD_DEFAULT',$db[$active_group]['password']); // your password by defaut
define('TPLN_DB_BASE_DEFAULT',$db[$active_group]['database']); // your base by defaut
define('TPLN_DB_PORT', '3306'); // your port by defaut don't touch if you don't know
define('TPLN_DB_NEW_CONNECTION', false); // force php to recreate a connection by default (recommanded false) (1=true used for COMMIT and 0=false)

define('TPLN_DB_INIT_QUERIES', ""); # queries executed after connection (separated by ; for example: SET NAMES 'utf8')


// DB Navigation
define('TPLN_DB_NavColorFirst', '#ffffff'); // alternate color by defaut for item {_NavColor}
define('TPLN_DB_NavColorSecond','#e5e5e5'); // alternate color by defaut for item {_NavColor}
/**********************************************************************************/



?>