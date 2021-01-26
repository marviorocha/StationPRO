jQuery(document).ready(function( $ ) {
 
 

  var stop        = $("#btnStop");
  var navbar      = $("#player-nav");
  var hide        = $("#hidden");
  var show        = $("#show");
  var music       = $("#play").attr("title");
  var volume      = $("#volume");
  var live        = $(".live");
  var autoplay_id = $(".radio_autoplayer").attr("id");

  // Weves Ids
  var play_sp    = $("#play-sp");
  var wevescolor = $(".wevescolor").attr("src");

  // Custom wevesurfer
  var wavesurfer = WaveSurfer.create({
    container:     "#waveform",
    progressColor: wevescolor,
    responsive:    true,
    waveColor: "#e0f2f1",
    barWidth:      3,
    cursorWidth:   0,
    height:        580,
    autoCenter:    true,
    hideScrollbar: true,
    scrollParent:  false
  });

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
  
})( jQuery );

 