export function normalize(vec) {
    let length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length > 0) {
      return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
    }
    return { x: 0, y: 0, z: 0 };
}

export function scalarMultiply(vec, scalar) {
    return { x: vec.x * scalar, y: vec.y * scalar, z: vec.z * scalar };
  }
  
export function subtractVectors(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

export function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function multiplyMatrix(a, b) {
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
  
export function multiplyMatrix4x1(a, b) {
    let result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
        result[i] += a[i][j] * b[j];
        }
    }
    return result;
}

export function calculateFaceNormal(face) {
    const vector1 = subtractVectors(face[1], face[0]);
    const vector2 = subtractVectors(face[2], face[0]);
    return crossProduct(vector1, vector2);
}
  
export function isFaceVisible(face, VRP) {
    const N = calculateFaceNormal(face);
    const normal = normalize(N);
    const O = subtractVectors(VRP, face[0]);
    const observer = normalize(O);

    const visibility = dotProduct(normal, observer);

    return visibility > 0;
}
  
export function calculateFaceCentroid(face) {
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

export function verticesEqual(v1, v2) {
    return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
}
  
export function calculateVertexNormal(vertex, visibleFaces) {
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

export function calculateAverageDepth(face) {
    let sumZ = 0;
    face.forEach((vertex) => {
      sumZ += vertex.z;
    });
    return sumZ / face.length;
}

export function calculateCentroid(vertices) {
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