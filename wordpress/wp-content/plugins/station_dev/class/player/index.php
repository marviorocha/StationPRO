<?php require('../../../../../wp-load.php');

 global $wpdb;
 
 
 
 

//  $titan         = TitanFramework::getInstance('my-theme');
//  $djname        = $titan->getOption('dj_name');
//  $shoutcast     = $titan->getOption('shoutcast');
//  $icecast       = $titan->getOption('icecast');
//  $autoplay      = $titan->getOption('auto_play');
//  $color_player  = $titan->getOption('color_player');
//  $brand         = $titan->getOption('brand');
//  $layout_player = $titan->getOption('layout_player');



 

 
// compile sass css with php


/**
 * Radio Function Player
 */

// function radio(){
//   $titan     = TitanFramework::getInstance('my-theme');
//   $icecast   = $titan->getOption('icecast');
//   $shoutcast = $titan->getOption('shoutcast');


// if(!$shoutcast == ""){
//   return $shoutcast ."/stream";
//   }else{
//   return $icecast;
//   }
// } // end radio function


/**
 * function Logo Imagem Player
 */

// function logo_player(){
 
//  $titan             = TitanFramework::getInstance('my-theme');
//  $logo              = $titan->getOption('image_logo');
//  $image_attributes  = wp_get_attachment_image_src( $attachment_id = $logo   );

// if($logo == ""){

// return  get_avatar_url(get_the_author_meta(get_current_user_id()));

// }else{
// return $image_attributes[0];
// }

// } // end radio function

// get the images url
// wp_get_attachment_image_src( $attachment_id = logo_player() );

?>
<!DOCTYPE html>
<html lang="eng">
  <head>
  
 
    <link href="" rel="stylesheet">
 
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css">
    <link rel="stylesheet" href="<?php echo plugins_url('../../dist/bundle.css', __FILE__) ?>">
    <script src="<?php echo plugins_url('../../dist/bundle.js', __FILE__) ?>"></script>
  </head>
  <body>

    
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js" charset="utf-8"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jQuery.Marquee/1.5.0/jquery.marquee.min.js"></script>
     -->
  
  </body>
</html>
