export class Snake {
  constructor(initialPosition) {
    // 設置蛇的初始Y軸高度為0.5
    this.body = [
      [initialPosition[0], 0.5, initialPosition[2]],
      [initialPosition[0] - 1, 0.5, initialPosition[2]],
      [initialPosition[0] - 2, 0.5, initialPosition[2]],
      [initialPosition[0] - 3, 0.5, initialPosition[2]]
    ];
    this.direction = [1, 0, 0];
    this.lastDirection = [1, 0, 0]; // 記錄上一次的方向
    this.growPending = 0;
    this.speed = 0.2;
    this.lastMoveTime = 0;
  }

  // Move the snake in the current direction
  move() {
    const now = Date.now();
    if (now - this.lastMoveTime < 200) { // Move every 200ms
      return;
    }
    
    const head = this.body[0];
    const newHead = [
      head[0] + this.direction[0] * this.speed,
      0.5,  // 固定Y軸高度為0.5
      head[2] + this.direction[2] * this.speed,
    ];
    
    console.log('Moving from', head, 'to', newHead);
    
    this.body.unshift(newHead); // Add new head
    if (this.growPending > 0) {
      this.growPending--; // Consume growth
      console.log('Growing! New length:', this.body.length);
    } else {
      this.body.pop(); // Remove tail
    }
    
    this.lastMoveTime = now;
  }

  // Change the snake's direction
  setDirection(newDirection) {
    // 正規化方向向量
    const length = Math.sqrt(
      newDirection[0] * newDirection[0] + 
      newDirection[2] * newDirection[2]
    );
    
    if (length > 0) {
      const normalizedDirection = [
        newDirection[0] / length,
        0,
        newDirection[2] / length
      ];

      // 檢查是否為反方向
      if (
        normalizedDirection[0] === -this.lastDirection[0] &&
        normalizedDirection[2] === -this.lastDirection[2]
      ) {
        console.log('Cannot move in the opposite direction!');
        return;
      }

      this.direction = normalizedDirection;
      this.lastDirection = this.direction; // 更新上一次的方向
      console.log('New direction:', this.direction);
    }
  }

  // Grow the snake by one segment
  grow() {
    this.growPending++;
  }

  // Check if the snake collides with itself
  checkSelfCollision() {
    const head = this.body[0];
    return this.body.slice(1).some(segment => 
      segment[0] === head[0] && segment[1] === head[1] && segment[2] === head[2]
    );
  }

  // Get the length of the snake
  getLength() {
    return this.body.length;
  }
}
