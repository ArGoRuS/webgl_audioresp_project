window.onload = function(){
	var width = window.innerWidth;
	var height = window.innerHeight;
	var canvas = document.getElementById('canvas');
	
	canvas.setAttribute('width', width);
	canvas.setAttribute('height', height);
	
	var properties = {
		rotationX: 0,
		rotationY: 0,
		rotationZ: 0,
		positionX: 0,
		positionY: 0,
		positionZ: 0,
		curvePositionZ: 0
	}
	
	var gui = new dat.GUI();
	gui.add(properties, 'rotationX').min(-0.2).max(0.2).step(0.001);
	gui.add(properties, 'rotationY').min(-0.2).max(0.2).step(0.001);
	gui.add(properties, 'rotationZ').min(-0.2).max(0.2).step(0.001);
	gui.add(properties, 'positionX').min(-5).max(5).step(0.1);
	gui.add(properties, 'positionY').min(-5).max(5).step(0.1);
	gui.add(properties, 'positionZ').min(-5).max(5).step(0.1);
	gui.add(properties, 'curvePositionZ').min(-5000).max(5000).step(10);
	
	var renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setClearColor(0x000000);
	
	var scene = new THREE.Scene();
	
	var camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 10000);
	camera.position.set(0, 0, 1000);
	
	var light = new THREE.AmbientLight(0xffffff);
	scene.add(light);
	
	var geometry = new THREE.SphereGeometry(200, 12, 12);
	var material = new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: THREE.FaceColors});
	
	for(var i = 0; i < geometry.faces.length; i++)
	{
		geometry.faces[i].color.setRGB(Math.random(), Math.random(), Math.random());
	}
	
	
	var mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
	
	/* var curve = new THREE.ArcCurve(0, 0, 300, 0, 90*Math.PI/180, true);
	var points = curve.getSpacedPoints(60);
	var path = new THREE.Path();
	var curve_geometry = path.createGeometry(points); */
	var circlesGeometry = new THREE.Geometry();
	var cLength = 2*Math.PI;
	for(var j = 0; j < cLength-.1; j += cLength/100) 
	{
		var v = new THREE.Vector3();
		v.set( 400*Math.cos(j), 400*Math.sin(j), 0);
		circlesGeometry.vertices.push(v);
	}
	circlesGeometry.vertices.push(circlesGeometry.vertices[0].clone());
	var curve_material = new MeshLineMaterial({
		useMap: false,
		color: new THREE.Color("rgb(255,0,0)"),
		opacity: 0.2,
		dashArray: new THREE.Vector2( 10, 5 ),
		resolution: new THREE.Vector2(width, height),
		sizeAttenuation: true,
		lineWidth: 10,
		near: camera.near,
		far: camera.far,
		depthWrite: false,
		depthTest: false,
		alphaTest: 0.1,
		transparent: true,
		side: THREE.DoubleSide	
	});
	var curve_line = new MeshLine();
	curve_line.setGeometry(circlesGeometry);
	var curve_mesh = new THREE.Mesh(curve_line.geometry, curve_material);
	scene.add(curve_mesh);
	
	function loop()
	{
		mesh.rotation.x += properties.rotationX;
		mesh.rotation.y += properties.rotationY;
		mesh.rotation.z += properties.rotationZ;
		mesh.position.x += properties.positionX;
		mesh.position.y += properties.positionY;
		mesh.position.z += properties.positionZ;
		curve_mesh.position.set(0, 0, properties.curvePositionZ);
		
		renderer.render(scene, camera);	
		requestAnimationFrame(function(){loop();});
	}
	
	loop();
}