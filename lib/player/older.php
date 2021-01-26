<?php require('../../../../../wp-load.php');
  global $wpdb;

 $titan         = TitanFramework::getInstance('my-theme');
 $djname        = $titan->getOption('dj_name');
 $shoutcast     = $titan->getOption('shoutcast');
 $icecast       = $titan->getOption('icecast');
 $autoplay      = $titan->getOption('auto_play');
 $color_player  = $titan->getOption('color_player');
 $brand         = $titan->getOption('brand');
 $layout_player = $titan->getOption('layout_player');


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



?>
<!DOCTYPE html>
<html lang="eng">

  <head>
  
    <!-- Compiled and minified CSS -->
    <!-- <link rel="stylesheet" href="css/materialize.css"> -->
    <link rel="stylesheet" href="./css/style.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <!-- <link rel="stylesheet" href="css/player.css"> -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css">
    <style>
      .sp-bg {
        opacity: 0.8;
        width: 100%;
        display: block;
        background-color: <?php echo $color_player[4] ?>;
        height: 65px;
        position: fixed;

      }
    </style>

  </head>


  <body>
  
    <div class="navbar-fixed">

      <div class="container">

        <div id="btn-show" class="col s3 m3 right">
          <p></p>
          <button id="show" class="btn-floating btn waves-effect waves-light blue  darken-2 pulse"><i class="fas fa-music"></i></button>
        </div>

      </div>

      <nav id="player-nav" class="transparent  darken-4">
        <div class="sp-bg"> </div>
        <div class="container">

          <div class="nav-wrapper">
            <div class="row">
              <!-- Image Thumbinal  -->
              <div class="col s1 m1 l1 ">
                <div class="valign-wrapper">
                  <a style="margin:5px" href="#!" class="">


             

              </a>

                </div>


              </div>
              <!-- Player to thumbinal  -->
              <div class="col s3 m2">
                <ul>
                  <li>
                    <span class="djlive"><?php echo $djname ?></span>
                    <span class="live">Live</span>
                    <li>
                </ul>

              </div>

              <!-- player div start -->
              <div class="col s6 m3">
                <ul>
                  <li class="active"><a title="<?php echo radio(); ?>" id="play" class="waves-effect pulse transparent">
               <i class="far fa-play-circle fa-2x"></i></a></li>

                  <li class="active"><a id="btnStop" class="waves-effect transparent">
                        <i class="far fa-stop-circle fa-2x"></i></a></li>
                  <li>

                    <li class="vol hide-on-small-only">

                      <i class="fas fa-volume-down"></i> <input class="range" type="range" id="volume" value="1" min="0" max="1" step="0.1" />
                    </li>

                    <li class="vol">
                      <!-- Stations -->
                      <div id="playing" class="playing hide-on-small-only">
                        <div class="rect1"></div>
                        <div class="rect2"></div>
                        <div class="rect3"></div>
                        <div class="rect4"></div>
                        <div class="rect5"></div>
                      </div>

                    </li>

                </ul>
              </div>
              <!-- end player div -->



              <!-- left menu player -->
              <div class="col s1 m5 ">

                <ul>
              
                      <a target="_parent" href="<?php echo home_url( $wp->request ) ?>/podstation/">
                      <i class="fas fa-podcast"></i> Podcast</a></li>
                      <li class="right">
              
                      </li>
                </ul>
              </div>


            </div>
          </div>

        </div>

      </nav>

    </div>
    </div>
    <!--  End App VUE -->


    <br /><br />


<div class="row">
  <div class="col s12 m12">
    <div class="card-panel grey lighten-5 z-depth-1">
      <div class="row valign-wrapper">
        <div class="col s2">
          <img id="get_image-sp" src="images/song1.jpg" alt="" class="responsive-img">
          <!-- notice the "circle" class -->
        </div>
        <div class="col s10">
          <span class="black-text">

          <div id="waveform"></div>
          <b><span id="get_title-sp"></span></b> <br>
          <p><span id="get_descricao-sp"></span></p>
          </span>
        </div>
      </div>
    </div>
  </div>



      <ul id="list">


        <span class="time"></span>
        <li>
          <div class="col s12 m6">
            <div class="card">
              <div class="card-image">
                <img id="image-sp" src="images/song1.jpg">

                <span id="title-sp" class="card-title">#EP - 001 Desenvolvendo Podcasting</span>
                <a id="song-sp" title="audio/rave_digger.mp3" class="btn-floating halfway-fab waves-effect waves-light blue"> <i class="material-icons">play_arrow</i></a>

              </div>
              <div class="card-content">
                <p id="descricao-sp">I am a very simple card. I am good at containing small bits of information. I am convenient because I require little markup to use effectively.</p>
              </div>
            </div>
          </div>
        </li>

        <li>
          <div class="col s12 m6">
            <div class="card">
              <div class="card-image">
                <img id="image-sp" src="images/song2.jpg">
                <span id="title-sp" class="card-title">#EP - 002 Desenvolvendo Podcasting</span>
                <a id="song-sp" title="audio/running_out.mp3" class="btn-floating halfway-fab waves-effect waves-light blue"> <i class="material-icons">play_arrow</i></a>

              </div>
              <div class="card-content">
                <p id="descricao-sp">I am a very simple card. I am good at containing small bits of information. I am convenient because I require little markup to use effectively.</p>
                <div class="card-action">
                  <a class="btn-small waves-effect weves-light" value="Download" href="#"> <i class="material-icons"> file_download </i> Download

            </a>

                </div>


              </div>
            </div>
          </div>
        </li>
      </ul>



    </div>

 

    <script defer src="https://use.fontawesome.com/releases/v5.0.12/js/all.js" integrity="sha384-Voup2lBiiyZYkRto2XWqbzxHXwzcm4A5RfdfG6466bu5LqjwwrjXCMBQBLMWh7qR" crossorigin="anonymous"></script>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js" charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/js/materialize.js" charset="utf-8"></script>

    <script src="//cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/2.0.5/wavesurfer.min.js"></script>
 
    <script type="text/javascript" src="./js/player.js"></script>

    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.0.12/howler.min.js"></script>
  </body>
</html>
