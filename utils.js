let gl; // Declare the WebGL rendering context
let cubeBuffer;
let groundBuffer;

export function initializeGL(canvas) {
  gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('Failed to initialize WebGL');
  }
}

function calculateTangentsBitangents(vertices, texCoords) {
  const tangents = new Float32Array(vertices.length);
  const bitangents = new Float32Array(vertices.length);

  for (let i = 0; i < vertices.length; i += 9) { // 每3個頂點(一個三角形)
    const v0 = [vertices[i], vertices[i+1], vertices[i+2]];
    const v1 = [vertices[i+3], vertices[i+4], vertices[i+5]];
    const v2 = [vertices[i+6], vertices[i+7], vertices[i+8]];

    const uv0 = [texCoords[i/3*2], texCoords[i/3*2+1]];
    const uv1 = [texCoords[(i/3+1)*2], texCoords[(i/3+1)*2+1]];
    const uv2 = [texCoords[(i/3+2)*2], texCoords[(i/3+2)*2+1]];

    const deltaPos1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
    const deltaPos2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];

    const deltaUV1 = [uv1[0]-uv0[0], uv1[1]-uv0[1]];
    const deltaUV2 = [uv2[0]-uv0[0], uv2[1]-uv0[1]];

    const r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);

    const tangent = [
      (deltaPos1[0] * deltaUV2[1] - deltaPos2[0] * deltaUV1[1]) * r,
      (deltaPos1[1] * deltaUV2[1] - deltaPos2[1] * deltaUV1[1]) * r,
      (deltaPos1[2] * deltaUV2[1] - deltaPos2[2] * deltaUV1[1]) * r
    ];

    const bitangent = [
      (deltaPos2[0] * deltaUV1[0] - deltaPos1[0] * deltaUV2[0]) * r,
      (deltaPos2[1] * deltaUV1[0] - deltaPos1[1] * deltaUV2[0]) * r,
      (deltaPos2[2] * deltaUV1[0] - deltaPos1[2] * deltaUV2[0]) * r
    ];

    // 為三角形的每個頂點賦值相同的切線和副切線
    for (let j = 0; j < 3; j++) {
      tangents[i+j*3] = tangent[0];
      tangents[i+j*3+1] = tangent[1];
      tangents[i+j*3+2] = tangent[2];

      bitangents[i+j*3] = bitangent[0];
      bitangents[i+j*3+1] = bitangent[1];
      bitangents[i+j*3+2] = bitangent[2];
    }
  }

  return { tangents, bitangents };
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

  // Calculate tangents and bitangents
  const { tangents, bitangents } = calculateTangentsBitangents(vertices, texCoords);
  
  cubeBuffer.tangentBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.tangentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tangents, gl.STATIC_DRAW);

  cubeBuffer.bitangentBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.bitangentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, bitangents, gl.STATIC_DRAW);
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
  const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
  if (a_TexCoord >= 0) { // 只有當紋理坐標屬性存在時才設置
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.texCoordBuffer);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);
  }

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

  // Set up tangent attribute
  const a_Tangent = gl.getAttribLocation(program, 'a_Tangent');
  if (a_Tangent >= 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.tangentBuffer);
    gl.vertexAttribPointer(a_Tangent, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Tangent);
  }

  // Set up bitangent attribute
  const a_Bitangent = gl.getAttribLocation(program, 'a_Bitangent');
  if (a_Bitangent >= 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer.bitangentBuffer);
    gl.vertexAttribPointer(a_Bitangent, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Bitangent);
  }

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
