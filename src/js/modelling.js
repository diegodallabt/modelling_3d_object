import { createNewSlice } from './rotate.js';

var canvas = document.getElementById('canvas');

var ctx = canvas.getContext('2d');

var pontos = [];

var ultimoPonto = null;

canvas.addEventListener('click', function(event) {

    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = rect.bottom - event.clientY;

    // Origem no meio do eixo X
    x -= canvas.width / 2;
    
    var raio = 3; 

    ctx.beginPath();
    ctx.arc(x + canvas.width / 2, canvas.height - y, raio, 0, Math.PI * 2, true);
    ctx.fill();


    if (ultimoPonto) {

        ctx.beginPath();
        ctx.moveTo(ultimoPonto.x + canvas.width / 2, canvas.height - ultimoPonto.y);
        ctx.lineTo(x + canvas.width / 2, canvas.height - y);
        ctx.stroke();

    }

    var ponto = {x: x, y: y, z: 0};
    pontos.push(ponto);

    if(pontos.length == 4){

        createNewSlice(pontos);

    }

    ultimoPonto = ponto;

});





