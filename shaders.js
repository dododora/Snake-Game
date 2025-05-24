export const vertexShaderSource = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_TexCoord;  // 添加紋理坐標
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;   // 傳遞給 fragment shader
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_TexCoord = a_TexCoord;
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  uniform vec3 u_LightPosition;
  uniform vec3 u_ViewPosition;
  uniform vec3 u_Color;
  uniform sampler2D u_Sampler;
  uniform int u_UseTexture;  // 改為 int 而不是 bool
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;

  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDir = normalize(u_LightPosition - v_Position);
    vec3 viewDir = normalize(u_ViewPosition - v_Position);
    vec3 reflectDir = reflect(-lightDir, normal);

    // 根據 u_UseTexture 選擇顏色
    vec3 baseColor;
    if (u_UseTexture == 1) {
      baseColor = texture2D(u_Sampler, v_TexCoord).rgb;
    } else {
      baseColor = u_Color;
    }

    // 光照計算
    vec3 ambient = 0.7 * baseColor;
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * baseColor;
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = spec * vec3(1.0, 1.0, 1.0);

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
  }
`;

export const skyboxVertexShader = `
  attribute vec3 a_Position;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec3 v_TexCoord;
  void main() {
    v_TexCoord = a_Position;
    // 只用旋轉過的 view matrix
    vec4 pos = u_ProjectionMatrix * u_ViewMatrix * vec4(a_Position, 1.0);
    gl_Position = pos;
    // 不要 xyww，保留原本的 w
  }
`;

export const skyboxFragmentShader = `
  precision mediump float;
  uniform samplerCube u_SkyboxTexture;
  varying vec3 v_TexCoord;
  void main() {
    gl_FragColor = textureCube(u_SkyboxTexture, v_TexCoord);
  }
`;
