var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var raio = 5;

var ajustWidth = 400;
var Xmin = 0, Xmax = 600, Ymin = 0, Ymax = 600;
var Umin = 0, Umax = window.innerWidth - ajustWidth, Vmin = 0, Vmax = window.innerHeight;

let rotationX = 0;
let rotationY = 0;

let scaleFactor = 1;

let translateX = 0;
let translateY = 0;
let translateZ = 0;

let objects3D = [{
    id: 0,
    polygon: {
        vertices: [],
    },
    revolutionPoints: new Map(),
    faces: new Map(),
    faceIntersections: new Map(),
    minY: Infinity,
    maxY: 0,
    closed: false,
    centroid: { x: 0, y: 0, z: 0 },
    transform: { rotationX: 0, rotationY: 0, scale: 1, translateX: 0, translateY: 0, translateZ: 0 }
}];

let selectedObjectId = 0;

initializeNewObject3D();
drawAxes();

function updateObjectSelector() {
    const selector = document.getElementById('objectSelector');
    selector.innerHTML = '';
    objects3D.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.id;
        if(obj.id == 0){
            return;
        }
        option.textContent = `Objeto ${obj.id}`;
        selector.appendChild(option);
    });
    selector.value = selectedObjectId;
}

document.getElementById('objectSelector').addEventListener('change', function(event) {
    selectedObjectId = parseInt(event.target.value);

    let selectedObject = objects3D[selectedObjectId];
    document.getElementById('rotationX').value = selectedObject.transform.rotationX;
    document.getElementById('rotationY').value = selectedObject.transform.rotationY;
    document.getElementById('scale').value = selectedObject.transform.scale;
    document.getElementById('translateX').value = selectedObject.transform.translateX;
    document.getElementById('translateY').value = selectedObject.transform.translateY;

    redrawCanvas();
});

function initializeNewObject3D() {
    let newObject3D = {
        id: objects3D.length,
        polygon: {
            vertices: [],
        },
        revolutionPoints: new Map(),
        faces: new Map(),
        faceIntersections: new Map(),
        minY: Infinity,
        maxY: 0,
        closed: false,
        centroid: { x: 0, y: 0, z: 0 },
        transform: { rotationX: 0, rotationY: 0, scale: 1, translateX: 0, translateY: 0, translateZ: 0 }
    };
    objects3D.push(newObject3D);
}

function calculateCentroid(vertices) {
    let somaX = 0, somaY = 0, somaZ = 0;
    let totalVertices = vertices.length;
    vertices.forEach(ponto => {
        somaX += ponto.x;
        somaY += ponto.y;
        somaZ += ponto.z;
    });
    return {
        x: somaX / totalVertices,
        y: somaY / totalVertices,
        z: somaZ / totalVertices
    };
}

function drawAxes() {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = "#000000";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

canvas.addEventListener('click', function(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = rect.bottom - event.clientY;
    var z = 0;
    x -= canvas.width / 2;
    y -= canvas.height / 2;
    var object3D = objects3D[objects3D.length - 1];
    if (object3D.closed) {
        object3D.centroid = calculateCentroid(object3D.polygon.vertices);
        objects3D.push({
            id: objects3D.length,
            polygon: {
                vertices: [],
            },
            revolutionPoints: new Map(),
            faces: new Map(),
            faceIntersections: new Map(),
            minY: Infinity,
            maxY: 0,
            closed: false,
            centroid: { x: 0, y: 0, z: 0 },
            transform: { rotationX: 0, rotationY: 0, scale: 1, translateX: 0, translateY: 0, translateZ: 0 }
        });
        object3D = objects3D[objects3D.length - 1];
        
        drawAxes();
    }
    var ponto = { x: x, y: y, z: z };
    if (object3D.polygon.vertices.length >= 3) {
        var distancia = Math.sqrt(Math.pow(object3D.polygon.vertices[0].x - x, 2) + Math.pow(object3D.polygon.vertices[0].y - y, 2));
        if (distancia <= raio) {
            ctx.beginPath();
            ctx.moveTo(object3D.polygon.vertices[0].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[0].y);
            ctx.lineTo(object3D.polygon.vertices[object3D.polygon.vertices.length - 1].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[object3D.polygon.vertices.length - 1].y);
            ctx.stroke();
            object3D.closed = true;
            updateObjectSelector();
            object3D.minY = Infinity;
            object3D.maxY = -Infinity;
            object3D.polygon.vertices.forEach(ponto => {
                if (ponto.y < object3D.minY) {
                    object3D.minY = ponto.y;
                }
                if (ponto.y > object3D.maxY) {
                    object3D.maxY = ponto.y;
                }
            });
            return;
        }
    }
    object3D.polygon.vertices.push(ponto);
    if (object3D.polygon.vertices.length > 1) {
        ctx.beginPath();
        ctx.moveTo(object3D.polygon.vertices[object3D.polygon.vertices.length - 2].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[object3D.polygon.vertices.length - 2].y);
        ctx.lineTo(x + canvas.width / 2, canvas.height / 2 - y);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 0, 0)`;
    object3D.polygon.vertices.forEach(ponto => {
        drawPoint(ponto.x + canvas.width / 2, canvas.height / 2 - ponto.y);
    });
});

function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2, true);
    ctx.fill();
}

document.getElementById('resetButton').addEventListener('click', resetCanvas);
function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    objects3D = [{
        id: 0,
        polygon: {
            vertices: [],
        },
        revolutionPoints: new Map(),
        faces: new Map(),
        faceIntersections: new Map(),
        minY: Infinity,
        maxY: 0,
        closed: false,
        centroid: { x: 0, y: 0, z: 0 },
        transform: { rotationX: 0, rotationY: 0, scale: 1, translateX: 0, translateY: 0, translateZ: 0 }
    }];
    updateObjectSelector();
}

document.getElementById('scale').addEventListener('input', function(event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.scale = parseFloat(event.target.value);
    redrawCanvas();
});

document.getElementById('rotationY').addEventListener('input', function(event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.rotationY = parseFloat(event.target.value);
    redrawCanvas();
});

document.getElementById('rotationX').addEventListener('input', function(event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.rotationX = parseFloat(event.target.value);
    redrawCanvas();
});

document.getElementById('translateX').addEventListener('input', function(event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.translateX = parseFloat(event.target.value);
    redrawCanvas();
});

document.getElementById('translateY').addEventListener('input', function(event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.translateY = parseFloat(event.target.value);
    redrawCanvas();
});

function rotatePoint(point, angleX, angleY, origin) {
    let radX = angleX * Math.PI / 180;
    let radY = angleY * Math.PI / 180;

    let cosX = Math.cos(radX);
    let sinX = Math.sin(radX);
    let cosY = Math.cos(radY);
    let sinY = Math.sin(radY);

    let rotatedX = point.x * cosY + point.z * sinY;
    let rotatedZ = -point.x * sinY + point.z * cosY;

    let x = rotatedX - origin.x;
    let y = point.y - origin.y;
    let z = rotatedZ - origin.z;

    let newY = y * cosX - z * sinX;
    let newZ = y * sinX + z * cosX;

    return {
        x: x + origin.x,
        y: newY + origin.y,
        z: newZ + origin.z
    };
}

var VRP = { x: 0, y: 0, z: 300 };
let vetorN = {
    x: objects3D[0].centroid.x - VRP.x,
    y: objects3D[0].centroid.y - VRP.y,
    z: objects3D[0].centroid.z - VRP.z
};
var vetorY = { x: 0, y: 1, z: 0 };

function normalize(vec) {
    let length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length > 0) {
        return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
    }
    return { x: 0, y: 0, z: 0 };
}

function scalarMultiply(vec, scalar) {
    return { x: vec.x * scalar, y: vec.y * scalar, z: vec.z * scalar };
}

function subtractVectors(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function sruSrc(VRP, vetorN, vetorY) {
    let n = normalize(vetorN);
    let dot = dotProduct(vetorY, n);
    let projection = scalarMultiply(n, dot);
    let v = normalize(subtractVectors(vetorY, projection));
    let u = crossProduct(v, n);
    let newVRP = {
        x: -VRP.x,
        y: -VRP.y,
        z: -VRP.z
    };
    let Msrusrc = [
        [u.x, u.y, u.z, dotProduct(u, newVRP)],
        [v.x, v.y, v.z, dotProduct(v, newVRP)],
        [n.x, n.y, n.z, dotProduct(n, newVRP)],
        [0, 0, 0, 1]
    ];
    return Msrusrc;
}

function perspective() {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 1]
    ];
}

function multiplyMatrix(a, b) {
    let result = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return result;
}

function multiplyMatrix4x1(a, b) {
    let result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += a[i][j] * b[j];
        }
    }
    return result;
}

function createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax) {
    let Sx = (Umax - Umin) / (Xmax - Xmin);
    let Sy = (Vmax - Vmin) / (Ymax - Ymin);
    let Tx = (Umin * Xmax - Umax * Xmin) / (Xmax - Xmin);
    let Ty = (Vmin * Ymax - Vmax * Ymin) / (Ymax - Ymin);
    let Mjp = [
        [Sx, 0, 0,Tx],
        [0, Sy, 0,Ty],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
    return Mjp;
}

function transformAndDraw(object3D, Msrusrc, Mpers) {
  // Criamos a matriz de projeção perspectiva
  var Mjp = createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax);

  object3D.faces.forEach((face, index) => {
    const screenCoordinates = face.map((point) => {
      const point4x1 = [point.x, point.y, point.z, 1];
      // Multiplicamos as matrizes de transformação
      var M = multiplyMatrix(Mjp, Msrusrc); // Inverte a ordem de aplicação das transformações
      M = multiplyMatrix(M, Mpers);
      M = multiplyMatrix4x1(M, point4x1);

      var asudh = viewportTransform(M); //{ screenX: M[0], screenY: M[1] }
      return asudh;
    });

    drawPolygon(screenCoordinates);
    ctx.beginPath();
    ctx.arc(VRP.x, VRP.y, raio, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 0, 0, 1)";
    ctx.fill();
  });
}

function drawPolygon(coordinates) {
  if (coordinates.length < 2) return; // Não há o que desenhar com menos de dois pontos

  ctx.beginPath();
  ctx.moveTo(coordinates[0].screenX, coordinates[0].screenY);
  for (let i = 1; i < coordinates.length; i++) {
    ctx.lineTo(coordinates[i].screenX, coordinates[i].screenY);
  }
  ctx.closePath();
  ctx.strokeStyle = "rgba(0, 255, 0, 0.75)";
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
  ctx.fill();
}


function drawPoints(coordinates) {
    coordinates.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, raio, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.fill();
    });
}

document.getElementById("3dButton").addEventListener("click", () => {
  const slices = parseInt(document.getElementById("slices").value);

  const canvasWidth = window.innerWidth - ajustWidth;
  const canvasHeight = window.innerHeight;

  // Ajusta o tamanho do canvas
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Restante do código para criar matrizes e chamar transformAndDraw
  const Msrusrc = lookAt(VRP, VPN, VUP);
  const Mpers = perspective(); //Math.PI / 2, canvas.width / canvas.height, 1, 100

  objects3D.forEach((object3D) => {
    if (object3D.closed && object3D.polygon.vertices.length >= 2) {
      createSlices(object3D, slices);
      transformAndDraw(object3D, Msrusrc, Mpers); //, canvasWidth, canvasHeight
    }
  });
});

document.getElementById("3dCube").addEventListener("click", function () {
  var cubePoints = [
    { x: 60, y: 60, z: 0 },
    { x: 30, y: 60, z: 0 },
    { x: 30, y: 30, z: 0 },
    { x: 60, y: 30, z: 0 },
    { x: 60, y: 60, z: 0 },
    { x: 30, y: 60, z: 0 },
    { x: 30, y: 30, z: 0 },
    { x: 60, y: 30, z: 0 },
  ];

  // Cria um novo objeto3D e adiciona à lista
  objects3D.push({
    id: objects3D.length,
    polygon: {
      vertices: cubePoints,
    },
    revolutionPoints: new Map(),
    faces: new Map(),
    faceIntersections: new Map(),
    minY: Infinity,
    maxY: 0,
    closed: true,
  });

  // Obtém o objeto3D atual
  var object3D = objects3D[objects3D.length - 1];

  drawAxes();

  const slices = parseInt(document.getElementById("slices").value); // Pega o número atual de slices do input

  // Ajusta o tamanho do canvas
  canvas.width = window.innerWidth - ajustWidth;
  canvas.height = window.innerHeight;

  // Criação das matrizes de visualização e projeção
  const Msrusrc = lookAt(VRP, VPN, VUP);
  const Mpers = perspective(); //Math.PI / 2, canvas.width / canvas.height, 1, 100

  if (object3D.closed && object3D.polygon.vertices.length >= 2) {
    createSlices(object3D, slices);
    transformAndDraw(object3D, Msrusrc, Mpers); //, canvasWidth, canvasHeight
  }
});

function viewportTransform(point) {
  // Escala e translação
  // const scaleX = (Umax - Umin) / 2;
  // const scaleY = (Vmax - Vmin) / 2;
  const translateX = (Umax + Umin) / 2;
  const translateY = (Vmax + Vmin) / 2;

  //console.log("scaleX", scaleX, "scaleY", scaleY);
  //console.log("translateX", translateX, "translateY", translateY);
  return {
    screenX: point[0] + translateX,
    screenY: -point[1] + translateY, // Inverte Y para correspondência de coordenadas do canvas
  };
}
