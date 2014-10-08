/*
    Main code
 */
'use strict';

setTimeout(function(){
    document.body.classList.add('show-intro');
}, 1000);

setTimeout(function(){
    document.body.classList.remove('during-intro');
}, 8000);

setTimeout(function(){
    document.body.classList.remove('show-intro');
}, 5000);
