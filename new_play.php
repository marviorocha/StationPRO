<?php
/***********************************
*
*
* CLASS FOR STATION PRO DEVELOPMENTO BY MARVIO ROCHA 
* WWW.MARVIOROCHA.COM COPYRIGHT BY MARVIOROCHA 2014
*
*
**********************************/
require_once(ABSPATH.'/wp-blog-header.php');
class players  {
function wmp (){
 
global $wpdb;
$shoutcast = cs_get_option('shoutcast_url');
$icecast = cs_get_option('icecast_url');
$titulo = "Station PRO"; 
$autor = "Wodpress";
$news = "";
$copytight ="Plugin Station Pro WP by MarvioRocha.Com ";
$site = "https://wordpress.org/plugins/station-pro/";
$str = $shoutcast;
$urls = explode('http://', $str, 2);
if(cs_get_option('server') == "shoutcast"){
$bg = "http://lorempixel.com/600/500/technics/"; /// opcional
$fp = fopen(plugin_dir_path( __FILE__ )."/player/wmp.asx", "w"); // abre o arquivo
fwrite($fp,"<ASX version = \"3.0\">
<TITLE>".$titulo."</TITLE>
        <ENTRY> 
                <ABSTRACT>".$news."</ABSTRACT>
                <TITLE>".$titulo."</TITLE>
                <AUTHOR>".$autor."</AUTHOR>
                <COPYRIGHT>".$copytight."</COPYRIGHT>
                <BASE HREF=\"".$site."/\" />
                    
                <REF HREF = \"http://".$urls['1']."\" />
                <REF HREF = \"mms://".$urls['1']."\" />
                <Banner href=\"".$bg."\">      
                        <MoreInfo href = \"".$site."/\" />
                        <Abstract>Powered by MarvioRocha.Com</Abstract>
                </Banner>
        </ENTRY>
</ASX>");  
fclose($fp); // clouse  file
}
if(cs_get_option('server') == "icecast"){
$bg = "http://lorempixel.com/600/500/technics/"; /// opcional
$fp = fopen(plugin_dir_path( __FILE__ )."/player/wmp.asx", "w"); // abre o arquivo
fwrite($fp,"<ASX version = \"3.0\">
<TITLE>".$titulo."</TITLE>
        <ENTRY> 
                <ABSTRACT>".$news."</ABSTRACT>
                <TITLE>".$titulo."</TITLE>
                <AUTHOR>".$autor."</AUTHOR>
                <COPYRIGHT>".$copytight."</COPYRIGHT>
                <BASE HREF=\"".$site."/\" />
                    
                <REF HREF = \"http://".$urls['1']."\" />
                <REF HREF = \"mms://".$urls['1']."\" />
                <Banner href=\"".$bg."\">      
                        <MoreInfo href = \"".$site."/\" />
                        <Abstract>Powered by MarvioRocha.Com</Abstract>
                </Banner>
        </ENTRY>
</ASX>");  
fclose($fp); // clouse  file
}
}
function pls (){
    
 
global $wpdb;  
$shoutcast = cs_get_option('shoutcast_url');
$icecast = cs_get_option('icecast_url');

 
// positive limit
if(cs_get_option('server') == "shoutcast"){
$str = $shoutcast;
$urls = explode('http://', $str, 2);
// cria o play para winamp  
$fp = fopen(plugin_dir_path( __FILE__ )."/player/winamp.pls", "w"); 
fwrite ($fp,"[playlist]
NumberOfEntries=1
File1=http://".$urls['1']."
");
fclose($fp);    
}
if(cs_get_option('server') == "icecast"){
$str = $icecast;
$urls = explode('http://', $str, 2);
// cria o play para winamp  
$fp = fopen(plugin_dir_path( __FILE__ )."/player/winamp.pls", "w"); 
fwrite ($fp,"[playlist]
NumberOfEntries=1
File1=http://".$urls['1']."
");
fclose($fp); 
}   
}
 
function Itunes (){
global $wpdb; 
$shoutcast = cs_get_option('shoutcast_url');
$icecast = cs_get_option('icecast_url');
// positive limit
if(cs_get_option('server') == "shoutcast"){
$str = $shoutcast;
$urls = explode('http://', $str, 2);
// cria o play para winamp      
$fp = fopen(plugin_dir_path( __FILE__ )."/player/itunes.pls", "w"); 
        fwrite ($fp,
                        
                        "[playlist]
numberofentries=2
File1=http://".$urls["1"]."
Title1=".$titulo."
Length1=-1
Version=2");
fclose($fp);    
}
if(cs_get_option('server') == "icecast"){
$str = $icecast;
$urls = explode('http://', $str, 2);
// cria o play para winamp      
$fp = fopen(plugin_dir_path( __FILE__ )."/player/itunes.pls", "w"); 
        fwrite ($fp,
                        
                        "[playlist]
numberofentries=2
File1=http://$urls[1]
Title1=$titulo
Length1=-1
Version=2");
fclose($fp); 
}       
}


function android (){
global $wpdb;
$shoutcast = cs_get_option('shoutcast_url');
$icecast = cs_get_option('icecast_url');
// positive limit
if(cs_get_option('server') == "shoutcast"){
$str = $shoutcast;
$urls = explode('http://', $str, 2);
// cria o play para winamp      
$fp = fopen(plugin_dir_path( __FILE__ )."/player/android.m3u", "w"); 
fwrite ($fp,
      'http://'.$urls["1"].''
           );
fclose($fp);    
}
if(cs_get_option('server') == "icecast"){
$str = $icecast;
$urls = explode('http://', $str, 2);
// cria o play para winamp      
$fp = fopen(plugin_dir_path( __FILE__ )."/player/android.m3u", "w"); 
        fwrite ($fp,
                'http://'.$urls["1"].'');
fclose($fp); 
}       
}
 
        
                
}
?>