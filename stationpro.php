<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * ------------------------------------------------------------------------------------------------
 *
 * Station Pro - Easy Web Radio in Wordpress - by marviorocha.com
 *
 *
 * Plugin Name: Station PRO
 * Plugin URI: http://marviorocha.com/stationpro
 * Tags: streaming, shoutcast, icacast, radio, live streaming, web radio, online radio, automation online, station, on ar, comunication, player, html5 player
 * Author: Marvio Rocha <marviorocha@marviorocha.com>
 * Author URI: http://marviorocha.com/
 * Version: 2.2.0
 * Description:  The Station PRO is plugin to automation web radio SHOUTcast or Icecast. With responsive and custom player for your wordpress site.
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: station-pro
 * @fs_premium_only /lib/functions.php, /premium-files/
 * ------------------------------------------------------------------------------------------------
 *
 * Copyright 2017 Marvio Rocha <marviorocha@marviorocha.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * ------------------------------------------------------------------------------------------------
 *
 */
 
 
 if ( ! function_exists( 'stationpro' ) ) {

 // ------------------------------------------------------------------------------------------------
 require_once plugin_dir_path( __FILE__ ) .'/classes/navbar.class.php';
 require_once plugin_dir_path( __FILE__ ) .'/classes/scripts.class.php';

//  compile sass with a pho


// load fields 
 require_once plugin_dir_path( __FILE__ ) .'/config/fields.php';

//  load xcrud
//  require_once plugin_dir_path( __FILE__ ) .'/lib/xcrud_plugin.php';
 
 // ------------------------------------------------------------------------------------------------

 
/**
 * Fremiuns Settings Player
 */
 // Create a helper function for easy SDK access.
 function stationpro() {
  global $stationpro;

  if ( ! isset( $stationpro ) ) {
      // Activate multisite network integration.
      if ( ! defined( 'WP_FS__PRODUCT_1047_MULTISITE' ) ) {
          define( 'WP_FS__PRODUCT_1047_MULTISITE', true );
      }

      // Include Freemius SDK.
      require_once dirname(__FILE__) . '/freemius/start.php';

      $stationpro = fs_dynamic_init( array(
          'id'                  => '1047',
          'slug'                => 'station-pro',
          'type'                => 'plugin',
          'public_key'          => 'pk_3defa8338f31c475d1ef8fad18f9a',
          'is_premium'          => false,
          'has_addons'          => false,
          'has_paid_plans'      => true,
          'menu'                => array(
              'slug'           => "station-pro",
              'override_exact' => true,
              'first-path'     => 'admin.php?page=station-pro&welcome-message=true',
              'support'        => false,
              'network'        => true,
              'parent'         => array(
                  'slug' => "station-pro",
              ),
          ),
          // Set the SDK to work in a sandbox mode (for development & testing).
          // IMPORTANT: MAKE SURE TO REMOVE SECRET KEY BEFORE DEPLOYMENT.
          'secret_key'          => 'sk_~1Lc6s{@Vtxb1a%I6yb(R*f~_nqT&',
      ) );
  }

  return $stationpro;
}

 // Init Freemius.
 stationpro();
 // Signal that SDK was initiated.
 do_action( 'stationpro_loaded' );

 global $stationpro;
 $stationpro->get_account_url();

 function stationpro_settings_url() {
     return admin_url( 'admin.php?page=station-pro' );
 }

 stationpro()->add_filter( 'connect_url', 'stationpro_settings_url' );
 stationpro()->add_filter( 'after_skip_url', 'stationpro_settings_url' );
 stationpro()->add_filter( 'after_connect_url', 'stationpro_settings_url' );
 stationpro()->add_filter( 'after_pending_connect_url', 'stationpro_settings_url' );
 stationpro()->add_action('after_uninstall', 'stationpro_uninstall_cleanup');
// End Fremiuns Settings


 // titan framework
 // Check whether the Titan Framework plugin is activated, and notify if it isn't
 // require_once( 'titan/titan-framework-checker.php' );

 require_once( 'titan/titan-framework-embedder.php' );
 add_action( 'tf_create_options', 'my_theme_create_options' );

 // Register Custom Post Type
 function station_casting() {

 	$labels = array(
 		'name'                  => _x( 'Podcast', 'Post Type General Name', 'default' ),
 		'singular_name'         => _x( 'Podcast', 'Post Type Singular Name', 'default' ),
 		'menu_name'             => __( 'PodStation', 'default' ),
 		'name_admin_bar'        => __( 'PodStation', 'default' ),
 		'archives'              => __( 'Item Archives', 'default' ),
 		'attributes'            => __( 'Item Attributes', 'default' ),
 		'parent_item_colon'     => __( 'Parent Item:', 'default' ),
 		'all_items'             => __( 'All Items', 'default' ),
 		'add_new_item'          => __( 'Add New Item', 'default' ),
 		'add_new'               => __( 'Add New', 'default' ),
 		'new_item'              => __( 'New Item', 'default' ),
 		'edit_item'             => __( 'Edit Item', 'default' ),
 		'update_item'           => __( 'Update Item', 'default' ),
 		'view_item'             => __( 'View Item', 'default' ),
 		'view_items'            => __( 'View Items', 'default' ),
 		'search_items'          => __( 'Search Item', 'default' ),
 		'not_found'             => __( 'Not found', 'default' ),
 		'not_found_in_trash'    => __( 'Not found in Trash', 'default' ),
 		'featured_image'        => __( 'Featured Image', 'default' ),
 		'set_featured_image'    => __( 'Set featured image', 'default' ),
 		'remove_featured_image' => __( 'Remove featured image', 'default' ),
 		'use_featured_image'    => __( 'Use as featured image', 'default' ),
 		'insert_into_item'      => __( 'Insert into item', 'default' ),
 		'uploaded_to_this_item' => __( 'Uploaded to this item', 'default' ),
 		'items_list'            => __( 'Items list', 'default' ),
 		'items_list_navigation' => __( 'Items list navigation', 'default' ),
 		'filter_items_list'     => __( 'Filter items list', 'default' ),
   );
   
 	$args = array(
 		'label'               => __( 'Podcast', 'default' ),
 		'description'         => __( 'Podcast Station Pro', 'default' ),
 		'labels'              => $labels,
 		'supports'            => array( 'title' ),
 		'hierarchical'        => false,
 		'public'              => true,
 		'show_ui'             => true,
 		'show_in_menu'        => true,
 		'menu_position'       => 23,
 		'menu_icon'           => 'dashicons-playlist-audio',
 		'show_in_admin_bar'   => true,
    'show_in_nav_menus'   => true,
    'rewrite'             => array('slug' => 'podstation'),
 		'can_export'          => true,
 		'has_archive'         => true,
 		'exclude_from_search' => false,
 		'publicly_queryable'  => true,
 		'capability_type'     => 'page',
 	);
 	register_post_type( 'station_post', $args );

 }
 
 
 if ( stationpro()->is__premium_only() ) {
  if ( stationpro()->can_use_premium_code() ) {
  add_action( 'init', 'station_casting', 0 );
  }
}
 

/**
 * Fremiuns Settings to plugins
 */
 
 
function stationpro_custom_connect_message_on_update(
  $message,
  $user_first_name,
  $plugin_title,
  $user_login,
  $site_link,
  $freemius_link
) {
  return sprintf(
      __( 'Hey %1$s' ) . ',<br>' .
      __( 'Please help us improve %2$s! If you opt-in, some data about your usage of %2$s will be sent to %5$s. If you skip this, that\'s okay! %2$s will still work just fine.', 'station-pro' ),
      $user_first_name,
      '<b>' . $plugin_title . '</b>',
      '<b>' . $user_login . '</b>',
      $site_link,
      $freemius_link
  );
}

stationpro()->add_filter('connect_message_on_update', 'stationpro_custom_connect_message_on_update', 10, 6);
 



} // end function my plugins freemius -->
