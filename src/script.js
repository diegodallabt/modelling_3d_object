var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var pontos = [];
var raio = 5;

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

// Inicializa o primeiro objeto 3D
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
    // Desenha a linha no eixo X
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    // Desenha a linha na vertical no Y = 0
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

    // Origem no meio do eixo X
    x -= canvas.width / 2;
    // Origem no meio do eixo Y
    y -= canvas.height / 2;

    // Get the current object3D
    var object3D = objects3D[objects3D.length - 1];

    if (object3D.closed) {
        // Create a new object3D and push it to the list
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

        // Get the new current object3D
        object3D = objects3D[objects3D.length - 1];

        //Clear the previous polygon and its points
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        //ctx.fillStyle = `rgba(0, 0, 0)`;
        drawAxes();
    }

    var ponto = { x: x, y: y, z: z }; // Definindo o ponto como um objeto { x, y, z }

    if (object3D.polygon.vertices.length >= 3) {
        var distancia = Math.sqrt(Math.pow(object3D.polygon.vertices[0].x - x, 2) + Math.pow(object3D.polygon.vertices[0].y - y, 2));
        if (distancia <= raio) {
            // Desenha a linha entre o último ponto e o próximo ponto
            ctx.beginPath();
            ctx.moveTo(object3D.polygon.vertices[0].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[0].y);
            ctx.lineTo(object3D.polygon.vertices[object3D.polygon.vertices.length - 1].x + canvas.width / 2, canvas.height / 2 - object3D.polygon.vertices[object3D.polygon.vertices.length - 1].y);
            ctx.stroke();
            object3D.closed = true;
            console.log("ID: ", object3D.id);
            console.log("Polígono fechado:", object3D.polygon.vertices);

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
            console.log("object3D.minY: ", object3D.minY, "\tobject3D.maxY: ", object3D.maxY);
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
    // Desenha os pontos clicados
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 0, 0)`;
    object3D.polygon.vertices.forEach(ponto => {
        drawPoint(ponto.x + canvas.width / 2, canvas.height / 2 - ponto.y);
    });
});


// Desenha um ponto no canvas
function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2, true);
    ctx.fill();
}

document.getElementById('resetButton').addEventListener('click', resetCanvas);
// Função para resetar o canvas
function resetCanvas() {
    // Limpa o canvas inteiramente.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redesenha os eixos para um canvas limpo.
    drawAxes();

    // Limpa a lista de objetos 3D e inicia um novo objeto com id 0.
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

document.getElementById('3dButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Adapte isto para ser chamado em um contexto apropriado, talvez antes do evento do botão 3D.
    objects3D.forEach(object3D => {
        if (object3D.closed && object3D.polygon.vertices.length >= 2) {
            const slices = parseInt(document.getElementById('slices').value);
            createSlices(object3D, slices); // Assumindo que esta função configura corretamente as slices e faces.
        }
    });

    drawAxes();
    zBufferAlgorithm();
});

function createSlices(object3D, slices) {
    // Verifica se há vértices suficientes para criar o polígono
    if (object3D.polygon.vertices.length < 2) {
        console.error('É necessário pelo menos 2 vértices para criar um polígono.');
        return;
    }

    const vertices = object3D.polygon.vertices;
    const step = 2 * Math.PI / slices; // Passo angular para cada fatia
    const revolutionPoints = new Map(); // Map para armazenar os pontos da revolução

    // Loop para criar as fatias da revolução
    for (let i = 0; i < slices; i++) {
        const angle = i * step;
        const slice = [];

        // Rotaciona os vértices do perfil em torno do eixo Y
        for (let j = 0; j < vertices.length; j++) {
            const x = vertices[j].x * Math.cos(angle);
            const z = vertices[j].x;
            slice.push({ x, y: vertices[j].y, z });
        }

        // Adiciona a fatia atual aos pontos da revolução
        revolutionPoints.set(i, slice);
    }

    // Salva os revolutionPoints no object3D
    object3D.revolutionPoints = revolutionPoints;

    // Cria as faces
    createFaces(object3D, slices);

    zBufferAlgorithm();
}

/**
 * Calculate and store intersections between a new face and existing faces.
 * Store intersections bidirectionally for easy lookup.
 */
function calculateAndStoreIntersections(object3D, newFaceId, newFace) {
    object3D.faces.forEach((existingFace, existingFaceId) => {
        if (newFaceId !== existingFaceId) {
            const intersection = findFaceIntersection(newFace, existingFace);
            if (intersection) {
                const key = `${newFaceId}-${existingFaceId}`;
                object3D.faceIntersections.set(key, intersection);
                object3D.faceIntersections.set(`${existingFaceId}-${newFaceId}`, intersection);
            }
        }
    });
}

/**
 * Determine if two faces intersect and return details about the intersection.
 */
function findFaceIntersection(face1, face2) {
    const normal1 = calculateNormal(face1[0], face1[1], face1[2]);
    const normal2 = calculateNormal(face2[0], face2[1], face2[2]);

    if (areParallel(normal1, normal2)) {
        return null; // No intersection if normals are parallel
    }

    const line = findPlaneIntersectionLine(normal1, face1[0], normal2, face2[0]);
    if (!line) return null;

    return checkLineIntersectionWithFaces(line, face1, face2);
}

/**
 * Calculate the normal vector of a face given three points.
 */
function calculateNormal(p1, p2, p3) {
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

/**
 * Determine if two normals are parallel.
 */
function areParallel(normal1, normal2) {
    const dotProduct = normal1.x * normal2.x + normal1.y * normal2.y + normal1.z * normal2.z;
    const norms = Math.sqrt((normal1.x ** 2 + normal1.y ** 2 + normal1.z ** 2) * (normal2.x ** 2 + normal2.y ** 2 + normal2.z ** 2));
    return Math.abs(dotProduct / norms - 1) < 0.0001;
}

/**
 * Calculate intersection line of two planes defined by their normals and a point on each plane.
 */
function findPlaneIntersectionLine(normal1, point1, normal2, point2) {
    const direction = {
        x: normal1.y * normal2.z - normal1.z * normal2.y,
        y: normal1.z * normal2.x - normal1.x * normal2.z,
        z: normal1.x * normal2.y - normal1.y * normal2.x
    };
    // Simplification: Assume intersection line passes through point1
    return { point: point1, direction };
}

/**
 * Check if the intersection line between two planes intersects with the polygonal faces defined by them.
 */
function checkLineIntersectionWithFaces(line, face1, face2) {
    // This is a placeholder. Properly checking line-face intersection requires complex geometry calculations.
    // Here we assume they intersect if an intersection line exists.
    return { x: line.point.x, y: line.point.y, z: line.point.z };
}

function createFaces(object3D, slices) {
    const revolutionPoints = object3D.revolutionPoints;
    //console.log("Revolution Points: ", revolutionPoints);
    // Itera sobre cada slice para criar as faces
    for (let i = 0; i < slices; i++) {
        const currentSlice = revolutionPoints.get(i);
        const nextSlice = revolutionPoints.get((i + 1) % slices); // Próxima fatia (fechando a revolução)

        for (let j = 0; j < currentSlice.length - 1; j++) {
            const point1 = currentSlice[j];
            const point2 = currentSlice[j + 1];
            const point3 = nextSlice[j];
            const point4 = nextSlice[j + 1];

            // Cria uma face com os quatro pontos
            const face = [point1, point2, point4, point3]; // Sentido anti-horário
            const faceId = `Face${i}_${j}`;
            object3D.faces.set(faceId, face);

            // Após criar a face, calcula as interseções com todas as outras faces já criadas
            calculateAndStoreIntersections(object3D, faceId, face);

            console.log("FaceIntersection: ", object3D.faceIntersections);
        }
    }
}

function initializeZBuffer() {
    let zBuffer = new Array(canvas.width);
    for (let i = 0; i < canvas.width; i++) {
        zBuffer[i] = new Array(canvas.height).fill(Infinity);
    }
    return zBuffer;
}

function zBufferAlgorithm() {
    let zBuffer = initializeZBuffer();

    objects3D.forEach((object3D) => {
        if (!object3D.closed) return;

        object3D.faces.forEach((face, faceId) => {
            face.forEach((point, index) => {
                const nextPoint = face[(index + 1) % face.length];
                // Custom function to draw line considering intersections
                bresenhamLineWithIntersections(point.x, point.y, point.z, nextPoint.x, nextPoint.y, nextPoint.z, zBuffer, faceId, object3D);
            });
        });
    });
}


function bresenhamLineWithIntersections(x0, y0, z0, x1, y1, z1, zBuffer, faceId, object3D) {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let e2;

    while (true) {
        if (x0 < 0 || x0 >= canvas.width || y0 < 0 || y0 >= canvas.height) break;
        // Check if current pixel has intersections and decide which face to render based on your rule
        let shouldRender = true;
        if (object3D.faceIntersections.size > 0) {
            shouldRender = checkIntersectionPriority(x0, y0, faceId, object3D);
        }

        if (shouldRender && z0 < zBuffer[x0][y0]) {
            zBuffer[x0][y0] = z0;
            ctx.fillRect(x0, y0, 1, 1);
        }

        if (x0 === x1 && y0 === y1) break;
        e2 = 2 * err;
        if (e2 > dx) {
            err += dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
        }
    }
}

function checkIntersectionPriority(x, y, currentFaceId, object3D, zBuffer) {
    // Verifica se as coordenadas estão dentro dos limites da tela
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        console.error("Coordinates out of bounds:", x, y);
        return false;
    }

    // Assume a prioridade mais alta até que se prove o contrário
    let highestPriority = true;
    let currentFaceZ = zBuffer[x][y];

    // Verifica se o valor do zBuffer está definido
    if (typeof currentFaceZ === 'undefined') {
        console.error("Z-buffer value is undefined at:", x, y);
        return false;
    }

    // Verifica todas as interseções envolvendo o faceId atual
    object3D.faceIntersections.forEach((intersection, key) => {
        let [face1Id, face2Id] = key.split('-');
        if (face1Id === currentFaceId || face2Id === currentFaceId) {
            let otherFaceId = (face1Id === currentFaceId) ? face2Id : face1Id;
            let otherFace = object3D.faces.get(otherFaceId);
            if (otherFace && otherFace.some(point => calculateZDepthAtPixel(x, y, point) < currentFaceZ)) {
                highestPriority = false;
            }
        }
    });

    return highestPriority;
}

function calculateZDepthAtPixel(x, y, face) {
    // Make sure the face data is defined and has vertices
    if (!face || !face.length) {
        console.log('Face data is invalid or undefined:', face);
        return Infinity; // Return a default value that won't affect rendering negatively
    }

    let zValues = face.map(point => point.z);
    return Math.min(...zValues);
}