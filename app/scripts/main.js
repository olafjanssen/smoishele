/*
    Main code
 */
'use strict';

setTimeout(function(){
    document.body.classList.add('show-intro');
}, 5000);

setTimeout(function(){
    document.body.classList.remove('during-intro');
}, 16000);

setTimeout(function(){
    document.body.classList.remove('show-intro');
}, 10000);


setTimeout(function(){
    document.body.classList.add('demo1');
}, 1000);

setTimeout(function(){
    document.body.classList.add('demo2');
    document.body.classList.remove('demo1');
}, 5000);

setTimeout(function(){
    document.body.classList.add('demo3');
    document.body.classList.remove('demo2');
}, 7000);

setTimeout(function(){
    document.body.classList.remove('demo3');
}, 13000);




$(function(){
    $('h1').click(function(){
        document.body.classList.toggle('show-info');
    });

    // load Tumblr gallery

    $.ajax({
        url: 'http://smoishele.tumblr.com/api/read/json?num=50&type=photo',
        type: 'GET',
        dataType: 'jsonp',
        cache: false,
        crossDomain: true,
        processData: true,
        success: function(result)
        {
            var output = '';
            for (var i=0; i<result.posts.length; i++){
                output += '<article><a target="_blank" href="' + result.posts[i].url + '"><div class="item" style="background-image: url(' +
                result.posts[i]['photo-url-400'] + ');"></div></a>' + result.posts[i]['photo-caption'] + '</article>';
            }
            document.getElementById('gallery').innerHTML = output;
        },
        error: function(){
        }
    });

});
