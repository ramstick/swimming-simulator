const can_height = 1000;
const can_width = 1000;

const minX = -3,
    maxX = 3,
    minY = -3,
    maxY = 3,
    minZ = -3,
    maxZ = 3;

const scale = 0.125;
const noise_map_scale = 0.25;

var mesh;
var simpnoise = new SimplexNoise(3);
/**
 * Changable function to radomly generate a number at a point
 * 
 * @param {Number} x - X point
 * @param {Number} y - Y point
 * @param {Number} z - Z point
 * 
 * @return {Number} Generated value
 */

function meshFunct(x, y, z) {


    return simpnoise.noise3D(x * noise_map_scale, y * noise_map_scale, z * noise_map_scale) % 2;
}

function generateTerrain() {


    mesh = [];
    for (var x = minX; x <= maxX; x += scale) {
        for (var y = minY; y <= maxY; y += scale) {
            for (var z = minZ; z <= maxZ; z += scale) {

                const cube = [meshFunct(x, y, z), meshFunct(x + scale, y, z), meshFunct(x + scale, y + scale, z), meshFunct(x, y + scale, z), meshFunct(x, y, z + scale), meshFunct(x + scale, y, z + scale), meshFunct(x + scale, y + scale, z + scale), meshFunct(x, y + scale, z + scale)];
                const tris = computeCube(.1, cube, x, y, z, scale);
                for (var i = 0; i < tris.length; i++) {
                    mesh.push(tris[i][0][0], tris[i][0][1], tris[i][0][2], tris[i][1][0], tris[i][1][1], tris[i][1][2], tris[i][2][0], tris[i][2][1], tris[i][2][2]);
                }

            }
        }
    }
    console.log(mesh);
}



function main() {
    const canvas = document.getElementById("gl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("fuck");
        return;
    }

    var vert_shader = createShader(gl, gl.VERTEX_SHADER, v_s_source);
    var frag_shader = createShader(gl, gl.FRAGMENT_SHADER, f_s_source);

    var program = createProgram(gl, vert_shader, frag_shader);

    var program_info = {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, 'a_pos'),
            vertexNormal: gl.getAttribLocation(program, "a_nor"),
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
            projMatrix: gl.getUniformLocation(program, "projMatrix"),
        }
    }

    generateTerrain();

    const buffers = initBuffers(gl, mesh);

    console.log(buffers);

    var then = 0;
    var rot = 0;
    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        var cam_mat = mat4.create();

        mat4.translate(cam_mat, cam_mat, [0, 0, -2]);
        mat4.rotateY(cam_mat, cam_mat, rot);
        mat4.rotateX(cam_mat, cam_mat, rot);
        rot += 0.01;
        drawScene(gl, program_info, buffers, cam_mat, deltaTime);
        //console.log(rot);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}