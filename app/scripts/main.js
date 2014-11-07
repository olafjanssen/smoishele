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
});
