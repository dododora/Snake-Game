let gl; // Declare the WebGL rendering context
let cubeBuffer;
let groundBuffer;

export function initializeGL(canvas) {
  gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('Failed to initialize WebGL');
  }
}

export function initializeCube(gl) {
  const vertices = new Float32Array([
    // Vertex coordinates and texture coordinates
    // Front face
    -0.5, -0.5,  0.5,   0.0, 0.0,
     0.5, -0.5,  0.5,   1.0, 0.0,
     0.5,  0.5,  0.5,   1.0, 1.0,
    -0.5,  0.5,  0.5,   0.0, 1.0,
    // Back face
    -0.5, -0.5, -0.5,   1.0, 0.0,
    -0.5,  0.5, -0.5,   1.0, 1.0,
     0.5,  0.5, -0.5,   0.0, 1.0,
     0.5, -0.5, -0.5,   0.0, 0.0,
    // Top face
    -0.5,  0.5, -0.5,   0.0, 1.0,
    -0.5,  0.5,  0.5,   0.0, 0.0,
     0.5,  0.5,  0.5,   1.0, 0.0,
     0.5,  0.5, -0.5,   1.0, 1.0,
    // Bottom face
    -0.5, -0.5, -0.5,   0.0, 0.0,
     0.5, -0.5, -0.5,   1.0, 0.0,
     0.5, -0.5,  0.5,   1.0, 1.0,
    -0.5, -0.5,  0.5,   0.0, 1.0,
    // Right face
     0.5, -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5, -0.5,   0.0, 1.0,
     0.5,  0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,  0.5,   1.0, 0.0,
    // Left face
    -0.5, -0.5, -0.5,   1.0, 0.0,
    -0.5, -0.5,  0.5,   1.0, 1.0,
    -0.5,  0.5,  0.5,   0.0, 1.0,
    -0.5,  0.5, -0.5,   0.0, 0.0,
  ]);

  const indices = new Uint16Array([
    0,  1,  2,  0,  2,  3,  // Front face
    4,  5,  6,  4,  6,  7,  // Back face
    8,  9,  10, 8,  10, 11, // Top face
    12, 13, 14, 12, 14, 15, // Bottom face
    16, 17, 18, 16, 18, 19, // Right face
    20, 21, 22, 20, 22, 23, // Left face
  ]);

  cubeBuffer = {
    vertexBuffer: gl.createBuffer(),
    indexBuffer: gl.createBuffer(),
    texCoordBuffer: gl.createBuffer(),
    numIndices: indices.length,
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffer.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const texCoords = new Float32Array(vertices.filter((_, index) => index % 5 >= 3));
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
}

export function initializeGroundBuffer(gl) {
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

  groundBuffer = {
    vertexBuffer: gl.createBuffer(),
    numVertices: groundVertices.length / 3
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices), gl.STATIC_DRAW);
}

export function initializeSkybox(gl) {
  const skyboxVertices = new Float32Array([
    -1.0,  1.0, -1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
    -1.0,  1.0, -1.0,

    -1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    -1.0, -1.0,  1.0,

     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,

    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0
  ]);

  const skyboxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);

  return {
    vertexBuffer: skyboxBuffer,
    numVertices: 36
  };
}

export function loadCubemapTexture(gl, images) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faces = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];

  faces.forEach((face, i) => {
    gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
  });

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  return texture;
}

export function drawCubeAt(gl, program, position, color) {
  // 設置頂點
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.vertexBuffer);
  gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 20, 0);  // stride 改為 20，因為每個頂點有 5 個浮點數
  gl.enableVertexAttribArray(program.a_Position);

  // 設置紋理坐標
  gl.vertexAttribPointer(program.a_TexCoord, 2, gl.FLOAT, false, 20, 12); // offset 改為 12，跳過 xyz 三個浮點數
  gl.enableVertexAttribArray(program.a_TexCoord);

  // 設置頂點法線
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  
  // 為立方體的每個面設置法線
  const normals = new Float32Array([
    // 前面
     0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
    // 後面
     0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,
    // 上面
     0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,
    // 底面
     0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,
    // 右面
     1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,
    // 左面
    -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,
  ]);
  
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  
  const a_Normal = gl.getAttribLocation(program, 'a_Normal');
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  // 設置顏色
  gl.uniform3fv(program.u_Color, color);

  // 繪製
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffer.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
}

export function drawGround(gl, program, color) {
  if (!groundBuffer) {
    console.error('Ground buffer is not initialized.');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer.vertexBuffer);
  const a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniform3fv(program.u_Color, color);
  gl.drawArrays(gl.TRIANGLES, 0, groundBuffer.numVertices);
}
