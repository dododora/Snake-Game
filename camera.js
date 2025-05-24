export class Camera {
  constructor() {
    this.rotationX = 0;
    this.rotationY = 0;
  }

  getFirstPersonView(position, direction) {
    const eye = [
      position[0],
      position[1] + 0.8,  // 視角高度
      position[2]
    ];
    
    // 使用當前方向計算視點
    const center = [
      position[0] + direction[0] * 5, // 看得更遠
      position[1],
      position[2] + direction[2] * 5
    ];
    
    const up = [0, 1, 0];
    return new Matrix4().setLookAt(...eye, ...center, ...up);
  }

  getThirdPersonView(position) {
    const distance = 5;  // 減少距離，原本是 15 太遠了
    const height = 2;    // 降低高度，原本是 10 太高了

    const eye = [
      position[0] + distance * Math.sin(this.rotationX), // 修正符號，移除負號
      position[1] + height,
      position[2] + distance * Math.cos(this.rotationX)  // 修正符號，移除負號
    ];

    const center = position;  // 直接使用 position
    const up = [0, 1, 0];

    return new Matrix4().setLookAt(...eye, ...center, ...up);
  }

  getGodView(position) {
    const eye = [
      position[0],  // 修改：跟隨蛇的 X 位置
      20,          // 降低高度，讓視野更清楚
      position[2]   // 修改：跟隨蛇的 Z 位置
    ];
    const center = [
      position[0], // 看向蛇頭
      0,          // 地面高度
      position[2]
    ];
    const up = [0, 0, -1];
    return new Matrix4().setLookAt(...eye, ...center, ...up);
  }

  updateRotation(deltaX, deltaY) {
    this.rotationX += deltaX * 0.005;
    this.rotationY = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotationY + deltaY * 0.005));
  }
}
