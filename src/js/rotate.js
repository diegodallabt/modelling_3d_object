function transformationRotate(ponto, angulo) {

    var radianos = (Math.PI / 180) * angulo;
    var cos = Math.cos(radianos);
    var sin = Math.sin(radianos);
    var yNovo = ponto.y * cos - ponto.z * sin;
    var zNovo = ponto.y * sin + ponto.z * cos;

    return {x: ponto.x, y: yNovo, z: zNovo};

}

function rotateAllPoints(pontos, angulo) {

    var novosPontos = [];
    for (var i = 0; i < pontos.length; i++) {
        novosPontos.push(transformationRotate(pontos[i], angulo));
    }
    return novosPontos;

}


export function createNewSlice(pontos){

    for (var i = 0; i < 4; i++) {
        pontos = rotateAllPoints(pontos, 90);
        console.log(pontos);
    }

}