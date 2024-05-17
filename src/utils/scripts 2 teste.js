var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var raio = 5;

// Adjust the width for the canvas and positions of transformation buttons
var ajustWidth = 400;
var Xmin = 0, Xmax = 600, Ymin = 0, Ymax = 600;
var Umin = 0, Umax = window.innerWidth - ajustWidth, Vmin = 0, Vmax = window.innerHeight;

// List of 3D objects
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
    closed: false
}];

let rotationX = 0;
let rotationY = 0;

initializeNewObject3D();
drawAxes();

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
        closed: false
    };
    objects3D.push(newObject3D);
}

function drawAxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the X-axis
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    // Draw the Y-axis
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function calculateMinMaxY(vertices) {
    let minY = Infinity;
    let maxY = -Infinity;

    vertices.forEach(ponto => {
        if (ponto.y <= minY) {
            minY = ponto.y;
        }
        if (ponto.y > maxY) {
            maxY = ponto.y;
        }
    });

    return { minY, maxY };
}

canvas.addEventListener('click', function(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = rect.bottom - event.clientY;
    var z = 0;

    // Set the origin to the center of the canvas
    x -= canvas.width / 2;
    y -= canvas.height / 2;

    // Get the current 3D object
    var object3D = objects3D[objects3D.length - 1];

    if (object3D.closed) {
        // Create a new 3D object and push it to the list
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
            closed: false
        });

        // Get the new current 3D object
        object3D = objects3D[objects3D.length - 1];

        drawAxes();
    }

    var ponto = { x: x, y: y, z: z }; // Define the point as an object { x, y, z }

    if (object3D.polygon.vertices.length >= 3) {
        var distancia = Math.sqrt(Math.pow(object3D.polygon.vertices[0].x - x, 2) + Math.pow(object3D.polygon.vertices[0].y - y, 2));
        if (distancia <= raio) {
            // Draw the line between the last point and the next point
            ctx.beginPath();
            ctx.moveTo(object3D.polygon.vertices[0].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[0].y);
            ctx.lineTo(object3D.polygon.vertices[object3D.polygon.vertices.length - 1].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[object3D.polygon.vertices.length - 1].y);
            ctx.stroke();
            object3D.closed = true;

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

    // Draw the clicked points
    object3D.polygon.vertices.forEach(ponto => {
        drawPoint(ponto.x + canvas.width / 2, canvas.height / 2 - ponto.y);
    });
});

// Draw a point on the canvas
function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2, true);
    ctx.fill();
}

document.getElementById('resetButton').addEventListener('click', resetCanvas);

document.getElementById('3dButton').addEventListener('click', function () {
    var object3D = objects3D[objects3D.length - 1];
    if (object3D.closed) {
        createSlices(object3D, parseInt(document.getElementById('slices').value));
        drawObject(object3D);
    }
});

document.getElementById('3dCube').addEventListener('click', function () {
    resetCanvas();
    createCube();
});

function resetCanvas() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the axes for a clean canvas
    drawAxes();

    // Clear the list of 3D objects and start a new object with id 0
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
        closed: false
    }];
}

function createSlices(object3D, slices) {
    if (object3D.polygon.vertices.length < 2) {
        console.error('É necessário pelo menos 2 vértices para criar um polígono.');
        return;
    }

    const vertices = object3D.polygon.vertices;
    const step = 2 * Math.PI / slices;
    
    const revolutionPoints = new Map();

    for (let i = 0; i < slices; i++) {
        const angle = i * step;
        const slice = [];

        for (let j = 0; j < vertices.length; j++) {
            const x = vertices[j].x * Math.cos(angle) - vertices[j].z * Math.sin(angle);
            const z = vertices[j].x * Math.sin(angle) + vertices[j].z * Math.cos(angle);
            slice.push({ x, y: vertices[j].y, z });
        }

        revolutionPoints.set(i, slice);
    }

    object3D.revolutionPoints = revolutionPoints;
    createFaces(object3D, slices);
}

function createFaces(object3D, slices) {
    const revolutionPoints = object3D.revolutionPoints;

    for (let i = 0; i < slices; i++) {
        const currentSlice = revolutionPoints.get(i);
        const nextSlice = revolutionPoints.get((i + 1) % slices);

        for (let j = 0; j < currentSlice.length - 1; j++) {
            const point1 = currentSlice[j];
            const point2 = currentSlice[j + 1];
            const point3 = nextSlice[j];
            const point4 = nextSlice[j + 1];

            const face = [point1, point2, point4, point3];
            object3D.faces.set(`Face${i}_${j}`, face);
        }
    }
}

document.getElementById('scale').addEventListener('input', function(event) {
    let scale = parseFloat(event.target.value);
    objects3D.forEach(object3D => {
        if (!object3D.closed) {
            return;
        }

        object3D.polygon.vertices.forEach(ponto => {
            ponto.x *= scale;
            ponto.y *= scale;
            ponto.z *= scale;
        });

        object3D.revolutionPoints.forEach(slice => {
            slice.forEach(ponto => {
                ponto.x *= scale;
                ponto.y *= scale;
                ponto.z *= scale;
            });
        });

        drawObject(object3D);
    });
});

document.getElementById('rotationY').addEventListener('input', function(event) {
    rotationY = parseFloat(event.target.value);
    objects3D.forEach(object3D => {
        if (object3D.closed) {
            drawObject(object3D);
        }
    });
});

document.getElementById('rotationX').addEventListener('input', function(event) {
    rotationX = parseFloat(event.target.value);
    objects3D.forEach(object3D => {
        if (object3D.closed) {
            drawObject(object3D);
        }
    });
});

function drawObject(object3D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    ctx.beginPath();
    object3D.polygon.vertices.forEach((ponto, i) => {
        let rotated = rotatePoint(ponto, rotationX, rotationY);
        if (i === 0) {
            ctx.moveTo(rotated.x + canvas.width / 2, canvas.height / 2 - rotated.y);
        } else {
            ctx.lineTo(rotated.x + canvas.width / 2, canvas.height / 2 - rotated.y);
        }
    });

    if (object3D.closed) {
        ctx.closePath();
    }

    ctx.stroke();

    object3D.faces.forEach(face => {
        ctx.beginPath();
        face.forEach((ponto, i) => {
            let rotated = rotatePoint(ponto, rotationX, rotationY);
            if (i === 0) {
                ctx.moveTo(rotated.x + canvas.width / 2, canvas.height / 2 - rotated.y);
            } else {
                ctx.lineTo(rotated.x + canvas.width / 2, canvas.height / 2 - rotated.y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
    });

    object3D.revolutionPoints.forEach(slice => {
        slice.forEach(ponto => {
            let rotated = rotatePoint(ponto, rotationX, rotationY);
            drawPoint(rotated.x + canvas.width / 2, canvas.height / 2 - rotated.y);
        });
    });
}

function rotatePoint(point, angleX, angleY) {
    let radX = angleX * Math.PI / 180;
    let radY = angleY * Math.PI / 180;

    let cosX = Math.cos(radX);
    let sinX = Math.sin(radX);
    let cosY = Math.cos(radY);
    let sinY = Math.sin(radY);

    let y = point.y * cosX - point.z * sinX;
    let z = point.y * sinX + point.z * cosX;
    let x = point.x * cosY - z * sinY;
    z = point.x * sinY + z * cosY;

    return { x: x, y: y, z: z };
}

function createCube() {
    let size = 100;
    let cubeVertices = [
        { x: -size, y: -size, z: -size },
        { x: size, y: -size, z: -size },
        { x: size, y: size, z: -size },
        { x: -size, y: size, z: -size },
        { x: -size, y: -size, z: size },
        { x: size, y: -size, z: size },
        { x: size, y: size, z: size },
        { x: -size, y: size, z: size }
    ];

    let cubeFaces = [
        [cubeVertices[0], cubeVertices[1], cubeVertices[2], cubeVertices[3]],
        [cubeVertices[4], cubeVertices[5], cubeVertices[6], cubeVertices[7]],
        [cubeVertices[0], cubeVertices[1], cubeVertices[5], cubeVertices[4]],
        [cubeVertices[2], cubeVertices[3], cubeVertices[7], cubeVertices[6]],
        [cubeVertices[1], cubeVertices[2], cubeVertices[6], cubeVertices[5]],
        [cubeVertices[3], cubeVertices[0], cubeVertices[4], cubeVertices[7]]
    ];

    objects3D = [{
        id: 0,
        polygon: {
            vertices: cubeVertices
        },
        revolutionPoints: new Map(),
        faces: new Map(),
        faceIntersections: new Map(),
        minY: Infinity,
        maxY: 0,
        closed: true
    }];

    cubeFaces.forEach((face, i) => {
        objects3D[0].faces.set(`Face${i}`, face);
    });

    drawObject(objects3D[0]);
}

