import {
    normalize,
    scalarMultiply,
    subtractVectors,
    crossProduct,
    dotProduct,
} from './operations.js';

export function parallel() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
}
  
export function perspective(dp) {
return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, -1 / dp, 0],
];
}

export function sruSrc(VRP, vetorN, vetorY) {
    let n = normalize(vetorN);
    let dot = dotProduct(vetorY, n);
    let y = scalarMultiply(n, dot);
    let v = normalize(subtractVectors(vetorY, y));
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
  
export function createMjp(Xmin, Xmax, Ymin, Ymax, Umin, Umax, Vmin, Vmax) {
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