$(function() {

  var play        = $('#play');
  var stop        = $('#btnStop');
  var navbar      = $('#player-nav');
  var hide        = $('#hidden');
  var show        = $('#show');
  var music       = $('#play').attr('title');
  var volume      = $('#volume');
  var live        = $('.live');
  var autoplay_id = $('.radio_autoplayer').attr('id');

  // Weves Ids
  var play_sp    = $("#play-sp");
  var wevescolor = $(".wevescolor").attr("src");


  // player audio normal
  var sound = new Howl({
    src     : [music],
    html5   : true,             // A live stream can only be played through HTML5 Audio.
    format  : ['mp3', 'aac'],
    autoplay: autoplay_id
  });


  // Custom wevesurfer
  var wavesurfer = WaveSurfer.create({
    container:     "#waveform",
    progressColor: wevescolor,
    responsive:    true,
    barWidth:      3,
    cursorWidth:   0,
    autoCenter:    true,
    scrollParent:  false
  });



  $(window).ready(function() {

      show.hide();

    if (sound._autoplay == true) {
      sound.play();
      $(".fa-play-circle").toggleClass('fa-pause-circle');
      $(".fa-play-circle").fadeOut(1500, function() {
        live.fadeOut(1000);
        live.fadeIn(300);

      });
      $(".waves").fadeIn(500);
      $(".playing").show();
    }
  });


  hide.on("click", function() {

    navbar.fadeOut(500);
    show.fadeIn(500);
    show.addClass("animated fadeInUp");
    $(".fa-pause-circle").toggleClass('fa-play-circle');
    sound.stop();
    $(".playing").hide();
  });

  show.on("click", function() {
    navbar.show();
    navbar.toggleClass("animated fadeInDown");
    show.hide();

  });


// play station pro

  play.on('click', function(e) {
    if (!sound.playing()) {
      sound.play();
      wavesurfer.stop();
    }

    $(".fa-play-circle").fadeOut(1500, function() {
      live.fadeOut(1000);
      live.fadeIn(300);

    });
    $(".waves").fadeIn(500);
    $(".playing").show();
    $(".fa-play-circle").toggleClass('fa-pause-circle');

  });

// stop station pro

  stop.on('click', function() {
    $(".fa-pause-circle").toggleClass('fa-play-circle');
    $(".waves").fadeOut(1000);
    $(".playing").hide();

    wavesurfer.stop();
    sound.stop();
  });


  

  $("#volume").on('input', function (e) {
    sound.volume($(this).val());

    if (this.value == "0") {
      $('.fa-volume-down').toggleClass("fa-volume-off");
    } else {
      $('.fa-volume-off').toggleClass("fa-volume-down");
    }

    if (this.value >= "0.55") {
      $('.fa-volume-down').toggleClass("fa-volume-up");
    } else {
      $('.fa-volume-up').toggleClass("fa-volume-down");
    }

  });


  // end sound play
  sound.on('end', function() {
    $(".fa-pause-circle").toggleClass('fa-play-circle');
  });



  /**
   * Podcasting custum script
   */

  
   
 
  // Start player podcast
  play_sp.on("click", function() {
    get_song = $(this).attr("src");
    wavesurfer.load(get_song);
  });

  // Loading and player podcast
  wavesurfer.on("ready", function() {
    wavesurfer.play();

    if (wavesurfer.isPlaying() === true)
      play_sp.find(".material-icons").text("pause");
  });

  wavesurfer.on("pause", function() {
    play_sp.find(".material-icons").text("play_arrow");
    wevesurfer.stop();
  });
});


 