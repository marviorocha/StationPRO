<?php require('../../../../../wp-load.php');
require('../../classes/scssphp/scss.inc.php');
global $wpdb;
$root_path = plugins_url() . "/station-pro/assets/";
use ScssPhp\ScssPhp\Compiler;
$scss = new Compiler();
$arquivo = file_get_contents($root_path . '/sass/style.scss');




 $titan         = TitanFramework::getInstance('my-theme');
 $djname        = $titan->getOption('dj_name');
 $shoutcast     = $titan->getOption('shoutcast');
 $icecast       = $titan->getOption('icecast');
 $autoplay      = $titan->getOption('auto_play');
 $color_player  = $titan->getOption('color_player');
 $brand         = $titan->getOption('brand');
 $layout_player = $titan->getOption('layout_player');



$arquivo = str_replace('$padrao', $color_player[4], $arquivo);

$style = $scss->compile($arquivo);

 
// compile sass css with php


/**
 * Radio Function Player
 */

function radio(){
  $titan     = TitanFramework::getInstance('my-theme');
  $icecast   = $titan->getOption('icecast');
  $shoutcast = $titan->getOption('shoutcast');


if(!$shoutcast == ""){
  return $shoutcast ."/stream";
  }else{
  return $icecast;
  }
} // end radio function


/**
 * function Logo Imagem Player
 */

function logo_player(){
 $titan         = TitanFramework::getInstance('my-theme');
 $logo          = $titan->getOption('image_logo');
 $image_attributes = wp_get_attachment_image_src( $attachment_id = $logo   );
if($logo == ""){

return  get_avatar_url(get_the_author_meta(get_current_user_id()));

}else{
return $image_attributes[0];
}

} // end radio function

// get the images url
wp_get_attachment_image_src( $attachment_id = logo_player() );

?>
<!DOCTYPE html>
<html lang="eng">
  <head>
  
    <!-- Compiled and minified CSS -->
    <!-- <link rel="stylesheet" href="css/materialize.css"> -->
     
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <!-- <link rel="stylesheet" href="css/player.css"> -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css">
    <style>
     <?php echo $style ?>
    </style>

  </head>
  <body>
  

  <div class="container">

<div class="audioPlayer">
  <div class="playerContainer">
    <div class="albumArt">
    <img width="50" height="50" id="image" src="<?php echo logo_player()  ?>" class="circle responsive-img hide-on-small-only">
    </div>

    <div class="info">
      <div class="audioName marquee" data-duration='5000' data-gap='50' data-duplicated='false'><?php echo $djname ?></div>
      <div class="seekBar">
        <span class="outer">
            <span class="inner" data-seek=0></span>
        </span>
      </div>
      <div class="timing">
        <span class="start">0:00</span> 
        
        <?php if($brand == true){  ?>
       <a style="font-size:0.875rem" rel="follow" target="_blank" title="Station Pro - Easy Player Radio " href="https://stationpro.marviorocha.com/"><i class="fas fa-microphone"></i> by Station Pro</a>
        <?php } // end brand enable ?>       
        <span class="end">0:00</span>
      </div>
    </div>

    <div class="volumeControl">
      <div class="wrapper">
        <i class="fa fa-volume-up"></i>
        <span class="outer">
            <span class="inner"></span>
        </span>
        
       
      </div>
    </div>
    <button id="<?php echo $autoplay ?>"  class="btn play">
        <i class="fa fa-play"></i>
        <i class="fa fa-pause"></i>
      </button>
      
  </div>
  
  <audio class="audio">
       
      <source src="<?php echo radio(); ?>">
    </audio>
</div>
</div>









<!-- Other Older player  -->










  <!-- End Player -->

 

 
    <script defer src="https://use.fontawesome.com/releases/v5.0.12/js/all.js" integrity="sha384-Voup2lBiiyZYkRto2XWqbzxHXwzcm4A5RfdfG6466bu5LqjwwrjXCMBQBLMWh7qR" crossorigin="anonymous"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js" charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js" charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jQuery.Marquee/1.5.0/jquery.marquee.min.js"></script>
    
   <script type="text/javascript" src="<?php echo $root_path ?>/js/player.js"></script>
 
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.0.12/howler.min.js"></script>
   
  </body>
</html>
