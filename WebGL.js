var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    attribute vec4 a_Normal;
    attribute vec3 a_Tagent;
    attribute vec3 a_Bitagent;
    attribute float a_crossTexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
        //create TBN matrix 
        vec3 tagent = normalize(a_Tagent);
        vec3 bitagent = normalize(a_Bitagent);
        vec3 nVector;
        if( a_crossTexCoord > 0.0){
          nVector = cross(tagent, bitagent);
        } else{
          nVector = cross(bitagent, tagent);
        }
        v_TBN = mat4(tagent.x, tagent.y, tagent.z, 0.0, 
                           bitagent.x, bitagent.y, bitagent.z, 0.0,
                           nVector.x, nVector.y, nVector.z, 0.0, 
                           0.0, 0.0, 0.0, 1.0);
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform vec3 u_Color;
    uniform float u_shininess;
    uniform sampler2D u_Sampler0;
    uniform highp mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;
    void main(){
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color.rgb;
        vec3 diffuseLightColor = u_Color.rgb;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        //normal vector from normal map
        vec3 nMapNormal = normalize( texture2D( u_Sampler0, v_TexCoord ).rgb * 2.0 - 1.0 );
        vec3 normal = normalize( vec3( u_normalMatrix * v_TBN * vec4( nMapNormal, 1.0) ) );
        
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
    
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

function createProgram(gl, vertexShader, fragmentShader) {
  //create the program and attach the shaders
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  //if success, return the program. if not, log the program info, and delete it.
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }
  alert(gl.getProgramInfoLog(program) + "");
  gl.deleteProgram(program);
}

function compileShader(gl, vShaderText, fShaderText) {
  //////Build vertex and fragment shader objects
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  //The way to  set up shader text source
  gl.shaderSource(vertexShader, vShaderText);
  gl.shaderSource(fragmentShader, fShaderText);
  //compile vertex shader
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log("vertex shader ereror");
    var message = gl.getShaderInfoLog(vertexShader);
    console.log(message); //print shader compiling error message
  }
  //compile fragment shader
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.log("fragment shader ereror");
    var message = gl.getShaderInfoLog(fragmentShader);
    console.log(message); //print shader compiling error message
  }

  /////link shader to program (by a self-define function)
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  //if not success, log the program info, and delete it.
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
  }

  return program;
}

function main() {
  ///// Step 1. get the canvas
  var canvas = document.getElementById("webgl");

  ///// Step 2. get the context for draw
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  ///// Step 3. compile the shader program (vertex and framgment shader)
  let renderProgram = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  ///// Step 4. what program you want to use (you may have multiple shader program later)
  gl.useProgram(renderProgram);

  // var n = initVertexBuffers(gl, renderProgram);
  ///// 5. prepare the vertices for draw (we just draw 2D object here)
  /////    These are vertices of a triangle in 2D
  //   var vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  var vertices = new Float32Array([0, -0.5, -0.5, 0.5, 0.5, 0.5]);

  var n = 3; /// number of vertices

  var vertexBuffer = gl.createBuffer(); ///// create a vertex buffer to store the triangle vertices
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
  }

  ///// bind buffer and pass the vertices data
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  ///// get the reference of the variable in the shader program
  renderProgram.a_Position = gl.getAttribLocation(renderProgram, "a_Position");
  if (renderProgram.a_Position < 0) console.log("renderProgram.a_Position < 0"); //check you get the refernce of the variable

  gl.vertexAttribPointer(renderProgram.a_Position, 2, gl.FLOAT, false, 0, 0); //setting of the vertex buffer
  gl.enableVertexAttribArray(renderProgram.a_Position); //enable the vetex buffer

  ///// 6. clear the scrren by designated background color
  gl.clearColor(0.0, 1.0, 0.0, 1.0); //background color
  gl.clear(gl.COLOR_BUFFER_BIT); // clear

  ///// 7. draw the shape
  gl.drawArrays(gl.TRIANGLES, 0, n);
}
