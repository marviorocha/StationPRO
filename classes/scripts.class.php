<?php
require_once(ABSPATH.'wp-load.php');

global $wpdb;
global $post;
/*
Loading css style
*/



function player_script() {

    //  wp_enqueue_style( 'materialize-icon',  plugins_url('station-pro') . '/lib/player/css/podcast.min.css');
 
 }

add_action('wp_print_styles', 'player_script');

/*
Loading js
*/

// Register Script
 // Register Script

 // Register Script


 
 
 
function wpdocs_theme_name_scripts() {

 
    wp_register_script( 'Jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js', null, null, true );
    wp_enqueue_script('Jquery');     
 
 
     
}
    add_action( 'wp_enqueue_scripts', 'wpdocs_theme_name_scripts' );


// Ajax load function

add_action('wp_enqueue_scripts', 'ajax_load_scripts');

/**
 *	Function name: aws_load_scripts
 *	Description: Loading the required js files and assing required php variable to js variable.

 */


global $plugin_dir_path;
$plugin_dir_path = plugin_dir_url(__FILE__);


function ajax_load_scripts() {

    $titan         = TitanFramework::getInstance('my-theme');
 

    $no_ajax_ids        = $titan->getOption('no_ids');
    $container_id 		= $titan->getOption( 'ajax_container' );
    $mcdc 				= $titan->getOption( 'class_menu' );
    $search_form 		= $titan->getOption( 'search_ajax' );
    $transition 		= $titan->getOption( 'transition_ajax' );
    $scrollTop 			= $titan->getOption( 'scroll_ajax' );
    $loader 			= $titan->getOption('loader');
   
 
	//Check whether the core jqury library enqued or not. If not enqued the enque this
	if(!wp_script_is( 'jquery' )) {
		wp_enqueue_script('jquery');
	}
	global $plugin_dir_path;
	
	wp_enqueue_script('history-js', $plugin_dir_path . '../assets/js/history.js', array('jquery'));
	wp_enqueue_script('ajaxify-js',  $plugin_dir_path . '../assets/js/ajaxify.js', array('jquery'));
	
	$ids_arr = explode(',', $no_ajax_ids);
	foreach( $ids_arr as $key => $id ) {
		if ( trim($id) == '' )
			unset($ids_arr[$key]);
		else
			$ids_arr[$key] =  '#' . trim($id) . ' a';
	}
	$ids = implode(',', $ids_arr);
	
	include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
	$bp_status = is_plugin_active( 'buddypress/bp-loader.php' );
	
	$ajaxloading_data = array(
		'rootUrl' 		=> site_url() . '/',
		'ids' 			=> $ids,
		'container_id' 	=> get_option('container-id'),
		'mcdc' 			=> $mcdc,
		'searchID' 		=> $search_form,
		'transition' 	=> $transition,
		'scrollTop' 	=> $scrollTop,
		'loader' 		=> $loader,
		'bp_status'     => $bp_status
	);
    
  
	wp_localize_script('ajaxify-js', 'aws_data', $ajaxloading_data);
	
	
} // End of aws_load_scripts function
?>