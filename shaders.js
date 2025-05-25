export const vertexShaderSource = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_TexCoord;
  attribute vec3 a_Tangent;
  attribute vec3 a_Bitangent;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;
  varying vec3 v_Tangent;
  varying vec3 v_Bitangent;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_TexCoord = a_TexCoord;
    v_Tangent = normalize(vec3(u_ModelMatrix * vec4(a_Tangent, 0.0)));
    v_Bitangent = normalize(vec3(u_ModelMatrix * vec4(a_Bitangent, 0.0)));
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
  uniform sampler2D u_NormalMap;
  uniform int u_UseTexture;
  uniform int u_UseBumpMap;
  uniform int u_IsShadow;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;
  varying vec3 v_Tangent;
  varying vec3 v_Bitangent;

  void main() {
    if (u_IsShadow == 1) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
      return;
    }

    vec3 normal = normalize(v_Normal);
    if (u_UseBumpMap == 1) {
      // Get normal from normal map
      vec3 normalFromMap = texture2D(u_NormalMap, v_TexCoord).rgb * 2.0 - 1.0;
      
      // Create TBN matrix
      vec3 T = normalize(v_Tangent);
      vec3 B = normalize(v_Bitangent);
      vec3 N = normalize(v_Normal);
      mat3 TBN = mat3(T, B, N);
      
      // Transform normal from tangent to world space
      normal = normalize(TBN * normalFromMap);
    }

    vec3 baseColor = u_Color;
    if (u_UseTexture == 1) {
      baseColor = texture2D(u_Sampler, v_TexCoord).rgb;
    }

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

export const borderVertexShader = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_PositionInWorld = (u_ModelMatrix * a_Position).xyz;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
  }
`;

export const borderFragmentShader = `
  precision mediump float;
  uniform vec3 u_ViewPosition;
  uniform samplerCube u_envCubeMap;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;

  void main() {
    vec3 viewDir = normalize(u_ViewPosition - v_PositionInWorld);
    vec3 reflectDir = reflect(-viewDir, normalize(v_Normal));
    vec3 reflectColor = textureCube(u_envCubeMap, reflectDir).rgb;
    gl_FragColor = vec4(reflectColor, 1.0);
  }
`;
