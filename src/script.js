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
            const x = vertices[j].x * Math.cos(angle) - vertices[j].z * Math.sin(angle);
            const z = vertices[j].x * Math.sin(angle) + vertices[j].z * Math.cos(angle);
            slice.push({ x, y: vertices[j].y, z });
        }

        // Adiciona a fatia atual aos pontos da revolução
        revolutionPoints.set(i, slice);
    }

    // Salva os revolutionPoints no object3D
    object3D.revolutionPoints = revolutionPoints;

    // Cria as faces
    createFaces(object3D, slices);

    // Esteja certo de que fillFaces está recebendo e tratando os dados corretamente
    //fillFaces(object3D);
}


function createFaces(object3D, slices) {
    const revolutionPoints = object3D.revolutionPoints;

    // Itera sobre cada slice para criar as faces
    for (let i = 0; i < slices; i++) {
        const currentSlice = revolutionPoints.get(i);
        const nextSlice = revolutionPoints.get((i + 1) % slices); // Próxima fatia (fechando a revolução)

        // Itera sobre os pontos da fatia atual para criar as faces
        for (let j = 0; j < currentSlice.length - 1; j++) {
            const point1 = currentSlice[j];
            const point2 = currentSlice[j + 1];
            const point3 = nextSlice[j];
            const point4 = nextSlice[j + 1];

            // Cria uma face com os quatro pontos
            const face = [point1, point2, point4, point3]; // Sentido anti-horário
            object3D.faces.set(`Face${i}_${j}`, face);
        }
    }
}

document.getElementById('scale').addEventListener('input', function(event) {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    // Chama applyScale com o valor atual do input como fator de escala
    applyScale(parseFloat(event.target.value));
});

// Função para aplicar escala ao objeto 3D
function applyScale(scaleFactor) {
    const slices = parseInt(document.getElementById('slices').value); // Pega o número atual de slices do input
    // Criação das matrizes de visualização e projeção
    const viewMatrix = lookAt(VRP, VPN, VUP);
    const projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);

    objects3D.forEach(object3D => {
        if (!object3D.closed) {
            return;
        }
        // Atualiza cada vértice do polígono do objeto
        object3D.polygon.vertices.forEach(point => {
            point.x *= scaleFactor;
            point.y *= scaleFactor;
            point.z *= scaleFactor;
        });

        // Recria as slices após a transformação de escala
        createSlices(object3D, slices);
        // Redesenha as faces após a escala
        createFaces(object3D, slices);
        // Transforma e desenha o objeto após a escala
        transformAndDraw(object3D, viewMatrix, projectionMatrix);
    });
}


document.getElementById('rotationY').addEventListener('input', function(event) {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    // Chama applyRotation com o valor atual do input como graus de rotação
    applyRotationY(parseFloat(event.target.value));
});

document.getElementById('rotationX').addEventListener('input', function(event) {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    // Chama applyRotationX com o valor atual do input como graus de rotação
    applyRotationX(parseFloat(event.target.value));
});

// Função para aplicar rotação em Y e atualizar o polígono
function rotateAndUpdateY(object3D, radians) {
    object3D.polygon.vertices.forEach(point => {
        const oldX = point.x;
        const oldZ = point.z;
        point.x = oldX * Math.cos(radians) + oldZ * Math.sin(radians);
        point.z = -oldX * Math.sin(radians) + oldZ * Math.cos(radians);
    });
}

// Função para aplicar rotação em X e atualizar o polígono
function rotateAndUpdateX(object3D, radians) {
    object3D.polygon.vertices.forEach(point => {
        const oldY = point.y;
        const oldZ = point.z;
        point.y = oldY * Math.cos(radians) - oldZ * Math.sin(radians);
        point.z = oldY * Math.sin(radians) + oldZ * Math.cos(radians);
    });
}

// Atualiza a rotação e redesenha para rotação em X
function applyRotationX(rotationDegrees) {
    const slices = parseInt(document.getElementById('slices').value); // Pega o número atual de slices do input
    // Criação das matrizes de visualização e projeção
    const viewMatrix = lookAt(VRP, VPN, VUP);
    const projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);

    const radians = rotationDegrees * (Math.PI / 180);
    objects3D.forEach(object3D => {
        if (!object3D.closed) return;
        rotateAndUpdateX(object3D, radians);
        createSlices(object3D, slices);
        createFaces(object3D, slices);
        transformAndDraw(object3D, viewMatrix, projectionMatrix);
    });
}

// Atualiza a rotação e redesenha para rotação em Y
function applyRotationY(rotationDegrees) {
    const slices = parseInt(document.getElementById('slices').value); // Pega o número atual de slices do input
    // Criação das matrizes de visualização e projeção
    const viewMatrix = lookAt(VRP, VPN, VUP);
    const projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);

    const radians = rotationDegrees * (Math.PI / 180);
    objects3D.forEach(object3D => {
        if (!object3D.closed) return;
        rotateAndUpdateY(object3D, radians);
        createSlices(object3D, slices);
        createFaces(object3D, slices);
        transformAndDraw(object3D, viewMatrix, projectionMatrix);
    });
}

// Redesenha o canvas, incluindo eixos e faces
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    fillFaces();
}

var VRP = { x: -20, y: -20, z: 200 }; // Exemplo: a câmera está olhando para a origem do SRC
var VPN = { x: 0, y: 0, z: -1 }; // Apontando para o negativo no eixo z (para a cena)
var VUP = { x: 0, y: -1, z: 0 }; // 'Up' está no eixo y positivo

function normalize(vec) {
    let length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length > 0) {
        return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
    }
    return { x: 0, y: 0, z: 0 };
}

function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

//dotProduct, calcula o produto escalar
function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function lookAt(VRP, VPN, VUP) {
    let n = normalize(VPN); // Normaliza o vetor de plano normal de visualização
    let u = normalize(crossProduct(VUP, n)); // Normaliza o vetor 'right'
    let v = crossProduct(n, u); // Recalcula o vetor 'up', que deve ser ortogonal a 'n' e 'u'

    // Constrói a matriz de visualização
    let viewMatrix = [
        [u.x, u.y, u.z, -dotProduct(u, VRP)],
        [v.x, v.y, v.z, -dotProduct(v, VRP)],
        [n.x, n.y, n.z, -dotProduct(n, VRP)],
        [0, 0, 0, 1]
    ];

    return viewMatrix;
}

function perspective(fov, aspect, near, far) {
    let f = 1.0 / Math.tan(fov / 2);
    let rangeInv = 1 / (near - far);

    return [
        [f / aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (near + far) * rangeInv, near * far * rangeInv * 2],
        [0, 0, -1, 0]
    ];
}

function multiplyMatrixAndPoint(matrix, point) {
    // Garante que o ponto possui as propriedades x, y, z
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.z !== 'number') {
        console.error('Invalid point:', point);
        return { x: 0, y: 0, z: 0, w: 1 }; // Retorna um ponto padrão para evitar falhas
    }

    let result = {
        x: point.x * matrix[0][0] + point.y * matrix[0][1] + point.z * matrix[0][2] + matrix[0][3],
        y: point.x * matrix[1][0] + point.y * matrix[1][1] + point.z * matrix[1][2] + matrix[1][3],
        z: point.x * matrix[2][0] + point.y * matrix[2][1] + point.z * matrix[2][2] + matrix[2][3],
        w: point.x * matrix[3][0] + point.y * matrix[3][1] + point.z * matrix[3][2] + matrix[3][3]
    };

    if (result.w !== 0) {
        result.x /= result.w;
        result.y /= result.w;
        result.z /= result.w;
    }

    return result;
}

function transformAndDraw(object3D, viewMatrix, projectionMatrix) {
    console.log("chegou aqui");
    object3D.faces.forEach(face => {
        const screenCoordinates = [];
        face.forEach(point => {
            let transformedPoint = multiplyMatrixAndPoint(viewMatrix, point);
            transformedPoint = multiplyMatrixAndPoint(projectionMatrix, transformedPoint);

            let screenX = transformedPoint.x * canvas.width / 2 + canvas.width / 2;
            let screenY = -transformedPoint.y * canvas.height / 2 + canvas.height / 2;

            screenCoordinates.push({ screenX, screenY });
        });
        console.log("nao esta chegando aqui");
        drawPolygon(screenCoordinates);
        //drawPoints(screenCoordinates);
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
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.75)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fill();
}

function drawPoints(coordinates) {
    coordinates.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, raio, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();
    });
}

document.getElementById('3dButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    const slices = parseInt(document.getElementById('slices').value); // Pega o número atual de slices do input

    // Criação das matrizes de visualização e projeção
    const viewMatrix = lookAt(VRP, VPN, VUP);
    const projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);

    objects3D.forEach(object3D => {
        if (object3D.closed && object3D.polygon.vertices.length >= 2) {
            createSlices(object3D, slices);
            transformAndDraw(object3D, viewMatrix, projectionMatrix);
        }
    });
});




document.getElementById('3dCube').addEventListener('click', function() {
    var cubePoints = [
        { x: 60, y: 60, z: 0 },
        { x: 30, y: 60, z: 0 },
        { x: 30, y: 30, z: 0 },
        { x: 60, y: 30, z: 0 },
        { x: 60, y: 60, z: 0 },
        { x: 30, y: 60, z: 0 },
        { x: 30, y: 30, z: 0 },
        { x: 60, y: 30, z: 0 }
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
        closed: true
    });

    // Obtém o objeto3D atual
    var object3D = objects3D[objects3D.length - 1];

    drawAxes();

    const slices = parseInt(document.getElementById('slices').value); // Pega o número atual de slices do input

    // Criação das matrizes de visualização e projeção
    const viewMatrix = lookAt(VRP, VPN, VUP);
    const projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);

    if (object3D.closed && object3D.polygon.vertices.length >= 2) {
        createSlices(object3D, slices);
        transformAndDraw(object3D, viewMatrix, projectionMatrix);
    }
});