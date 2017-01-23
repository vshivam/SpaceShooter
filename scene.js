var PAUSED = false;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var container, stats;
var camera, scene, renderer;
var orientationAvailable = false;
var showAxisAndStats = false;
/*
init();
animate();
*/
function init() {
    clock = new THREE.Clock();
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    // scene.fog = new THREE.Fog(0xf2e0c3, 200,950);
    addCamera();
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    createLights();
    loadStarsTexture();
    createSky();
    addAirPlane();
    createParticles();

    if (showAxisAndStats) {
        var axisHelper = new THREE.AxisHelper(1000);
        scene.add(axisHelper);
        stats = new Stats();
        container.appendChild(stats.dom);
    }

    /*
    controls.target.set(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    controls.noPan = true;
    controls.noZoom = true;
    */


    window.addEventListener('deviceorientation', setOrientationControls, true);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keyup', doSomethingOnKeyPress, true);
}

function sceneClickListener(e){
  airplane.fireMissile();
}

function playPause(){
 togglePauseBanner();
}

function animate() {
    airplane.pilot.updateHairs();
    airplane.rotatePropeller();
    sky.updateShootingStars();
    sky.updateClouds();
    sky.updateMissiles();
    sky.detectCollisions();
    requestAnimationFrame(animate);
    // stats.begin();
    render();
    // stats.end();
}

function render() {
    if (!PAUSED) {
        controls.update(clock.getDelta());
        if (orientationAvailable)
            effect.render(scene, camera);
        else {
            renderer.render(scene, camera);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    if (orientationAvailable)
        effect.setSize(window.innerWidth, window.innerHeight);
    else
        renderer.setSize(window.innerWidth, window.innerHeight);
    if (controls.handleResize)
        controls.handleResize();
}

function doSomethingOnKeyPress(e) {
    var key = e.keyCode ? e.keyCode : e.which;
    if (key == 32) {
        airplane.fireMissile();
    }
}

function setOrientationControls(e) {
    console.log(e);
    if (!e.alpha) {
        return;
    }

    orientationAvailable = true;

    effect = new THREE.StereoEffect(renderer);
    effect.eyeSeparation = 10;
    effect.setSize(window.innerWidth, window.innerHeight);

    controls = new THREE.DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();
    controls.noPan = true;
    controls.noZoom = true;

    renderer.domElement.addEventListener('click', fullscreen, true);
    window.removeEventListener('deviceorientation', setOrientationControls, true);
}

function fullscreen() {
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    }
    renderer.domElement.removeEventListener('click', fullscreen, true);
    container.addEventListener('click', sceneClickListener, true);
}


Myo.on('imu', function(data){
  if(typeof M.center !== 'undefined'){
    var euler = M.getCenteredPYR();
    //airplane.mesh.rotation.y = (90 * Math.PI/180) + euler[1];
    airplane.mesh.rotation.z = -euler[0];
    // airplane.mesh.rotation.z = (90 * Math.PI/2) + euler[2];
  }

  var three_quat = utils.getThreeJSQuat({
    x : data.x, 
    y : data.y, 
    z : data.z, 
    w : data.w
  });

  // var e = utils.getEulerAngles(three_quat);
  // airplane.mesh.rotateX(e[0]);
});

Myo.on('collision', function(data){
    if(data == true && typeof airplane !== 'undefined'){
        airplane.fireMissile();
    }
});


