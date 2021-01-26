 var handler = FS.Checkout.configure({
        plugin_id:  '1047',
        plan_id:    '1455',
        public_key: 'pk_3defa8338f31c475d1ef8fad18f9a',
        image:      'https://image.ibb.co/cxRzy5/icon.png'
    });
  
    $('#purchase').on('click', function (e) {
        handler.open({
            name     : 'Station Pro Easy Player for Wordpress',
            licenses : 1,
            // You can consume the response for after purchase logic.
            success  : function (response) {
                // alert(response.user.email);
            }
        });
        e.preventDefault();
    });