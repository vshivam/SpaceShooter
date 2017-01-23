var ambientLight, hemisphereLight, shadowLight;
var space, sky, airplane, pause_banner;

function addCamera(){
  camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 200;
  camera.position.z = 500;
  scene.add(camera);
}

function createLights() {
  ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, 0.6)
  scene.add(hemisphereLight);
}

function loadStarsTexture(){
  var space = new Space();
  scene.add(space.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function addAirPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.75,0.75,0.75);
  airplane.mesh.position.y = 80;
  scene.add(airplane.mesh);
}

function togglePauseBanner(){
  if(typeof pause_banner === 'undefined'){
    var loader, material, plane;
    pause_banner = new PauseBanner();
    loader = new THREE.TextureLoader();
    loader.load("img/paused.jpg", function(texture){
      material = new THREE.MeshLambertMaterial({ map : texture });
      plane = new THREE.Mesh(new THREE.PlaneGeometry(500, 100), material);
      pause_banner.mesh.add(plane);
    });
    scene.add(pause_banner.mesh);
  } 
  if(!PAUSED){
    pause_banner.mesh.visible = true;
    setTimeout(function(){
      PAUSED = true;
    }, 500);
  } else {
    pause_banner.mesh.visible = false;
    PAUSED = false;
  }
}








