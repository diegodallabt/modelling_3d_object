var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var raio = 5;

var ajustWidth = 700;
let ajustHeight = 300;
var Xmin = 0,
  Xmax = 400,
  Ymin = 0,
  Ymax = 400;
var Umin = 0,
  Umax = window.innerWidth - ajustWidth,
  Vmin = 0,
  Vmax = window.innerHeight - ajustHeight;
var dp = 600;

let canvasWidth = Umax;
let canvasHeight = Vmax;

let rotationX = 0;
let rotationY = 0;
let rotationZ = 0;

let scaleFactor = 1;

let translateX = 0;
let translateY = 0;
let translateZ = 0;

let zBuffer = new Array(Umax).fill(0).map(() => new Array(Vmax).fill(Infinity));
let colorBuffer = new Array(Umax)
  .fill(0)
  .map(() => new Array(Vmax).fill({ r: 255, g: 255, b: 255 }));

let light = {
  position: { x: 0, y: 0, z: 600 },
  intensity: { r: 30, g: 100, b: 50 },
};

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
      shininess: 10,
    },
  },
];
let selectedShading = 'gouraud';
let selectedObjectId = 0;

initializeNewObject3D();
drawAxes();

window.addEventListener('DOMContentLoaded', function () {
  Umax = window.innerWidth - ajustWidth;
  Vmax = window.innerHeight - ajustHeight;
  canvas.width = Umax;
  canvas.height = Vmax;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAxes();
  toggleControls(false);
});

document.getElementById('shading').addEventListener('change', function (event) {
  selectedShading = event.target.value;
  redrawCanvas();
});

const controls = document.querySelectorAll(
  '#translateX, #translateY, #translateZ, #rotationY, #rotationX, #rotationZ, #scale'
);

// Função para habilitar/desabilitar os controles
function toggleControls(enable) {
  controls.forEach((control) => {
    control.disabled = !enable;
  });
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
      shininess: 10,
    },
  };
  objects3D.push(newObject3D);
}

function calculateCentroid(vertices) {
  let somaX = 0,
    somaY = 0,
    somaZ = 0;
  let totalVertices = vertices.length;
  vertices.forEach((ponto) => {
    somaX += ponto.x;
    somaY += ponto.y;
    somaZ += ponto.z;
  });
  return {
    x: somaX / totalVertices,
    y: somaY / totalVertices,
    z: somaZ / totalVertices,
  };
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
        shininess: 10,
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAxes();

  objects3D = [];
  initializeNewObject3D();
  updateObjectSelector();
}

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

function rotatePoint(point, angleX, angleY, angleZ, origin) {
  let radX = (angleX * Math.PI) / 180;
  let radY = (angleY * Math.PI) / 180;
  let radZ = (angleZ * Math.PI) / 180;

  let cosX = Math.cos(radX);
  let sinX = Math.sin(radX);
  let cosY = Math.cos(radY);
  let sinY = Math.sin(radY);
  let cosZ = Math.cos(radZ);
  let sinZ = Math.sin(radZ);

  // Rotação no eixo Z
  let rotatedX = point.x * cosZ - point.y * sinZ;
  let rotatedY = point.x * sinZ + point.y * cosZ;

  // Rotação no eixo Y
  let newX = rotatedX * cosY + point.z * sinY;
  let newZ = -rotatedX * sinY + point.z * cosY;

  // Rotação no eixo X
  let newY = rotatedY * cosX - newZ * sinX;
  newZ = rotatedY * sinX + newZ * cosX;

  // y = newY;
  // z = newZ;

  return {
    x: newX,
    y: newY,
    z: newZ,
  };
}

function scalePoint(point, scaleFactor, origin) {
  let translatedX = point.x - origin.x;
  let translatedY = point.y - origin.y;
  let translatedZ = point.z - origin.z;

  let x = translatedX * scaleFactor;
  let y = translatedY * scaleFactor;
  let z = translatedZ * scaleFactor;

  return {
    x: x + origin.x,
    y: y + origin.y,
    z: z + origin.z,
  };
}

var VRP = { x: 0, y: 0, z: 700 };
let vetorN = {
  x: objects3D[0].centroid.x - VRP.x,
  y: objects3D[0].centroid.y - VRP.y,
  z: objects3D[0].centroid.z - VRP.z,
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
    z: a.x * b.y - a.y * b.x,
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
    z: -VRP.z,
  };
  let Msrusrc = [
    [u.x, u.y, u.z, dotProduct(u, newVRP)],
    [v.x, v.y, v.z, dotProduct(v, newVRP)],
    [n.x, n.y, n.z, dotProduct(n, newVRP)],
    [0, 0, 0, 1],
  ];
  return Msrusrc;
}

// NOTE: Careful.
function parallel() {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

function perspective() {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, -1 / dp, 0],
  ];
}

function multiplyMatrix(a, b) {
  let result = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
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
    [Sx, 0, 0, Tx],
    [0, Sy, 0, Ty],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  return Mjp;
}

function calculateAverageDepth(face) {
  let sumZ = 0;
  face.forEach((vertex) => {
    sumZ += vertex.z;
  });
  return sumZ / face.length;
}

const Msrusrc = sruSrc(VRP, vetorN, vetorY);
const Mproj = perspective();

function transformAndDraw(object3D) {
  var Mjp = createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax);
  const centroid = calculateCentroid(object3D.polygon.vertices);
  const transform = object3D.transform;

  let facesWithDepth = [];
  let visibleFaces = [];

  object3D.faces.forEach((faces, index) => {
    faces.forEach((face) => {
      const transformedFace = face.map((point) => {
        let rotated = rotatePoint(
          point,
          transform.rotationX,
          transform.rotationY,
          transform.rotationZ,
          centroid
        );
        rotated = scalePoint(rotated, transform.scale, centroid);
        rotated.x -= transform.translateX;
        rotated.y += transform.translateY;
        rotated.z += transform.translateZ;
        return rotated;
      });

      if (isFaceVisible(transformedFace, VRP)) {
        // const averageDepth = calculateAverageDepth(transformedFace);
        // const color = calculateFlatShading(transformedFace, light, object3D.material);
        // facesWithDepth.push({ transformedFace, averageDepth, color });

        visibleFaces.push(transformedFace);
      }
    });
  });

  // quando for gouraudshading
  visibleFaces.forEach((face) => {
    if (selectedShading === 'gouraud') {
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

      // Adicionar cores aos vértices para interpolação
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

  facesWithDepth.forEach(({ transformedFace, color }) => {
    const screenCoordinates = transformedFace.map((rotated) => {
      const newPoint = [rotated.x, rotated.y, rotated.z, 1];
      var M = multiplyMatrix(Mjp, Mproj);
      M = multiplyMatrix(M, Msrusrc);
      M = multiplyMatrix4x1(M, newPoint);
      var viewObject = centerObject(M);

      if (selectedShading === 'gouraud') {
        return {
          ...viewObject,
          color: rotated.color, // Adicionar cor interpolada
        };
      } else {
        return centerObject(M);
      }
    });

    if (selectedShading === 'gouraud') rasterGouraud(screenCoordinates);
    else raster(screenCoordinates, color);
  });

  paint();
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

function raster(triangle, color) {
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

// function raster(face, color) {
//   face.sort((a, b) => a.screenY - b.screenY);

//   const minY = Math.ceil(face[0].screenY);
//   const maxY = Math.floor(face[face.length - 1].screenY);

//   for (let y = minY; y <= maxY; y++) {
//     const intersections = [];

//     for (let i = 0; i < face.length; i++) {
//       const start = face[i];
//       const end = face[(i + 1) % face.length];

//       if ((start.screenY <= y && end.screenY > y) || (start.screenY > y && end.screenY <= y)) {
//         const t = (y - start.screenY) / (end.screenY - start.screenY);
//         const x = start.screenX + t * (end.screenX - start.screenX);
//         const z = start.screenZ + t * (end.screenZ - start.screenZ);
//         intersections.push({ x, z });
//       }
//     }

//     intersections.sort((a, b) => a.x - b.x);

//     for (let i = 0; i < intersections.length - 1; i += 2) {
//       const xStart = Math.ceil(intersections[i].x);
//       const zStart = intersections[i].z;
//       const xEnd = Math.floor(intersections[i + 1].x);
//       const zEnd = intersections[i + 1].z;

//       for (let x = xStart; x <= xEnd; x++) {
//         const t = (x - xStart) / (xEnd - xStart);
//         const z = zStart + t * (zEnd - zStart);

//         if (x >= 0 && x < Umax && y >= 0 && y < Vmax && z < zBuffer[x][y]) {
//           zBuffer[x][y] = z;
//           colorBuffer[x][y] = { r: color.r, g: color.g, b: color.b };
//         }
//       }
//     }
//   }
// }

function paint() {
  // Atualizar o canvas com o color buffer
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
      colorBuffer[i][j] = { r: 255, g: 255, b: 255 }; // Assume que a cor de fundo é branca
      zBuffer[i][j] = Infinity; // Inicializa o zBuffer com um valor alto
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
  // ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
  // ctx.fill();
}

function drawPoints(coordinates) {
  coordinates.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.screenX, point.screenY, raio, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 255, 0, 1)';
    ctx.fill();
  });
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
      // gouraud ou flat shading
      const triangle1 = [face[0], face[1], face[2]];
      const triangle2 = [face[0], face[2], face[3]];

      if (!object3D.faces.has(i)) {
        object3D.faces.set(i, []);
      }
      object3D.faces.get(i).push(triangle1, triangle2);

      // wireframe
      // if (!object3D.faces.has(i)) {
      //   object3D.faces.set(i, []);
      // }
      // object3D.faces.get(i).push(face);
    }
  }
}

document.getElementById('3dButton').addEventListener('click', () => {
  const currentObject = objects3D[objects3D.length - 1];
  if (!currentObject.closed) {
    alert('Conecte os pontos para gerar o objeto 3D!');
    return;
  }

  const slices = parseInt(document.getElementById('slices').value);

  const canvasWidth = window.innerWidth - ajustWidth;
  const canvasHeight = window.innerHeight - ajustHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  objects3D.forEach((object3D) => {
    if (object3D.closed && object3D.polygon.vertices.length >= 2) {
      createRevolution(object3D, slices);
      transformAndDraw(object3D);
    }
  });
});

function centerObject(point) {
  const translateX = (Umax + Umin) / 2;
  const translateY = (Vmax + Vmin) / 2;
  return {
    screenX: point[0] + translateX,
    screenY: -point[1] + translateY,
    screenZ: point[2],
  };
}

function calculateFaceNormal(face) {
  const vector1 = subtractVectors(face[1], face[0]);
  const vector2 = subtractVectors(face[2], face[0]);
  return crossProduct(vector1, vector2);
}

function isFaceVisible(face, VRP) {
  const N = calculateFaceNormal(face);
  const normal = normalize(N);
  const O = subtractVectors(VRP, face[0]);
  const observer = normalize(O);

  const visibility = dotProduct(normal, observer);

  return visibility > 0;
}

function calculateFaceCentroid(face) {
  let sumX = 0,
    sumY = 0,
    sumZ = 0;
  let numVertices = face.length;

  face.forEach((vertex) => {
    sumX += vertex.x;
    sumY += vertex.y;
    sumZ += vertex.z;
  });

  return {
    x: sumX / numVertices,
    y: sumY / numVertices,
    z: sumZ / numVertices,
  };
}

function verticesEqual(v1, v2) {
  return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
}

// Função para calcular as normais dos vértices com base nas faces visíveis
function calculateVertexNormal(vertex, visibleFaces) {
  let normal = { x: 0, y: 0, z: 0 };
  let count = 0;
  visibleFaces.forEach((face) => {
    if (face.some((v) => verticesEqual(v, vertex))) {
      let faceNormal = calculateFaceNormal(face);
      normal.x += faceNormal.x;
      normal.y += faceNormal.y;
      normal.z += faceNormal.z;
      count++;
    }
  });

  if (count > 0) {
    normal.x /= count;
    normal.y /= count;
    normal.z /= count;
  }

  return normalize(normal);
}

function calculateFlatShading(face, light, material) {
  const centroid = calculateFaceCentroid(face);

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
