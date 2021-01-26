<?php 
class PodcastClass {

  function __construct() {
      add_action( 'tf_create_options', array( $this, 'ajax_fields' ) );
  }

  // started function ajax fields

  function ajax_fields() {

    $titan = TitanFramework::getInstance( 'ajax-fields' );
    
   

   } 
}

new PodcastClass();

?>