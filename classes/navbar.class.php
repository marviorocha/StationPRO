<?php
require_once(ABSPATH.'wp-load.php');

global $wpdb;
global $post;

function player_layout(){

$titan         = TitanFramework::getInstance('my-theme');
$layout_player = $titan->getOption('layout_player');

if($layout_player == 1){
return "top: 0;";
}else{
return "bottom:0;";
}
}
?>
<?php function style_player(){ ?>
  <style>
  #iframe_main{position:fixed;<?php echo player_layout(); ?>}
  #idiv{position:relative;height:7.8rem;z-index:998;left:0;right:0;bottom:0}
  </style>
<?php } // end style player function ?>
<?php add_action('wp_head','style_player');  ?>
<?php function player(){ ?>
  <div id='idiv'>
    <iframe  id="iframe_main" scrolling="no" height="200" frameborder="0" 
    src="<?php echo WP_PLUGIN_URL ?>/station-pro/lib/player/index.php"
      width="100%"></iframe>
  </div>
<?php }
add_action('wp_footer','player');
 // end player ?>