export function rotatePoint(point, angleX, angleY, angleZ, origin) {
    let radX = angleX * Math.PI / 180;
    let radY = angleY * Math.PI / 180;
    let radZ = angleZ * Math.PI / 180;
  
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
  
    newX -= origin.x;
    rotatedY -= origin.y;
    newZ -= origin.z;
  
    // Rotação no eixo X
    let newY = rotatedY * cosX - newZ * sinX;
    newZ = rotatedY * sinX + newZ * cosX;
  
    return {
      x: newX + origin.x,
      y: newY + origin.y,
      z: newZ + origin.z
    };
}
  
export function scalePoint(point, scaleFactor, origin) {
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