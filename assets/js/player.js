$(document).ready(function() {
    $(".audioPlayer")
      .toArray()
      .forEach(function(player) {
        /**for marquee effect */
        var marquee = $(player).find(".marquee");
        marquee.width(marquee.parent().width());
        marquee.marquee();
  
        /**find the audio tag */
        var audio = $(player).find("audio")[0];
        var seekbarInner = $(player).find(".seekBar .inner");
        var seekbarOuter = $(player).find(".seekBar .outer");
        var volumeControl = $(player).find(".volumeControl .wrapper");
        var length;
        var interval;
        var seekBarPercentage;
        var volumePercentage;
        var autoplay = $('.btn').attr('id');
  
        /************************ on click of button playing the song *************************/

      

        $(window).ready(function() {

         if (autoplay == true) {
        
         
          $( ".btn" ).removeClass( "play" );
          $( ".btn" ).addClass( "pause" );
       
            /**find length of audio */
            length = audio.duration;
  
            /** set the end duration **/
            $(player)
              .find(".timing .end")
              .text((length / 60).toFixed(2));

            /**** play the audio ****/
            audio.play();
           
            
            
          /**animating album art */
          $(player)
            .find(".albumArt")
            .toggleClass("animate");
        
        }
      
      });
    
     

        $(player)
       
          .find(".btn")
          .on("click", function() {

           

            var _button = $(this);
            /**if the button has class play then */
            if (_button.hasClass("play")) {
              _button.removeClass("play").addClass("pause");
  
              /**find length of audio */
              length = audio.duration;
  
              /** set the end duration **/
              $(player)
                .find(".timing .end")
                .text((length / 60).toFixed(2));
  
              /**** play the audio ****/
              audio.play();
             
              /**set seekbar percentage */
              interval = setInterval(function() {
                /**run this function to update seekbar */
                if (!audio.paused) {
                  /*check wheather audio is playing then*/
                  updateSeekBar();
                }
  
                /**if audio playback ended */
                if (audio.ended) {
                  clearInterval(interval);
                  $(player)
                    .find(".albumArt")
                    .removeClass("animate");
                  _button.removeClass("pause").addClass("play");
                  seekbarInner.width(100 + "%");
  
                  $(player)
                    .find(".timing .start")
                    .text((audio.duration / 60).toFixed(2));
                }
              }, 250);
            } else if (_button.hasClass("pause")) {
              _button.removeClass("pause").addClass("play");
              audio.pause();
            }
  
            /**animating album art */
            $(player)
              .find(".albumArt")
              .toggleClass("animate");
          });
  
        /****************** for scroll on seek bar ***********************************/
  
        seekbarOuter.mousewheel(function(turn, delta) {
          if (length != undefined) {
            /* update the seekBar only if the length is set*/
            if (delta == 1) {
              audio.currentTime < audio.duration
                ? (audio.currentTime += 1)
                : (audio.currentTime = audio.duration);
              updateSeekBar();
            } else {
              audio.currentTime < 0
                ? (audio.currentTime = 0)
                : (audio.currentTime -= 1);
              updateSeekBar();
            }
          }
        });
  
        /****************for click on scroll bar **************************/
        seekbarOuter.on("click", function(e) {
          if (!audio.ended && length !== undefined) {
            var seekPosition = e.pageX - $(seekbarOuter).offset().left;
            if (seekPosition >= 0) {
              audio.currentTime =
                (seekPosition * audio.duration) / $(seekbarOuter).width();
              updateSeekBar();
            }
          }
        });
  
        /**************** for click on volume control ******************/
        volumeControl.find(".outer").on("click", function(e) {
          var volumePosition = e.pageX - $(this).offset().left;
          var audioVolume = volumePosition / $(this).width();
          if (audioVolume >= 0 && audioVolume <= 1) {
            audio.volume = audioVolume;
            $(this)
              .find(".inner")
              .css("width", audioVolume * 100 + "%");
          }
        });
  
        /******************* for scroll on volume control ****************/
        volumeControl.mousewheel(function(turn, delta) {
          if (delta == 1) {
            audio.volume < 0.9 ? (audio.volume += 0.1) : (audio.volume = 1);
            updateVolume();
          } else {
            audio.volume < 0.1 ? (audio.volume = 0) : (audio.volume -= 0.1);
            updateVolume();
          }
        });
  
        /**************************** All Functions  ************************/
        /**
         *  Update seekBars
         * */
        var updateSeekBar = function() {
          seekBarPercentage = getPercentage(
            audio.currentTime.toFixed(2),
            length.toFixed(2)
          );
  
          /**update the seek bar percentage */
          $(seekbarInner).css("width", seekBarPercentage + "%");
  
          /**update the start time **/
          $(player)
            .find(".timing .start")
            .text((audio.currentTime / 60).toFixed(2));
        };
  
        /**
         * update volumeBar
         **/
        var updateVolume = function() {
          volumePercentage = getPercentage(audio.volume, 1);
          $(volumeControl)
            .find(".inner")
            .css("width", volumePercentage + "%");
        };
  
        /**forEach End**/
      });
  
    /**Find Percentage */
    var getPercentage = function(presentTime, totalLength) {
      var calcPercentage = (presentTime / totalLength) * 100;
      return parseFloat(calcPercentage.toString());
    };
  });
  