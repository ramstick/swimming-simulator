function cross_product(v1, v2) {

    return {
        x: (v1.y * v2.z) - (v1.z * v2.y),
        y: (v1.z * v2.x) - (v1.x * v2.z),
        z: (v1.x * v2.y) - (v1.y * v2.x),
    }

}

function normalize_vector(v) {

    var l = Math.sqrt((v.x) ** 2 + (v.y) ** 2 + (v.z) ** 2);

    return {
        x: v.x / l,
        y: v.y / l,
        z: v.z / l,
    }

}

/**
 * 
 * @param {Array<Float>} mesh_vertices - The mesh vertices to calculate normals for
 */

function caculateNormals(mesh_vertices) {
    var out = new Array();
    for (var i = 0; i < mesh_vertices.length; i += 9) {
        const pointB = { x: mesh_vertices[i + 3] - mesh_vertices[i], y: mesh_vertices[i + 4] - mesh_vertices[i + 1], z: mesh_vertices[i + 5] - mesh_vertices[i + 2] };
        const pointC = { x: mesh_vertices[i + 6] - mesh_vertices[i], y: mesh_vertices[i + 7] - mesh_vertices[i + 1], z: mesh_vertices[i + 8] - mesh_vertices[i + 2] };
        const yee = normalize_vector(cross_product(pointB, pointC));
        out.push(yee.x, yee.y, yee.z);
        out.push(yee.x, yee.y, yee.z);
        out.push(yee.x, yee.y, yee.z);
    }
    return out;

}

/**
 * Generate buffers for a given mesh
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {Float32Array} mesh_vertices 
 */
function initBuffers(gl, mesh_vertices) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh_vertices), gl.STATIC_DRAW);

    const v_norms = caculateNormals(mesh_vertices);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_norms), gl.STATIC_DRAW);

    console.log(v_norms);
    return {
        position: positionBuffer,
        normal: normalBuffer,
        num_vert: mesh_vertices.length / 3,
    };

}




var v_s_source = `
attribute vec4 a_pos;
attribute vec4 a_nor;
varying vec4 v_col;
uniform mat4 modelViewMatrix;
uniform mat4 projMatrix;
void main(){
    gl_Position = projMatrix*modelViewMatrix * a_pos;
    v_col = vec4((dot((modelViewMatrix*a_nor).xyz, vec3(-1.0,0.0,0.0))/2.0 + .5) * vec3(1.0,1.0,1.0),1.0) + vec4(0.1,0.1,0.1,0.0);
}`;

var f_s_source = `
    precision mediump float;

    varying vec4 v_col;

    void main(){
        gl_FragColor = v_col;
    }

`


function drawScene(gl, program_info, buffers, camera_matrix, dt) {
    gl.clearColor(0, 0, 0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DATA_BUFFER_BIT)

    const fieldOfView = 90 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.79;
    const zFar = 10000.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            program_info.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            program_info.attribLocations.vertexPosition);
    }

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            program_info.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            program_info.attribLocations.vertexNormal);
    }

    gl.useProgram(program_info.program);
    gl.uniformMatrix4fv(
        program_info.uniformLocations.modelViewMatrix,
        false,
        camera_matrix);

    gl.uniformMatrix4fv(
        program_info.uniformLocations.projMatrix,
        false,
        projectionMatrix); {
        const offset = 0;
        const vertexCount = buffers.num_vert;
        gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }




}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}