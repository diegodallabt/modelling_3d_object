import {
  normalize,
  scalarMultiply,
  subtractVectors,
  crossProduct,
  dotProduct,
  multiplyMatrix,
  multiplyMatrix4x1,
  calculateFaceNormal,
  isFaceVisible,
  calculateFaceCentroid,
  calculateVertexNormal,
  verticesEqual,
  calculateAverageDepth,
  calculateCentroid
} from './utils/operations.js';

import {
  rotatePoint,
  scalePoint
} from './utils/transformation.js';

import {
  parallel,
  perspective,
  sruSrc,
  createMjp
} from './utils/projections.js';

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var raio = 5;

var ajustWidth = 300;
let ajustHeight = 100;
var Xmin = 0,
  Xmax = 600,
  Ymin = 0,
  Ymax = 600;
var Umin = 0,
  Umax = window.innerWidth - ajustWidth,
  Vmin = 0,
  Vmax = window.innerHeight - ajustHeight;


var VRP = { x: 0, y: 0, z: 600 };
let vetorN = {
  x: VRP.x,
  y: VRP.y,
  z: VRP.z,
};
var vetorY = { x: 0, y: 1, z: 0 };

document.getElementById('Xmin').value = Xmin;
document.getElementById('Xmax').value = Xmax;
document.getElementById('Ymin').value = Ymin;
document.getElementById('Ymax').value = Ymax;
document.getElementById('Umin').value = Umin;
document.getElementById('Vmin').value = Vmin;
document.getElementById('Umax').value = Umax;
document.getElementById('Vmax').value = Vmax;
document.getElementById('dp').value = 600;

canvas.width = 600;
canvas.height = 600;

let rotationX = 0;
let rotationY = 0;
let rotationZ = 0;

let scaleFactor = 1;

let translateX = 0;
let translateY = 0;
let translateZ = 0;

let Msrusrc = sruSrc(VRP, vetorN, vetorY);

let zBuffer = new Array(Umax).fill(0).map(() => new Array(Vmax).fill(Infinity));
let colorBuffer = new Array(Umax)
  .fill(0)
  .map(() => new Array(Vmax).fill({ r: 255, g: 255, b: 255 }));

let light = {
  position: { x: 0, y: 0, z: 900 },
  intensity: { r: 30, g: 40, b: 150 },
};

document.getElementById('luzX').value = light.position.x;
document.getElementById('luzY').value = light.position.y;
document.getElementById('luzZ').value = light.position.z;
document.getElementById('luzIntensR').value = light.intensity.r;
document.getElementById('luzIntensG').value = light.intensity.g;
document.getElementById('luzIntensB').value = light.intensity.b;

let objects3D = [
  {
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
    transform: {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      translateZ: 0,
    },
    material: {
      Ka: { r: 0.1, g: 0.1, b: 0.1 },
      Kd: { r: 0.7, g: 0.7, b: 0.7 },
      Ks: { r: 0.5, g: 0.5, b: 0.5 },
      shininess: 3,
    },
  },
];

let selectedObjectId = 0;
let selectedShading = document.getElementById('shading').value || 'gouraud';
document.getElementById('shading').addEventListener('change', function(event) {
    selectedShading = event.target.value;
});

let Mproj =  perspective(600);
let Mjp = createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax);

let selectedProjection = document.getElementById('projection').value || 'perspective';
document.getElementById('projection').addEventListener('change', function(event) {
  if(event.target.value === 'perspective'){
    Mproj = perspective();
  } else {
    Mproj = parallel();
  }
  redrawCanvas();
});

initializeNewObject3D();
drawAxes();

function updateVariables() {
  Xmin = parseInt(document.getElementById('Xmin').value);
  Xmax = parseInt(document.getElementById('Xmax').value);
  Ymin = parseInt(document.getElementById('Ymin').value);
  Ymax = parseInt(document.getElementById('Ymax').value);
  Umin = parseInt(document.getElementById('Umin').value);
  Vmin = parseInt(document.getElementById('Vmin').value);
  var ajusteUmax = parseInt(document.getElementById('Umax').value) - ajustWidth;
  var ajusteVmax = parseInt(document.getElementById('Vmax').value) - ajustHeight;
  Umax = ajusteUmax;
  Vmax = ajusteVmax;

  canvas.width = Umax;
  canvas.height = Vmax;

  VRP.x = parseInt(document.getElementById('vrpX').value);
  VRP.y = parseInt(document.getElementById('vrpY').value);
  VRP.z = parseInt(document.getElementById('vrpZ').value);

  vetorN.x = parseInt(document.getElementById('focalX').value) - VRP.x;
  vetorN.y = parseInt(document.getElementById('focalY').value) - VRP.y;
  vetorN.z = parseInt(document.getElementById('focalZ').value) - VRP.z;

  Msrusrc = sruSrc(VRP, vetorN, vetorY);
  Mjp = createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAxes();
  redrawCanvas();
}

document.getElementById('shading').addEventListener('change', function (event) {
  selectedShading = event.target.value;
  redrawCanvas();
});

const controls = document.querySelectorAll(
  '#translateX, #translateY, #translateZ, #rotationY, #rotationX, #rotationZ, #scale'
);

window.addEventListener('DOMContentLoaded', function () {
  toggleControls(false);
});

// Função para habilitar/desabilitar os controles
function toggleControls(enable) {
  controls.forEach((control) => {
    control.disabled = !enable;
  });
}

document.getElementById('vrpX').addEventListener('input', updateVRP);
document.getElementById('vrpY').addEventListener('input', updateVRP);
document.getElementById('vrpZ').addEventListener('input', updateVRP);
document.getElementById('focalX').addEventListener('input', updateVRP);
document.getElementById('focalY').addEventListener('input', updateVRP);
document.getElementById('focalZ').addEventListener('input', updateVRP);

function updateVRP() {
  VRP.x = parseInt(document.getElementById('vrpX').value);
  VRP.y = parseInt(document.getElementById('vrpY').value);
  VRP.z = parseInt(document.getElementById('vrpZ').value);

  vetorN.x = parseInt(document.getElementById('focalX').value) - VRP.x;
  vetorN.y = parseInt(document.getElementById('focalY').value) - VRP.y;
  vetorN.z = parseInt(document.getElementById('focalZ').value) - VRP.z;

  Msrusrc = sruSrc(VRP, vetorN, vetorY);

  redrawCanvas();
}

function updateObjectSelector() {
  const selector = document.getElementById('objectSelector');
  selector.innerHTML = '';
  objects3D.forEach((obj) => {
    const option = document.createElement('option');
    option.value = obj.id;
    if (obj.id == 0) {
      return;
    }
    option.textContent = `Objeto ${obj.id}`;
    selector.appendChild(option);
  });
  selector.value = selectedObjectId;
}

document
  .getElementById('objectSelector')
  .addEventListener('change', function (event) {
    selectedObjectId = parseInt(event.target.value);

    toggleControls(selectedObjectId !== 0);

    let selectedObject = objects3D[selectedObjectId];
    document.getElementById('rotationX').value =
      selectedObject.transform.rotationX;
    document.getElementById('rotationY').value =
      selectedObject.transform.rotationY;
    document.getElementById('rotationZ').value =
      selectedObject.transform.rotationZ;
    document.getElementById('scale').value = selectedObject.transform.scale;
    document.getElementById('translateX').value =
      selectedObject.transform.translateX;
    document.getElementById('translateY').value =
      selectedObject.transform.translateY;
    document.getElementById('translateZ').value =
      selectedObject.transform.translateZ;

    document.getElementById('KaR').value = selectedObject.material.Ka.r;
    document.getElementById('KaG').value = selectedObject.material.Ka.g;
    document.getElementById('KaB').value = selectedObject.material.Ka.b;

    document.getElementById('KdR').value = selectedObject.material.Kd.r;
    document.getElementById('KdG').value = selectedObject.material.Kd.g;
    document.getElementById('KdB').value = selectedObject.material.Kd.b;

    document.getElementById('KsR').value = selectedObject.material.Ks.r;
    document.getElementById('KsG').value = selectedObject.material.Ks.g;
    document.getElementById('KsB').value = selectedObject.material.Ks.b;

    document.getElementById('shininess').value = selectedObject.material.shininess;

    redrawCanvas();
  });

  document.getElementById('3dButton').addEventListener('click', () => {
    const currentObject = objects3D[objects3D.length - 1];
    if (!currentObject.closed) {
      alert('Conecte os pontos para gerar o objeto 3D!');
      return;
    }
  
    const slices = parseInt(document.getElementById('slices').value);
  
    updateVariables();
    
    objects3D.sort((a, b) => {
      return b.centroid - a.centroid;
    });
  
    objects3D.forEach((object3D) => {
      if (object3D.closed && object3D.polygon.vertices.length >= 2) {
        createRevolution(object3D, slices);
        transformAndDraw(object3D);
      }
    });
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
    transform: {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      translateZ: 0,
    },
    material: {
      Ka: { r: 0.1, g: 0.1, b: 0.1 },
      Kd: { r: 0.7, g: 0.7, b: 0.7 },
      Ks: { r: 0.5, g: 0.5, b: 0.5 },
      shininess: 3,
    },
  };
  objects3D.push(newObject3D);
}

function drawAxes() {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.strokeStyle = '#272727';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
}

canvas.addEventListener('click', function (event) {
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
      transform: {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        translateX: 0,
        translateY: 0,
        translateZ: 0,
      },
      material: {
        Ka: { r: 0.1, g: 0.1, b: 0.1 },
        Kd: { r: 0.7, g: 0.7, b: 0.7 },
        Ks: { r: 0.5, g: 0.5, b: 0.5 },
        shininess: 3,
      },
    });
    object3D = objects3D[objects3D.length - 1];

    drawAxes();
  }
  var ponto = { x: x, y: y, z: z };
  if (object3D.polygon.vertices.length >= 3) {
    var distancia = Math.sqrt(
      Math.pow(object3D.polygon.vertices[0].x - x, 2) +
        Math.pow(object3D.polygon.vertices[0].y - y, 2)
    );
    if (distancia <= raio) {
      ctx.beginPath();
      ctx.moveTo(
        object3D.polygon.vertices[0].x + canvas.width / 2,
        canvas.height / 2 - object3D.polygon.vertices[0].y
      );
      ctx.lineTo(
        object3D.polygon.vertices[object3D.polygon.vertices.length - 1].x +
          canvas.width / 2,
        canvas.height / 2 -
          object3D.polygon.vertices[object3D.polygon.vertices.length - 1].y
      );
      ctx.stroke();
      object3D.closed = true;
      updateObjectSelector();
      object3D.minY = Infinity;
      object3D.maxY = -Infinity;
      object3D.polygon.vertices.forEach((ponto) => {
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
    ctx.moveTo(
      object3D.polygon.vertices[object3D.polygon.vertices.length - 2].x +
        canvas.width / 2,
      canvas.height / 2 -
        object3D.polygon.vertices[object3D.polygon.vertices.length - 2].y
    );
    ctx.lineTo(x + canvas.width / 2, canvas.height / 2 - y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = `rgba(0, 0, 0)`;
  object3D.polygon.vertices.forEach((ponto) => {
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
  location.reload();
}

document.getElementById('dp').addEventListener('input', function (event) {
  Mproj = perspective(event.target.value);
  redrawCanvas();
});

function updateMaterial(event) {
  let selectedObject = objects3D[selectedObjectId];
  let target = event.target;

  switch (target.id) {
    case 'KaR':
      selectedObject.material.Ka.r = parseFloat(target.value);
      break;
    case 'KaG':
      selectedObject.material.Ka.g = parseFloat(target.value);
      break;
    case 'KaB':
      selectedObject.material.Ka.b = parseFloat(target.value);
      break;
    case 'KdR':
      selectedObject.material.Kd.r = parseFloat(target.value);
      break;
    case 'KdG':
      selectedObject.material.Kd.g = parseFloat(target.value);
      break;
    case 'KdB':
      selectedObject.material.Kd.b = parseFloat(target.value);
      break;
    case 'KsR':
      selectedObject.material.Ks.r = parseFloat(target.value);
      break;
    case 'KsG':
      selectedObject.material.Ks.g = parseFloat(target.value);
      break;
    case 'KsB':
      selectedObject.material.Ks.b = parseFloat(target.value);
      break;
    case 'shininess':
      selectedObject.material.shininess = parseFloat(target.value);
      break;
  }
  redrawCanvas();
}

function updateLight(event) {
  let target = event.target;

  switch (target.id) {
    case 'luzX':
      light.position.x = parseFloat(target.value);
      break;
    case 'luzY':
      light.position.y = parseFloat(target.value);
      break;
    case 'luzZ':
      light.position.z = parseFloat(target.value);
      break;
    case 'luzIntensR':
      light.intensity.r = parseFloat(target.value);
      break;
    case 'luzIntensG':
      light.intensity.g = parseFloat(target.value);
      break;
    case 'luzIntensB':
      light.intensity.b = parseFloat(target.value);
      break;
  }
  redrawCanvas();
}

document.getElementById('KaR').addEventListener('input', updateMaterial);
document.getElementById('KaG').addEventListener('input', updateMaterial);
document.getElementById('KaB').addEventListener('input', updateMaterial);
document.getElementById('KdR').addEventListener('input', updateMaterial);
document.getElementById('KdG').addEventListener('input', updateMaterial);
document.getElementById('KdB').addEventListener('input', updateMaterial);
document.getElementById('KsR').addEventListener('input', updateMaterial);
document.getElementById('KsG').addEventListener('input', updateMaterial);
document.getElementById('KsB').addEventListener('input', updateMaterial);
document.getElementById('shininess').addEventListener('input', updateMaterial);

document.getElementById('luzX').addEventListener('input', updateLight);
document.getElementById('luzY').addEventListener('input', updateLight);
document.getElementById('luzZ').addEventListener('input', updateLight);
document.getElementById('luzIntensR').addEventListener('input', updateLight);
document.getElementById('luzIntensG').addEventListener('input', updateLight);
document.getElementById('luzIntensB').addEventListener('input', updateLight);


document.getElementById('scale').addEventListener('input', function (event) {
  let selectedObject = objects3D[selectedObjectId];
  selectedObject.transform.scale = parseFloat(event.target.value);
  redrawCanvas();
});

document
  .getElementById('rotationY')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.rotationY = parseFloat(event.target.value);
    redrawCanvas();
  });

document
  .getElementById('rotationX')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.rotationX = parseFloat(event.target.value);
    redrawCanvas();
  });

document
  .getElementById('rotationZ')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.rotationZ = parseFloat(event.target.value);
    redrawCanvas();
  });

document
  .getElementById('translateX')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.translateX = parseFloat(event.target.value);
    redrawCanvas();
  });

document
  .getElementById('translateY')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.translateY = parseFloat(event.target.value);
    redrawCanvas();
  });

document
  .getElementById('translateZ')
  .addEventListener('input', function (event) {
    let selectedObject = objects3D[selectedObjectId];
    selectedObject.transform.translateZ = parseFloat(event.target.value);
    redrawCanvas();
  });

function transformAndDraw(object3D) {
  const centroid = calculateCentroid(object3D.polygon.vertices);
  const transform = object3D.transform;

  let facesWithDepth = [];
  let visibleFaces = [];

  object3D.faces.forEach((faces, index) => {
    faces.forEach((face) => {
      const transformedFace = face.map((point) => {
        let rotated = rotatePoint(point, transform.rotationX, transform.rotationY,  transform.rotationZ, centroid);

        rotated = scalePoint(rotated, transform.scale, centroid);

        rotated.x += transform.translateX;
        rotated.y += transform.translateY;
        rotated.z += transform.translateZ;

        return rotated;
      });

      if (isFaceVisible(transformedFace, VRP)) {
          if (selectedShading === 'flat') {
            const averageDepth = calculateAverageDepth(transformedFace);
            const color = calculateFlatShading(transformedFace, light, object3D.material);
            facesWithDepth.push({ transformedFace, averageDepth, color });
          }
        visibleFaces.push(transformedFace);
      }
    });
  });

  visibleFaces.forEach((face) => {
    if (selectedShading === 'gouraud' || selectedShading === 'phong') {
      const vertexNormals = face.map((vertex) =>
        calculateVertexNormal(vertex, visibleFaces)
      );
      const vertexColors = face.map((vertex, i) =>
        calculateVertexIntensity(
          vertex,
          vertexNormals[i],
          light,
          object3D.material
        )
      );

      const transformedFaceWithColors = face.map((vertex, i) => ({
        ...vertex,
        color: vertexColors[i],
      }));

      const averageDepth = calculateAverageDepth(transformedFaceWithColors);
      facesWithDepth.push({
        transformedFace: transformedFaceWithColors,
        averageDepth,
      });
    } else {
      const averageDepth = calculateAverageDepth(face);
      const color = calculateFlatShading(face, light, object3D.material);
      facesWithDepth.push({ transformedFace: face, averageDepth, color });
    }
  });
  
  // facesWithDepth.sort((a, b) => b.averageDepth - a.averageDepth);

  facesWithDepth.forEach(({ transformedFace, color }) => {
    const screenCoordinates = transformedFace.map((rotated) => {
      const newPoint = [rotated.x, rotated.y, rotated.z, 1];
      var M = multiplyMatrix(Mjp, Mproj);
      M = multiplyMatrix(M, Msrusrc);
      M = multiplyMatrix4x1(M, newPoint);
      var viewObject = centerObject(M);
      if (selectedShading === 'phong') {
        return {
          ...viewObject,
          normal: calculateVertexNormal(rotated, visibleFaces), // Adicionar normal calculada
        };
      } else if (selectedShading === 'gouraud') {
        return {
          ...viewObject,
          color: rotated.color,
        };
      } else {
        return centerObject(M);
      }
      
    });

    if (selectedShading === 'phong')
      rasterPhong(screenCoordinates, light, object3D.material);
    else if (selectedShading === 'gouraud') rasterGouraud(screenCoordinates);
    else if (selectedShading === 'flat') rasterFlat(screenCoordinates, color);
    else drawPolygon(screenCoordinates, color);
    
  });

  if(selectedShading === 'phong' || selectedShading === 'gouraud' || selectedShading === 'flat') paint();
}

function paint() {
  const imageData = ctx.createImageData(Umax, Vmax);
  const data = imageData.data;

  for (let y = 0; y < Vmax; y++) {
    for (let x = 0; x < Umax; x++) {
      const index = (y * Umax + x) * 4;
      const pixelColor = colorBuffer[x][y];
      data[index] = pixelColor.r;
      data[index + 1] = pixelColor.g;
      data[index + 2] = pixelColor.b;
      data[index + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Limpa o colorBuffer e zBuffer
  for (let i = 0; i < Umax; i++) {
    for (let j = 0; j < Vmax; j++) {
      colorBuffer[i][j] = { r: 255, g: 255, b: 255 };
      zBuffer[i][j] = Infinity;
    }
  }

  objects3D.forEach((object3D) => {
    if (object3D.closed && object3D.polygon.vertices.length >= 2) {
      transformAndDraw(object3D);
    }
  });
}

function drawPolygon(coordinates, color) {
  if (coordinates.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(coordinates[0].screenX, coordinates[0].screenY);

  for (let i = 1; i < coordinates.length; i++) {
      ctx.lineTo(coordinates[i].screenX, coordinates[i].screenY);
  }

  ctx.closePath();
  ctx.strokeStyle = `rgba(0, 255, 0, 1)`;
  ctx.stroke();
}

function createRevolution(object3D, slices) {
  const vertices = object3D.polygon.vertices;
  const angleStep = (2 * Math.PI) / slices;
  for (let i = 0; i < slices; i++) {
    const angle = i * angleStep;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const revolutionVertices = vertices.map((vertex) => ({
      x: vertex.x * cosAngle,
      y: vertex.y,
      z: vertex.x * sinAngle,
    }));
    object3D.revolutionPoints.set(i, revolutionVertices);
  }
  createFaces(object3D, slices);
}

function createFaces(object3D, slices) {
  for (let i = 0; i < slices; i++) {
    const nextIndex = (i + 1) % slices;
    const currentPoints = object3D.revolutionPoints.get(i);
    const nextPoints = object3D.revolutionPoints.get(nextIndex);
    for (let j = 0; j < currentPoints.length - 1; j++) {
      const face = [
        currentPoints[j],
        nextPoints[j],
        nextPoints[j + 1],
        currentPoints[j + 1],
      ];
      
        // if (!object3D.faces.has(i)) {
        //   object3D.faces.set(i, []);
        // }
        // object3D.faces.get(i).push(face);
       
       const triangle1 = [face[0], face[1], face[2]];
       const triangle2 = [face[0], face[2], face[3]];
 
       if (!object3D.faces.has(i)) {
         object3D.faces.set(i, []);
       }
       object3D.faces.get(i).push(triangle1, triangle2);
      
    }
  }
}

function centerObject(point) {
  const translateX = (Umax + Umin) / 2;
  const translateY = (Vmax + Vmin) / 2;
  return {
    screenX: point[0] + translateX,
    screenY: -point[1] + translateY,
    screenZ: point[2],
  };
}

function rasterPhong(polygon, light, material) {
  polygon.sort((a, b) => a.screenY - b.screenY);

  const minY = Math.ceil(polygon[0].screenY);
  const maxY = Math.floor(polygon[polygon.length - 1].screenY);

  for (let y = minY; y <= maxY; y++) {
      const intersections = [];

      for (let i = 0; i < polygon.length; i++) {
      const start = polygon[i];
      const end = polygon[(i + 1) % polygon.length];

      if (
          (start.screenY <= y && end.screenY > y) ||
          (start.screenY > y && end.screenY <= y)
      ) {
          const t = (y - start.screenY) / (end.screenY - start.screenY);
          const x = start.screenX + t * (end.screenX - start.screenX);
          const z = start.screenZ + t * (end.screenZ - start.screenZ);

          // Interpolação das normais dos vértices
          const normalX = start.normal.x + t * (end.normal.x - start.normal.x);
          const normalY = start.normal.y + t * (end.normal.y - start.normal.y);
          const normalZ = start.normal.z + t * (end.normal.z - start.normal.z);

          intersections.push({
          x,
          z,
          normal: { x: normalX, y: normalY, z: normalZ },
          });
      }
      }

      intersections.sort((a, b) => a.x - b.x);

      for (let i = 0; i < intersections.length; i += 2) {
      const xStart = Math.ceil(intersections[i].x);
      const zStart = intersections[i].z;
      const normalStart = intersections[i].normal;
      const xEnd = Math.floor(intersections[i + 1].x);
      const zEnd = intersections[i + 1].z;
      const normalEnd = intersections[i + 1].normal;

      const deltaX = xEnd - xStart;
      const deltaZ = (zEnd - zStart) / deltaX;

      // Interpolação incremental das normais
      const deltaNormalX = (normalEnd.x - normalStart.x) / deltaX;
      const deltaNormalY = (normalEnd.y - normalStart.y) / deltaX;
      const deltaNormalZ = (normalEnd.z - normalStart.z) / deltaX;

      let z = zStart;
      let normal = { ...normalStart };

      for (let x = xStart; x <= xEnd; x++) {
          if (x >= 0 && x < Umax && y >= 0 && y < Vmax && z < zBuffer[x][y]) {
          zBuffer[x][y] = z;
          // Calcula a intensidade do pixel usando a normal interpolada
          const color = calculatePixelIntensity(
              { x, y, z },
              normal,
              light,
              material
          );
          colorBuffer[x][y] = color;
          }
          z += deltaZ;
          normal.x += deltaNormalX;
          normal.y += deltaNormalY;
          normal.z += deltaNormalZ;
      }
      }
  }
}

function rasterGouraud(polygon) {
polygon.sort((a, b) => a.screenY - b.screenY);

const minY = Math.ceil(polygon[0].screenY);
const maxY = Math.floor(polygon[polygon.length - 1].screenY);

for (let y = minY; y <= maxY; y++) {
  const intersections = [];

  for (let i = 0; i < polygon.length; i++) {
  const start = polygon[i];
  const end = polygon[(i + 1) % polygon.length];

  if (
      (start.screenY <= y && end.screenY > y) ||
      (start.screenY > y && end.screenY <= y)
  ) {
      const t = (y - start.screenY) / (end.screenY - start.screenY);
      const x = start.screenX + t * (end.screenX - start.screenX);
      const z = start.screenZ + t * (end.screenZ - start.screenZ);
      const r = start.color.r + t * (end.color.r - start.color.r);
      const g = start.color.g + t * (end.color.g - start.color.g);
      const b = start.color.b + t * (end.color.b - start.color.b);
      intersections.push({ x, z, color: { r, g, b } });
  }
  }

  intersections.sort((a, b) => a.x - b.x);

  for (let i = 0; i < intersections.length; i += 2) {
  const xStart = Math.ceil(intersections[i].x);
  const zStart = intersections[i].z;
  const colorStart = intersections[i].color;
  const xEnd = Math.floor(intersections[i + 1].x);
  const zEnd = intersections[i + 1].z;
  const colorEnd = intersections[i + 1].color;

  const deltaX = xEnd - xStart;
  const deltaZ = (zEnd - zStart) / deltaX;
  const deltaR = (colorEnd.r - colorStart.r) / deltaX;
  const deltaG = (colorEnd.g - colorStart.g) / deltaX;
  const deltaB = (colorEnd.b - colorStart.b) / deltaX;

  let z = zStart;
  let r = colorStart.r;
  let g = colorStart.g;
  let b = colorStart.b;

  for (let x = xStart; x <= xEnd; x++) {
      if (x >= 0 && x < Umax && y >= 0 && y < Vmax && z < zBuffer[x][y]) {
      zBuffer[x][y] = z;
      colorBuffer[x][y] = {
          r: Math.round(r),
          g: Math.round(g),
          b: Math.round(b),
      };
      }
      z += deltaZ;
      r += deltaR;
      g += deltaG;
      b += deltaB;
  }
  }
}
}

function rasterFlat(triangle, color) {
  triangle.sort((a, b) => a.screenY - b.screenY);

  const minY = Math.ceil(triangle[0].screenY);
  const maxY = Math.floor(triangle[triangle.length - 1].screenY);

  for (let y = minY; y <= maxY; y++) {
      const intersections = [];

      for (let i = 0; i < triangle.length; i++) {
      const start = triangle[i];
      const end = triangle[(i + 1) % triangle.length];

      if (
          (start.screenY <= y && end.screenY > y) ||
          (start.screenY > y && end.screenY <= y)
      ) {
          const t = (y - start.screenY) / (end.screenY - start.screenY);
          const x = start.screenX + t * (end.screenX - start.screenX);
          const z = start.screenZ + t * (end.screenZ - start.screenZ);
          intersections.push({ x, z });
      }
      }

      intersections.sort((a, b) => a.x - b.x);

      for (let i = 0; i < intersections.length; i += 2) {
      const xStart = Math.ceil(intersections[i].x);
      const zStart = intersections[i].z;
      const xEnd = Math.floor(intersections[i + 1].x);
      const zEnd = intersections[i + 1].z;

      const deltaX = xEnd - xStart;
      const deltaZ = (zEnd - zStart) / deltaX;

      let z = zStart;

      for (let x = xStart; x <= xEnd; x++) {
          if (x >= 0 && x < Umax && y >= 0 && y < Vmax && z < zBuffer[x][y]) {
          zBuffer[x][y] = z;
          colorBuffer[x][y] = { r: color.r, g: color.g, b: color.b };
          }
          z += deltaZ;
      }
      }
  }
}

function calculateFlatShading(face, light, material) {
  const centroid = calculateCentroid(face);

  // Vetor normal da face
  let N = calculateFaceNormal(face);
  let normal = normalize(N);

  // Vetor L (direção da luz)
  let L = {
    x: light.position.x - centroid.x,
    y: light.position.y - centroid.y,
    z: light.position.z - centroid.z,
  };

  // Normaliza o vetor L
  L = normalize(L);

  // Produto escalar entre a normal e o vetor L
  let dotProductLN = dotProduct(normal, L);

  // Vetor V (direção do observador)
  let V = {
    x: VRP.x - centroid.x,
    y: VRP.y - centroid.y,
    z: VRP.z - centroid.z,
  };

  // Normaliza o vetor V
  V = normalize(V);

  // Vetor R (reflexão de L sobre a normal)
  let R = {
    x: 2 * normal.x * dotProductLN - L.x,
    y: 2 * normal.y * dotProductLN - L.y,
    z: 2 * normal.z * dotProductLN - L.z,
  };
  R = normalize(R);

  // Produto escalar entre R e V
  let dotProductRV = Math.max(dotProduct(R, V), 0);
  let specularIntensity = Math.pow(dotProductRV, material.shininess);

  // Componentes ambientes
  let Ia = {
    r: light.intensity.r * material.Ka.r,
    g: light.intensity.g * material.Ka.g,
    b: light.intensity.b * material.Ka.b,
  };

  if (dotProductLN < 0) {
    return Ia;
  }

  // Componentes difusa
  let Id = { r: 0, g: 0, b: 0 };
  Id = {
    r: light.intensity.r * material.Kd.r * dotProductLN,
    g: light.intensity.g * material.Kd.g * dotProductLN,
    b: light.intensity.b * material.Kd.b * dotProductLN,
  };

  if (dotProductRV < 0) {
    return {
      r: Ia.r + Id.r,
      g: Ia.g + Id.g,
      b: Ia.b + Id.b,
    };
  }

  let Is = { r: 0, g: 0, b: 0 };
  Is = {
    r: light.intensity.r * material.Ks.r * specularIntensity,
    g: light.intensity.g * material.Ks.g * specularIntensity,
    b: light.intensity.b * specularIntensity,
  };

  // Intensidade total da iluminação
  let color = {
    r: Ia.r + Id.r + Is.r,
    g: Ia.g + Id.g + Is.g,
    b: Ia.b + Id.b + Is.b,
  };

  return color;
}

function calculateVertexIntensity(vertex, normal, light, material) {
  let L = {
    x: light.position.x - vertex.x,
    y: light.position.y - vertex.y,
    z: light.position.z - vertex.z,
  };
  L = normalize(L);

  let dotProductLN = dotProduct(normal, L);

  let V = {
    x: VRP.x - vertex.x,
    y: VRP.y - vertex.y,
    z: VRP.z - vertex.z,
  };
  V = normalize(V);

  let R = {
    x: 2 * normal.x * dotProductLN - L.x,
    y: 2 * normal.y * dotProductLN - L.y,
    z: 2 * normal.z * dotProductLN - L.z,
  };
  R = normalize(R);

  let dotProductRV = Math.max(dotProduct(R, V), 0);
  let specularIntensity = Math.pow(dotProductRV, material.shininess);

  let Ia = {
    r: light.intensity.r * material.Ka.r,
    g: light.intensity.g * material.Ka.g,
    b: light.intensity.b * material.Ka.b,
  };

  if (dotProductLN < 0) {
    return Ia;
  }

  let Id = {
    r: light.intensity.r * material.Kd.r * dotProductLN,
    g: light.intensity.g * material.Kd.g * dotProductLN,
    b: light.intensity.b * material.Kd.b * dotProductLN,
  };

  if (dotProductRV < 0) {
    return {
      r: Ia.r + Id.r,
      g: Ia.g + Id.g,
      b: Ia.b + Id.b,
    };
  }

  let Is = {
    r: light.intensity.r * material.Ks.r * specularIntensity,
    g: light.intensity.g * material.Ks.g * specularIntensity,
    b: light.intensity.b * specularIntensity,
  };

  let color = {
    r: Ia.r + Id.r + Is.r,
    g: Ia.g + Id.g + Is.g,
    b: Ia.b + Id.b + Is.b,
  };

  return color;
}

function calculatePixelIntensity(vertex, normal, light, material) {
  let L = {
    x: light.position.x - vertex.x,
    y: light.position.y - vertex.y,
    z: light.position.z - vertex.z,
  };
  L = normalize(L);

  let dotProductLN = dotProduct(normal, L);

  let V = {
    x: VRP.x - vertex.x,
    y: VRP.y - vertex.y,
    z: VRP.z - vertex.z,
  };
  V = normalize(V);

  let R = {
    x: 2 * normal.x * dotProductLN - L.x,
    y: 2 * normal.y * dotProductLN - L.y,
    z: 2 * normal.z * dotProductLN - L.z,
  };
  R = normalize(R);

  
  let H = {x: L.x + V.x, y: L.y + V.y, z: L.z + V.z};

  let dotProductRV = Math.max(dotProduct(normal, H), 0);
  let specularIntensity = Math.pow(dotProductRV, material.shininess);

  let Ia = {
    r: light.intensity.r * material.Ka.r,
    g: light.intensity.g * material.Ka.g,
    b: light.intensity.b * material.Ka.b,
  };

  if (dotProductLN < 0) {
    return Ia;
  }

  let Id = {
    r: light.intensity.r * material.Kd.r * dotProductLN,
    g: light.intensity.g * material.Kd.g * dotProductLN,
    b: light.intensity.b * material.Kd.b * dotProductLN,
  };

  if (dotProductRV < 0) {
    return {
      r: Ia.r + Id.r,
      g: Ia.g + Id.g,
      b: Ia.b + Id.b,
    };
  }

  let Is = {
    r: light.intensity.r * material.Ks.r * specularIntensity,
    g: light.intensity.g * material.Ks.g * specularIntensity,
    b: light.intensity.b * specularIntensity,
  };

  let color = {
    r: Ia.r + Id.r + Is.r,
    g: Ia.g + Id.g + Is.g,
    b: Ia.b + Id.b + Is.b,
  };

  return color;
}