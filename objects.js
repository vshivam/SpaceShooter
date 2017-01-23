//COLORS
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    yellow: 0xffff00
};

var Space = function() {
    this.mesh = new THREE.Object3D();
    var skyGeo = new THREE.SphereGeometry(1000, 25, 25);
    // var texture = THREE.ImageUtils.loadTexture("img/space_3.jpg");
    var material = new THREE.MeshPhongMaterial({
        // map: texture,
        color: 0xf2e0c3
    });
    this.stars = new THREE.Mesh(skyGeo, material);
    this.stars.material.side = THREE.BackSide;
    this.mesh.add(this.stars);
}

var Cloud = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "cloud";
    var geom = new THREE.CubeGeometry(20, 20, 20);
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.pink,
    });

    var nBlocs = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < nBlocs; i++) {
        var m = new THREE.Mesh(geom.clone(), mat);
        m.position.x = i * 15;
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;
        var s = .1 + Math.random() * .9;
        m.scale.set(s, s, s);
        m.castShadow = true;
        m.receiveShadow = true;
        this.mesh.add(m);
        var position = this.getRandomXY();
        this.mesh.position.y = position.y;
        this.mesh.position.x = position.x;
        this.mesh.position.z = (-1) * (1000);
        var s = 1 + Math.random() * 2;
        this.mesh.scale.set(s, s, s);
    }
}

Cloud.prototype.getRandomXY = function() {
    var x = randomBetween((-1) * windowHalfX + 10, windowHalfX - 10);
    var y = randomBetween((-1) * windowHalfY + 10, windowHalfY - 10);

    return {
        'x': x,
        'y': y
    };
}

var Sky = function() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 6;
    this.clouds = [];
    this.addClouds();
    this.addShootingStars();
}

Sky.prototype.addClouds = function() {
    var self = this;
    var count = 0;

    function addNewCloud() {
        var c = new Cloud();
        self.clouds.push(c);
        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);
        self.mesh.add(c.mesh);
        if (count < self.nClouds) {
            count++;
            setTimeout(addNewCloud, randomBetween(3000, 10000))
        }
    }
    addNewCloud();
}

Sky.prototype.updateClouds = function() {
    var self = this;
    if (typeof this.clouds !== 'undefined') {
        for (var i = 0; i < this.nClouds; i++) {
            var s = this.clouds[i];
            if (typeof s !== 'undefined') {
                s.mesh.position.z += 5;
                if (s.mesh.position.z > airplane.mesh.position.z + 500) {
                    scene.remove(s.mesh);
                    sky.clouds.splice(i, 1);
                    var cloud = new Cloud();
                    sky.clouds.push(cloud);
                    scene.add(cloud.mesh);
                }
            }
        }
    }
}

var shootingStars;

Sky.prototype.addShootingStars = function() {
    this.numOfShootingStars = 10;
    shootingStars = new Array();
    enemyBoundingBoxes = new Array();
    for (var i = 0; i < this.numOfShootingStars; i++) {
        shootingStar = new ShootingStar();
        shootingStars.push(shootingStar);
        scene.add(shootingStar.mesh);
    }
}

Sky.prototype.updateShootingStars = function() {
    for (var i = 0; i < this.numOfShootingStars; i++) {
        var s = shootingStars[i];
        if (typeof s !== 'undefined') {
            s.mesh.position.y -= Math.cos(0.523599);
            s.mesh.position.z += s.speed;
            if (s.mesh.position.z > 1000) {
                scene.remove(s.mesh);
                shootingStars.splice(i, 1);
                var shootingStar = new ShootingStar();
                shootingStars.push(shootingStar);
                scene.add(shootingStar.mesh);
            }
        }
    }
}

Sky.prototype.updateMissiles = function() {
    if (typeof this.missiles === 'undefined')
        return;

    for (var i = 0; i < this.missiles.length; i++) {
        var missile = this.missiles[i];
        if (missile.mesh.position.z < -1000) {
            scene.remove(missile.mesh);
            this.missiles.splice(i, 1);
            continue;    
        } else {
            missile.mesh.position.z -= 50;
        }
    }
}

Sky.prototype.detectCollisions = function(){
	if(typeof sky === 'undefined' || typeof sky.missiles === 'undefined')
		return;
	for(var i=0; i<shootingStars.length; i++){
		for(var j=0; j<sky.missiles.length; j++){
			var missileBoundingBox = new THREE.Box3().setFromObject(sky.missiles[j].mesh);
			var shootingStarBoundingBox = new THREE.Box3().setFromObject(shootingStars[i].mesh);
			if(missileBoundingBox.intersectsBox(shootingStarBoundingBox)){
				particlesHolder.spawnParticles(shootingStars[i].mesh.position.clone(), 10, Colors.yellow, 15);
				scene.remove(shootingStars[i].mesh);
                shootingStars.splice(i, 1);
             	scene.remove(sky.missiles[j].mesh);
            	this.missiles.splice(i, 1);
            	var shootingStar = new ShootingStar();
                shootingStars.push(shootingStar);
                scene.add(shootingStar.mesh);
				console.log("collision detected");
			}
		}
	}
}

function randomBetween(min, max) {
    if (min < 0) {
        return min + Math.random() * (Math.abs(min) + max);
    } else {
        return min + Math.random() * max;
    }
}

var ShootingStar = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "shootingStar";
    /*
    var p = new THREE.BoxGeometry(10, 6, 20);
    var q = new THREE.BoxGeometry(10, 10, 20);
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.yellow
    });
    var head = new THREE.Mesh(p, mat);
    var tail = new THREE.Mesh(q, mat);
    tail.position.y = -6;
    tail.position.z = -10;
    this.mesh.add(head);
    this.mesh.add(tail);
    this.mesh.rotation.x = 30 * Math.PI / 180;
   
    this.mesh.scale.set(2, 2, 2);
    */
    var geom = new THREE.TetrahedronGeometry(64,2);
  	var mat = new THREE.MeshPhongMaterial({
	    color:Colors.yellow,
	    shininess:0,
	    specular:0x00ff00,
	    shading:THREE.FlatShading
  	});
  	this.mesh = new THREE.Mesh(geom,mat);
	var position = this.getRandomXY();
	this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = -1000;
    this.speed = this.getRandomSpeed();
}

ShootingStar.prototype.getRandomXY = function() {
    var x = randomBetween((-1) * 200 + 10, 200 - 10);
    var y = randomBetween((-1) * 200 + 10, 200 - 10);

    return {
        'x': x,
        'y': y
    };
}

ShootingStar.prototype.getRandomSpeed = function() {
    return randomBetween(5, 20);
}

var AirPlane = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "airPlane";

    // Create the cabin
    var geomCockpit = new THREE.BoxGeometry(50, 50, 60, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create Engine
    var geomEngine = new THREE.BoxGeometry(50, 50, 20, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.z = -40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create Tailplane
    var geomTailPlane = new THREE.BoxGeometry(5, 20, 15, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(0, 25, 35);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create Wing
    var geomSideWing = new THREE.BoxGeometry(150, 8, 40, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.position.set(0, 0, 0);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // Propeller
    var geomPropeller = new THREE.BoxGeometry(10, 10, 20, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // Blades
    var geomBlade = new THREE.BoxGeometry(20, 100, 1, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });
    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(0, 0, -8);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(0, 0, -50);
    this.mesh.add(this.propeller);

    // Pilot
    this.pilot = new Pilot();
    this.pilot.mesh.position.set(0, 40, 10);
    this.pilot.mesh.rotation.y = Math.PI / 2;
    this.mesh.add(this.pilot.mesh);
}

AirPlane.prototype.fireMissile = function() {
    if (typeof sky.missiles === 'undefined') {
        sky.missiles = [];
    }
    var missile = new Missile();
    missile.mesh.position.y = 80;
    missile.mesh.position.z = -50;
    sky.missiles.push(missile);
    scene.add(missile.mesh);
}

AirPlane.prototype.rotatePropeller = function() {
    this.propeller.rotation.z += 0.7;
}

var Missile = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'missile';
    var material = new THREE.MeshPhongMaterial({
        color: Colors.blue
    });
    var bodyGeom = new THREE.CylinderGeometry(40, 40, 140);
    var headGeom = new THREE.CylinderGeometry(40, 0, 40);
    var bodyMesh = new THREE.Mesh(bodyGeom, material);
    var headMesh = new THREE.Mesh(headGeom, material);
    headMesh.position.z = -12.5;
    bodyMesh.rotation.x = Math.PI / 2;
    headMesh.rotation.x = Math.PI / 2;
    this.mesh.add(headMesh);
    this.mesh.add(bodyMesh);
}

var Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    var bodyMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);

    this.mesh.add(body);

    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({
        color: Colors.pink
    });
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    var hairGeom = new THREE.BoxGeometry(4, 4, 4);
    var hairMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var hair = new THREE.Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
    var hairs = new THREE.Object3D();

    this.hairsTop = new THREE.Object3D();

    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0)
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z

    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function() {
    var hairs = this.hairsTop.children;

    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    this.angleHairs += 0.16;
}

var PauseBanner = function(){
	var self = this;
	this.mesh = new THREE.Object3D();
 	this.mesh.position.y = 80;
  	this.mesh.position.z = 100;
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder.mesh)
}

var Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.mesh.position.z = pos.z;
    particle.explode(pos,color, scale);
  }
}

var particlesPool = new Array();

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder.mesh)
}