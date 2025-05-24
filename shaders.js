export const vertexShaderSource = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_TexCoord;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;
  
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_Position = vec3(u_ModelMatrix * a_Position);  // For lighting calculation
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_TexCoord = a_TexCoord;
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightColor;
  uniform vec3 u_ViewPosition;
  uniform vec3 u_AmbientLight;
  uniform float u_Shininess;
  uniform vec3 u_Color;
  uniform sampler2D u_Sampler;
  uniform int u_UseTexture;
  uniform int u_IsShadow;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;

  void main() {
    if (u_IsShadow == 1) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
      return;
    }

    vec3 baseColor;
    if (u_UseTexture == 1) {
      baseColor = texture2D(u_Sampler, v_TexCoord).rgb;
    } else {
      baseColor = u_Color;
    }

    vec3 normal = normalize(v_Normal);
    vec3 lightDir = normalize(u_LightPosition - v_Position);
    vec3 viewDir = normalize(u_ViewPosition - v_Position);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    vec3 ambient = u_AmbientLight * baseColor;
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_LightColor * baseColor;
    
    float spec = pow(max(dot(normal, halfwayDir), 0.0), u_Shininess);
    vec3 specular = spec * u_LightColor;

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
  }
`;

export const skyboxVertexShader = `
  attribute vec3 a_Position;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec3 v_TexCoord;
  void main() {
    vec4 pos = u_ProjectionMatrix * u_ViewMatrix * vec4(a_Position, 1.0);
    gl_Position = pos.xyww;  // 修改這裡，確保 skybox 永遠在最遠處
    v_TexCoord = a_Position;  // 使用頂點位置作為紋理坐標
  }
`;

export const skyboxFragmentShader = `
  precision mediump float;
  uniform samplerCube u_SkyboxTexture;
  varying vec3 v_TexCoord;
  void main() {
    vec3 texColor = textureCube(u_SkyboxTexture, v_TexCoord).rgb;
    gl_FragColor = vec4(texColor, 1.0);
  }
`;
