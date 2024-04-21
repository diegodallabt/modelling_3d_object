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
    fillFaces();
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
    fillFaces(object3D);
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

function fillFaces() {
    // Itera sobre todos os objetos 3D
    objects3D.forEach((object3D) => {
        // Verifica se o objeto está fechado
        if (!object3D.closed) {
            return;
        }

        const faces = object3D.faces;
        // Itera sobre todas as faces do objeto atual
        for (const [key, face] of faces) {
            // Obtém as coordenadas x e y dos pontos da face
            const coordinates = face.map(point => {
                const x = Math.round(point.x + canvas.width / 2);
                const y = Math.round(canvas.height / 2 - point.y);
                return { x, y };
            });

            console.log("COORDENADAS: ", coordinates);
            // Desenha as bordas da face
            drawPolygonBorder(coordinates);

            // Desenha um polígono preenchido com as coordenadas da face
            drawFilledPolygon(coordinates);
        }
    });
}

function drawPolygonBorder(coordinates) {
    ctx.beginPath();
    ctx.moveTo(coordinates[0].x, coordinates[0].y);
    for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(coordinates[i].x, coordinates[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 0, 255, 1)';
    ctx.stroke();
}

function drawFilledPolygon(coordinates) {
    ctx.beginPath();
    ctx.moveTo(coordinates[0].x, coordinates[0].y);
    for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(coordinates[i].x, coordinates[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
}

// Função para aplicar escala ao objeto 3D
function applyScale(scaleFactor) {
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
        createSlices(object3D, parseInt(document.getElementById('slices').value));
        // Redesenha as faces após a escala
        fillFaces();
    });
}

document.getElementById('scale').addEventListener('input', function(event) {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    // Chama applyScale com o valor atual do input como fator de escala
    applyScale(parseFloat(event.target.value));
});

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

// Atualiza a rotação e redesenha para rotação em Y
function applyRotationY(rotationDegrees) {
    const radians = rotationDegrees * (Math.PI / 180);
    objects3D.forEach(object3D => {
        if (!object3D.closed) return;
        rotateAndUpdateY(object3D, radians);
        createSlices(object3D, parseInt(document.getElementById('slices').value));
    });
    redrawCanvas();
}

// Atualiza a rotação e redesenha para rotação em X
function applyRotationX(rotationDegrees) {
    const radians = rotationDegrees * (Math.PI / 180);
    objects3D.forEach(object3D => {
        if (!object3D.closed) return;
        rotateAndUpdateX(object3D, radians);
        createSlices(object3D, parseInt(document.getElementById('slices').value));
    });
    redrawCanvas();
}

// Redesenha o canvas, incluindo eixos e faces
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    fillFaces();
}