var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var pontos = [];
var raio = 5;

// Objeto 3D
let object3D = {
    polygon: {
        vertices: [],
    },
    intersections: new Map(),
    revolutionPoints: new Map(),
    faces: new Map(),
    faceIntersections: new Map(),
    minY: Infinity,
    maxY: 0,
    closed: false
};

drawAxes();

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

    if (object3D.closed) {
        // Limpa o polígono anterior e seus pontos
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(0, 0, 0)`;
        object3D.polygon.vertices = [];
        object3D.closed = false;
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
            object3D.closed = true; // Marca o polígono como fechado
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
    // Limpa o canvas e redefine as propriedades do objeto 3D
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    object3D.polygon.vertices = [];
    object3D.intersections.clear();
    object3D.faces.clear();
    object3D.closed = false;
    object3D.minY = Infinity;
    object3D.maxY = 0;
    drawAxes();
}

function clearCanvas() {
    object3D.intersections.clear();
    object3D.faces.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
}

document.getElementById('3dButton').addEventListener('click', () => {
    clearCanvas();
    const slices = parseInt(document.getElementById('slices').value);
    createSlices(object3D, slices);
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

    // Define as interseções entre as arestas do polígono
    defineFaceIntersections(object3D);


    fillPolygon(object3D);

    // Cria as faces
    //createFaces(object3D, slices);

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


function fillFaces(object3D) {
    const faces = object3D.faces;
    // Itera sobre todas as faces
    for (const [key, face] of faces) {
        // Obtém as coordenadas x e y dos pontos da face
        const coordinates = face.map(point => {
            const x = Math.round(point.x + canvas.width / 2);
            const y = Math.round(canvas.height / 2 - point.y);
            return { x, y };
        });
        // Desenha as bordas da face
        //drawPolygonBorder(coordinates);

        // Desenha um polígono preenchido com as coordenadas da face
        //drawFilledPolygon(coordinates);
    }
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






function defineIntersections(object3D) {
    const revolutionPoints = object3D.revolutionPoints;
    const minY = object3D.minY;
    const maxY = object3D.maxY;

    // Para cada linha horizontal entre minY e maxY
    for (let y = minY; y < maxY; y++) {
        const intersections = []; // Array para armazenar as interseções nesta linha

        // Para cada par de pontos em cada fatia da revolução
        revolutionPoints.forEach(slice => {
            for (let i = 0; i < slice.length; i++) {
                const p1 = slice[i];
                const p2 = slice[(i + 1) % slice.length]; // Próximo ponto (fechando a fatia)

                // Verifica se a aresta cruza a linha horizontal atual
                if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
                    // Calcula a interseção com a linha horizontal
                    const intersectionX = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                    // Armazena a coordenada x da interseção e as cores
                    intersections.push({
                        x: Math.round(intersectionX), // Arredonde para o inteiro mais próximo
                        y: y // Salve também a coordenada y da interseção
                    });
                }
            }
        });

        // Ordena as interseções em ordem crescente
        intersections.sort((a, b) => a.x - b.x);

        // Adiciona as interseções nesta linha ao objeto3D
        object3D.intersections.set(y, intersections);
    }
}


function defineFaceIntersections(object3D) {
    const faces = object3D.faces;
    const minY = object3D.minY;
    const maxY = object3D.maxY;

    // Itera sobre todas as faces
    for (const [key, face] of faces) {
        const faceIntersections = [];

        // Obtém as coordenadas x e y dos pontos da face
        const coordinates = face.map(point => ({ x: point.x, y: point.y }));

        console.log('coordinates', coordinates);

        // Calcula as interseções horizontais para a face
        for (let y = minY; y < maxY; y++) {
            const intersections = []; // Array para armazenar as interseções nesta linha

            console.log('intersections', intersections);

            // Para cada par de pontos na borda da face
            for (let i = 0; i < coordinates.length; i++) {
                const p1 = coordinates[i];
                const p2 = coordinates[(i + 1) % coordinates.length]; // Próximo ponto (fechando a face)

                // Verifica se a aresta cruza a linha horizontal atual
                if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
                    // Calcula a interseção com a linha horizontal
                    const intersectionX = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                    // Armazena a coordenada x da interseção
                    intersections.push(intersectionX); // Apenas armazena a coordenada x
                }
            }

            // Ordena as interseções em ordem crescente
            intersections.sort((a, b) => a - b);

            // Agrupa as interseções em pares de coordenadas x representando os pontos de interseção
            for (let i = 0; i < intersections.length; i += 2) {
                faceIntersections.push([intersections[i], intersections[i + 1]]);
            }
        }

        // Salva as interseções da face
        object3D.faceIntersections.set(key, faceIntersections);
    }
}

function fillPolygon(object3D) {
    const initialY = object3D.minY;
    const endY = object3D.maxY;
    const intersections = object3D.faceIntersections;

    for (let currentY = initialY; currentY < endY; currentY++) {
        const currentEdges = intersections.get(currentY);

        console.log("currentEdges:", currentEdges);

        if (currentEdges) { // Verifica se há arestas nesta linha
            for (let k = 0; k < currentEdges.length; k += 2) { // Ajuste do passo para 2
                const startX = currentEdges[k]; // Primeira interseção
                const endX = currentEdges[k + 1]; // Segunda interseção
                console.log("startX:", startX, "endX:", endX);

                for (let currentX = startX; currentX < endX; currentX++) {
                    drawSquare(
                        currentX,
                        currentY, { r: 255, g: 0, b: 0, a: 1 }
                    );
                }
            }
        }
    }
}

function drawSquare(x, y, { r, g, b, a }) {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(x, y, 1, 1);
}