import { Snake } from './snake.js';
import { Camera } from './camera.js';
import { 
  initializeCube, 
  initializeGroundBuffer, 
  drawCubeAt, 
  drawGround, 
  initializeSkybox,      // <-- add this
  loadCubemapTexture     // <-- add this
} from './utils.js';
import { 
  vertexShaderSource, 
  fragmentShaderSource, 
  skyboxVertexShader, 
  skyboxFragmentShader 
} from './shaders.js';

let gl, program, snake, camera, foodPosition;
let cameraMode = 'third'; // 'first', 'third', 'god'
let score = 0;
let highScore = 0;
let foodRotation = 0; // For food animation
let lastKeyPressTime = 0; // Add this at the top with other global variables
let isFirstPerson = false; // Control first/third person toggle

// 添加新的全局變量
let mouseLastX = 0;
let mouseLastY = 0;
let mouseDragging = false;
let rotationAngle = 0;

// 添加全局變量
let foodTexture;

// Add new globals
let skyboxProgram;
let skyboxBuffer;
let skyboxTexture;

// 添加到全局變量
let fov = 60; // Field of view in degrees

function initTexture(gl, image) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // 設置參數
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // 上傳圖片到紋理
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  return texture;
}

export function main() {
  const canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    console.error('Failed to initialize WebGL');
    return;
  }

  // Initialize buffers
  initializeCube(gl);
  initializeGroundBuffer(gl);

  // Initialize snake, camera, and food
  snake = new Snake([0, 0, 0]);
  camera = new Camera();
  spawnFood();

  // Set up shaders, buffers, and event listeners
  setupShaders();
  setupEventListeners();

  // 添加滑鼠事件監聽器
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  // 修改圖片加載部分
  const image = new Image();
  image.crossOrigin = "anonymous"; // 添加這行
  image.onload = function() {
    foodTexture = initTexture(gl, image);
    requestAnimationFrame(gameLoop);
  };
  image.onerror = function(err) {
    console.error('Error loading texture:', err);
  };
  image.src = './picture/object_texture.jpg'; // 確保這個路徑是正確的

  // 在圖片加載之前，先開始遊戲循環，但不渲染食物的紋理
  requestAnimationFrame(gameLoop);

  // Setup skybox
  setupSkybox();

  // 添加縮放控制
  const zoomSlider = document.getElementById('zoom');
  const zoomValue = document.getElementById('zoomValue');
  zoomSlider.oninput = function() {
    fov = this.value;
    zoomValue.textContent = fov + '°';
    draw();
  };
}

function setupShaders() {
  // Compile vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return;
  }

  // Compile fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
    return;
  }

  // Link shaders into a program
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  // Use the program
  gl.useProgram(program);

  // Retrieve uniform locations
  program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
  program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
  program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
  program.u_Color = gl.getUniformLocation(program, 'u_Color');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
  program.u_UseTexture = gl.getUniformLocation(program, 'u_UseTexture');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');

  // Add new uniforms for lighting
  program.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
  program.u_LightParams = gl.getUniformLocation(program, 'u_LightParams');
  program.u_AmbientLight = gl.getUniformLocation(program, 'u_AmbientLight');
  program.u_Shininess = gl.getUniformLocation(program, 'u_Shininess');

  // Set up viewport and clear color
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
}

// Add this function before setupSkybox()
function compileShader(gl, vShaderText, fShaderText) {
  // Compile vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vShaderText);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  // Compile fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fShaderText);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Create program and link shaders
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function setupSkybox() {
  skyboxProgram = compileShader(gl, skyboxVertexShader, skyboxFragmentShader);
  skyboxProgram.a_Position = gl.getAttribLocation(skyboxProgram, 'a_Position');
  skyboxProgram.u_ViewMatrix = gl.getUniformLocation(skyboxProgram, 'u_ViewMatrix');
  skyboxProgram.u_ProjectionMatrix = gl.getUniformLocation(skyboxProgram, 'u_ProjectionMatrix');
  skyboxProgram.u_SkyboxTexture = gl.getUniformLocation(skyboxProgram, 'u_SkyboxTexture');
  skyboxBuffer = initializeSkybox(gl);

  // Load cubemap textures
  const images = [];
  let loadedImages = 0;
  const faces = ['pos-x', 'neg-x', 'pos-y', 'neg-y', 'pos-z', 'neg-z'];
  
  faces.forEach((face, i) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';  // 確保可以加載跨域圖片
    image.onload = () => {
      console.log(`Loaded skybox texture: ${face}`);
      images[i] = image;
      loadedImages++;
      if (loadedImages === 6) {
        skyboxTexture = loadCubemapTexture(gl, images);
        if (!skyboxTexture) {
          console.error('Failed to create skybox texture');
        }
      }
    };
    image.onerror = (err) => {
      console.error(`Failed to load skybox texture ${face}:`, err);
    };
    image.src = `./picture/${face}.jpg`;
  });
}

function setupEventListeners() {
  document.addEventListener('keydown', event => {
    const now = Date.now();
    if (now - lastKeyPressTime < 300) return;
    
    if (isFirstPerson) {
      // 第一人稱控制邏輯
      switch (event.key.toLowerCase()) {
        case 'w': // 前進 - 使用當前方向
          snake.setDirection([snake.direction[0], 0, snake.direction[2]]);
          break;
        case 's': // 後退 - 使用當前方向的反方向
          snake.setDirection([-snake.direction[0], 0, -snake.direction[2]]);
          break;
        case 'a': // 左轉
          snake.direction = [snake.direction[2], 0, -snake.direction[0]];
          break;
        case 'd': // 右轉
          snake.direction = [-snake.direction[2], 0, snake.direction[0]];
          break;
        case 'c':
          isFirstPerson = !isFirstPerson;
          console.log('Changed to:', isFirstPerson ? 'First Person' : 'Third Person');
          break;
      }
    } else {
      // 第三人稱控制邏輯（絕對方向）
      switch (event.key.toLowerCase()) {
        case 'w': snake.setDirection([0, 0, -1]); break;
        case 's': snake.setDirection([0, 0, 1]); break;
        case 'a': snake.setDirection([-1, 0, 0]); break;
        case 'd': snake.setDirection([1, 0, 0]); break;
        case 'c': 
          isFirstPerson = !isFirstPerson;
          console.log('Changed to:', isFirstPerson ? 'First Person' : 'Third Person');
          break;
      }
    }
    
    lastKeyPressTime = now;
  });
}

function handleMouseDown(event) {
  mouseLastX = event.clientX;
  mouseLastY = event.clientY;
  mouseDragging = true;
}

function handleMouseUp() {
  mouseDragging = false;
}

function handleMouseMove(event) {
  if (!mouseDragging) return;

  const deltaX = event.clientX - mouseLastX;
  
  // 無論是第一人稱還是第三人稱，都用相同的方式更新方向
  rotationAngle += deltaX * 0.005;
  snake.direction = [
    Math.sin(rotationAngle),
    0,
    Math.cos(rotationAngle)
  ];

  mouseLastX = event.clientX;
  mouseLastY = event.clientY;
}

function spawnFood() {
  const maxRange = 9;
  foodPosition = [
    Math.floor(Math.random() * (maxRange * 2) - maxRange),
    0.5,  // 修改為和蛇一樣的高度
    Math.floor(Math.random() * (maxRange * 2) - maxRange)
  ];
  console.log('New food spawned at:', foodPosition);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  snake.move();
  foodRotation += 2;

  // 檢查吃到食物
  const head = snake.body[0];
  const distance = Math.sqrt(
    Math.pow(head[0] - foodPosition[0], 2) + 
    Math.pow(head[2] - foodPosition[2], 2)
  );

  if (distance < 0.5) {
    console.log('Food eaten!');
    snake.grow();
    score += 10;
    if (score > highScore) {
      highScore = score;
    }
    updateScoreboard();
    spawnFood();
  }

  // 檢查碰撞
  if (snake.checkSelfCollision() || isOutOfBounds(head)) {
    gameOver();
    return;
  }
}

// 修改碰撞檢測函數
function isOutOfBounds(position) {
  // 在判定時考慮蛇身體的大小（假設蛇身體是 1x1 的立方體）
  const halfSize = 0.5; // 蛇身體的半寬
  const borderSize = 10; // 邊界大小
  
  return (Math.abs(position[0]) + halfSize > borderSize) || 
         (Math.abs(position[2]) + halfSize > borderSize);
}

function gameOver() {
  console.log('Game Over! Final Score:', score);
  alert(`Game Over! Score: ${score}`);
  // Reset game
  snake = new Snake([0, 0, 0]);
  score = 0;
  updateScoreboard();
  spawnFood();
}

function updateScoreboard() {
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('highscore').textContent = `High Score: ${highScore}`;
}

function createGround() {
  const groundVertices = [];
  const size = 20;
  const step = 1;
  
  for (let x = -size; x <= size; x += step) {
    for (let z = -size; z <= size; z += step) {
      // Create two triangles for each grid cell
      groundVertices.push(
        x, 0, z,
        x + step, 0, z,
        x, 0, z + step,
        
        x + step, 0, z,
        x + step, 0, z + step,
        x, 0, z + step
      );
    }
  }
  
  return groundVertices;
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 主視圖 (第一人稱或第三人稱視角)
  const mainViewport = {
    x: 0,
    y: 0,
    width: gl.canvas.width,
    height: gl.canvas.height
  };
  gl.viewport(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);

  const mainAspect = mainViewport.width / mainViewport.height;
  const mainViewMatrix = isFirstPerson
    ? camera.getFirstPersonView(snake.body[0], snake.direction)
    : camera.getThirdPersonView(snake.body[0]);
  drawScene(mainViewMatrix, mainAspect);

  // 上帝視角 (小視窗)
  const miniSize = Math.min(gl.canvas.width, gl.canvas.height) / 4; // 設為主視窗的 1/4
  const miniViewport = {
    width: miniSize,
    height: miniSize,
    x: gl.canvas.width - miniSize - 10,
    y: gl.canvas.height - miniSize - 10
  };
  gl.viewport(miniViewport.x, miniViewport.y, miniViewport.width, miniViewport.height);

  // 重新清除深度緩衝區，確保小視窗正確渲染
  gl.clear(gl.DEPTH_BUFFER_BIT);
  
  const godViewMatrix = camera.getGodView(snake.body[0]);
  drawScene(godViewMatrix, 1); // 使用 1 作為方形小視窗的寬高比
}

function drawScene(viewMatrix, aspect) {
  // 先畫 skybox，去掉註釋
  drawSkybox(viewMatrix, aspect);
  
  // 切換回主 shader program
  gl.useProgram(program);

  // Calculate camera position based on view matrix
  const cameraPos = {
    x: -viewMatrix.elements[12],
    y: -viewMatrix.elements[13],
    z: -viewMatrix.elements[14]
  };

  // 修改透視投影參數
  const projectionMatrix = new Matrix4().setPerspective(
    fov,    // 使用動態 fov 值
    aspect,
    0.1,    // 近平面
    100     // 遠平面
  );
  
  const vpMatrix = projectionMatrix.multiply(viewMatrix);

  // 設置光照參數
  const lightPosition = [0, 15, 20];          // 提高光源位置
  const lightColor = [1.2, 1.2, 1.2];        // 增加光照強度
  const lightParams = [1.0, 0.009, 0.001];   // 降低衰減係數使光照範圍更大
  const ambientLight = [0.4, 0.4, 0.4];      // 增加環境光強度
  const shininess = 64.0;                    // 調整反光銳利度

  // 計算相機位置（改用當前視角）
  const viewerPos = isFirstPerson
    ? snake.body[0]  // 第一人稱時使用蛇頭位置
    : [
        cameraPos.x,
        cameraPos.y,
        cameraPos.z
      ];
  
  // 傳遞光照參數
  gl.uniform3fv(program.u_LightPosition, new Float32Array(lightPosition));
  gl.uniform3fv(program.u_LightColor, new Float32Array(lightColor));
  gl.uniform3fv(program.u_LightParams, new Float32Array(lightParams));
  gl.uniform3fv(program.u_AmbientLight, new Float32Array(ambientLight));
  gl.uniform1f(program.u_Shininess, shininess);
  gl.uniform3fv(program.u_ViewPosition, new Float32Array(viewerPos));

  // Draw a small cube at light position to visualize it
  const lightModelMatrix = new Matrix4();
  lightModelMatrix.setTranslate(...lightPosition);  // 更新可視化光源的位置
  lightModelMatrix.scale(0.1, 0.1, 0.1);            // 縮小光源指示器
  const lightMvpMatrix = new Matrix4(vpMatrix).multiply(lightModelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, lightMvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, lightModelMatrix.elements);
  drawCubeAt(gl, program, [0, 0, 0], [1.0, 1.0, 0.0]);  // 黃色立方體表示光源

  // 繪製時計算法線矩陣
  snake.body.forEach((segment, index) => {
    const modelMatrix = new Matrix4().setTranslate(...segment);
    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    const mvpMatrix = new Matrix4(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

    const color = index === 0 
      ? [0.0, 0.8, 0.2]  // 蛇頭亮綠色
      : [0.0, 0.6, 0.0]; // 蛇身暗綠色
    
    drawCubeAt(gl, program, segment, color);
  });

  // 食物的繪製也需要正確的法線矩陣
  const foodModelMatrix = new Matrix4();
  foodModelMatrix.setTranslate(...foodPosition);
  foodModelMatrix.scale(0.3, 0.3, 0.3);

  const foodNormalMatrix = new Matrix4();
  foodNormalMatrix.setInverseOf(foodModelMatrix);
  foodNormalMatrix.transpose();

  const foodMvpMatrix = new Matrix4(vpMatrix).multiply(foodModelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, foodMvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, foodModelMatrix.elements);
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, foodNormalMatrix.elements);

  drawFood(gl, program, vpMatrix);

  // 繪製邊界線
  const borderSize = 10;
  const borderHeight = 1.0;  // 修改邊界高度與蛇同高
  const borderWidth = 0.5;
  
  // 北邊
  let borderModel = new Matrix4();
  borderModel.setTranslate(0, 0.5, -borderSize);  // Y軸設為 0.5，使底部與地面齊平
  borderModel.scale(borderSize * 2, borderHeight, borderWidth);
  drawBorder(borderModel, vpMatrix);

  // 南邊
  borderModel.setTranslate(0, 0.5, borderSize);
  borderModel.scale(borderSize * 2, borderHeight, borderWidth);
  drawBorder(borderModel, vpMatrix);

  // 東邊
  borderModel.setTranslate(borderSize, 0.5, 0);
  borderModel.scale(borderWidth, borderHeight, borderSize * 2);
  drawBorder(borderModel, vpMatrix);

  // 西邊
  borderModel.setTranslate(-borderSize, 0.5, 0);
  borderModel.scale(borderWidth, borderHeight, borderSize * 2);
  drawBorder(borderModel, vpMatrix);
}

function drawSkybox(viewMatrix, aspect) {
  if (!skyboxBuffer || !skyboxBuffer.vertexBuffer || !skyboxTexture) {
    console.log('Skybox resources not ready:', {
      buffer: skyboxBuffer,
      texture: skyboxTexture
    });
    return;
  }

  gl.depthFunc(gl.LEQUAL);  // 更改深度測試函數
  gl.useProgram(skyboxProgram);

  // 創建一個新的視圖矩陣，只保留旋轉部分
  const viewNoTrans = new Matrix4(viewMatrix);
  viewNoTrans.elements[12] = 0;
  viewNoTrans.elements[13] = 0;
  viewNoTrans.elements[14] = 0;

  // 設置投影矩陣
  const projectionMatrix = new Matrix4().setPerspective(60, aspect, 0.1, 100);

  // 設置著色器變量
  gl.uniformMatrix4fv(skyboxProgram.u_ViewMatrix, false, viewNoTrans.elements);
  gl.uniformMatrix4fv(skyboxProgram.u_ProjectionMatrix, false, projectionMatrix.elements);

  // 綁定 skybox 紋理
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  gl.uniform1i(skyboxProgram.u_SkyboxTexture, 0);

  // 設置頂點數據
  gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer.vertexBuffer);
  gl.vertexAttribPointer(skyboxProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(skyboxProgram.a_Position);

  // 繪製 skybox
  gl.drawArrays(gl.TRIANGLES, 0, skyboxBuffer.numVertices);

  // 重置狀態
  gl.depthFunc(gl.LESS);
  gl.useProgram(program);
}

function drawFood(gl, program, vpMatrix) {
  const foodModelMatrix = new Matrix4();
  foodModelMatrix.setTranslate(...foodPosition);
  foodModelMatrix.rotate(foodRotation, foodRotation, 1, 0);
  foodModelMatrix.scale(0.3, 0.3, 0.3);

  const foodMvpMatrix = new Matrix4(vpMatrix).multiply(foodModelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, foodMvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, foodModelMatrix.elements);

  // 設置紋理
  if (foodTexture) {
    gl.uniform1i(program.u_UseTexture, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, foodTexture);
    gl.uniform1i(program.u_Sampler, 0);
    gl.enableVertexAttribArray(program.a_TexCoord); // 確保啟用紋理坐標
  } else {
    gl.uniform1i(program.u_UseTexture, 0);
    gl.disableVertexAttribArray(program.a_TexCoord); // 如果沒有紋理就禁用
  }

  drawCubeAt(gl, program, [0, 0, 0], [1.0, 1.0, 1.0]);
  
  // 重置狀態
  gl.uniform1i(program.u_UseTexture, 0);
  gl.disableVertexAttribArray(program.a_TexCoord);
}

function drawBorder(modelMatrix, vpMatrix) {
  const normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  const mvpMatrix = new Matrix4(vpMatrix).multiply(modelMatrix);
  
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);
  
  // 使用白色繪製邊界
  drawCubeAt(gl, program, [0, 0, 0], [0.8, 0.8, 0.8]);
}

main();
