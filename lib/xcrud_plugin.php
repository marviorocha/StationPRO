<?php /** f0ska xcrud wp plugin v.0.7 */
/*
Plugin Name: xCRUD loader
Author: f0ska
Author URI: http://codecanyon.net/user/f0ska
Version: 0.7
*/
function exec_xcrud($matches)
{
    try
    {
        eval('ob_start();' . $matches[1] . '$output = ob_get_contents();ob_end_clean();');
        return $output;
    }
    catch (exception $e)
    {
        return 'executing error';
    }
}
function prepare_xcrud_code($matches){
    return html_entity_decode($matches[1]);
}

function xcrud_wp($content)
{   
    $content = preg_replace_callback('/(<xcrud>.*<\/xcrud>)/Umus', 'prepare_xcrud_code', $content);
    $content = preg_replace_callback('/(\[xcrud\].*\[\/xcrud\])/Umus', 'prepare_xcrud_code', $content);
    $content = preg_replace_callback('/<xcrud>(.*)<\/xcrud>/Umus', 'exec_xcrud', $content);
    $content = preg_replace_callback('/\[xcrud\](.*)\[\/xcrud\]/Umus', 'exec_xcrud', $content);
    return $content;
}
function load_xcrud()
{
    require_once (dirname(__file__) . '/xcrud/xcrud.php');
    if (!session_id())
    { 
        if (!headers_sent())
        {
            session_name(Xcrud_config::$sess_name);
            session_cache_expire(Xcrud_config::$sess_expire);
            session_start();
        }
    }
    Xcrud_config::$manual_load = true;
}
function xcrud_load_css() {
    echo Xcrud::load_css();
}
function xcrud_load_js() {
    echo Xcrud::load_js();
}
add_filter('plugins_loaded', 'load_xcrud', 0);
remove_filter( 'the_content', 'wpautop');
add_filter('the_content', 'xcrud_wp', -1000);
add_filter('wp_head', 'xcrud_load_css',1000);
add_filter('wp_footer', 'xcrud_load_js',1000);