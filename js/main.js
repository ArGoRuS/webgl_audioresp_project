var WE_audio_visualizer = (function($, createjs) {
    var _ = {};
	var properties = { schemeColor: '#999', gColor: ['200','0','0'] };
	var powerS = 0, gColor = ['280','0','0'];
	var bSum = 0, audioMaxV = 0, audioPeakV = 1, maxbSum = 0, bSumHistory = [];
	var fpsC = 0, fpsR = 0, fpsCap = 60;
	var audioS = [], newaudioS = [];
	var parentWidth, parentHeight, canvas, canvas2, ctx, canvasOverlay, overctx, glctx;
	var renderer, scene, camera, light;
	var barAmount = 60, angle = 0, histSize = 30;
		
	var framesCounter = setInterval(function()
	{
		fpsR = fpsC;
		fpsC = 0;
	}, 1000);	
	
    var init = function() {
		parentWidth = window.innerWidth;
		parentHeight = window.innerHeight;
		canvas = document.getElementById("canvas");
		canvas2 = document.getElementById("canvas2");
		canvasOverlay = document.getElementById("canvasOverlay");
		ctx = canvas2.getContext('2d');
		overctx = canvasOverlay.getContext('2d');
		glctx = canvas.getContext('webgl');
		for(var i = 0; i < histSize; i++)
		{
			bSumHistory[i] = 0;
		}

		canvas.setAttribute('width', parentWidth);
		canvas.setAttribute('height', parentHeight);
		
		renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
		renderer.setClearColor(0x000000, 0);
		
		scene = new THREE.Scene();		
		camera = new THREE.PerspectiveCamera(45, parentWidth/parentHeight, 1, 6000);
		camera.position.set(0, 0, 1000);
		camera.focus = 100;
		light = new THREE.AmbientLight(0xffffff);
		scene.add(light);
		scene.fog = new THREE.Fog( 0xffffff, 1, 1000 );
		
		cLength = 2*Math.PI;
		//Creation of zero-length bars
		for(var i=0; i < barAmount*2; i++)
		{
			var circlesGeometry = new THREE.Geometry();
			if(i < barAmount)
			{
				for(var j = 0; j < (cLength*0)/360; j += cLength/360) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j), 300*Math.sin(j), 0);
					circlesGeometry.vertices.push(v);
				}
			}
			else
			{
				for(var j = cLength/2; j < (cLength*0)/360 + cLength/2; j += cLength/360) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j), 300*Math.sin(j), 0);
					circlesGeometry.vertices.push(v);
				}
			}
			var curve_material = new MeshLineMaterial({
				useMap: false,
				color: new THREE.Color("rgb(255,0,0)"),
				opacity: 0.2,
				dashArray: new THREE.Vector2( 10, 5 ),
				resolution: new THREE.Vector2(parentWidth, parentHeight),
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
			curve_mesh.name = "circle" + i;
			scene.add(curve_mesh);
			if (i < barAmount) curve_mesh.position.z = -1900 + 50*i;
			else curve_mesh.position.z = -1900 + 50*(i-barAmount);
		}
		
		//GENERAL CIRCLE
 		for(var i=0; i < 2; i++)
		{
			var circlesGeometry = new THREE.Geometry();
			if( i == 0) 
				for(var j = 0; j < cLength/4; j += cLength/360) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j), 300*Math.sin(j), 0);
					circlesGeometry.vertices.push(v);
				}
			else 
				for(var j = cLength/2; j < (3*cLength)/4; j += cLength/360) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j), 300*Math.sin(j), 0);
					circlesGeometry.vertices.push(v);
				}
			var curve_material = new MeshLineMaterial({
				useMap: false,
				color: new THREE.Color("hsl(280,100%,100%)"),
				opacity: 1,
				dashArray: new THREE.Vector2( 10, 5 ),
				resolution: new THREE.Vector2(parentWidth, parentHeight),
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
			curve_mesh.name = "circleX" + i;
			scene.add(curve_mesh);
			curve_mesh.position.z = -1900;
		}
		
		_.listening();
        //createjs.Ticker.setFPS(fpsCap);
        //createjs.Ticker.addEventListener("tick", _.draw);
		canvas.style.display = "none";
		window.requestAnimationFrame(_.draw);
    }
	
	_.draw = function() 
	{
		fpsC += 1;
		powerS = 0;
		var CURbSum = 0;
		angle += cLength/720;
		if(angle > 360) angle -= 360;
		for(var i = 0; i<audioS.length; ++i)
		{
			if(i < 5) CURbSum += audioS[i];
			else if(i >= audioS.length/2 && i < audioS.length/2 + 5) CURbSum += audioS[i];
			powerS += audioS[i];
		}
		bSum /= 5;
		bSum = 0.3*bSum + 0.7*CURbSum;
		bSum = Math.round(bSum*1000)/1000;
		if(bSum > maxbSum) maxbSum = bSum;
		if(bSum > 6) bSum = 6;
		bSumHistory.splice(-1,1);
		bSumHistory.unshift(bSum);
		
		canvas2.width = canvas2.width;
		ctx.globalCompositeOperation = 'source-over';
		for(var i = 0; i < 2; i++)
		{
			var circlesGeometry = new THREE.Geometry();
			if( i == 0)
			{				
				for(var j = 0; j < (cLength*(bSum*359/6 + 1))/720; j += cLength/720) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j+angle), 300*Math.sin(j+angle), 0);
					circlesGeometry.vertices.push(v);
					v = undefined;
				}
			}
			else
			{
				for(var j = cLength/2; j < ((cLength*(bSum*359/6 + 1))/720 + cLength/2); j += cLength/720) 
				{
					var v = new THREE.Vector3();
					v.set( 300*Math.cos(j+angle), 300*Math.sin(j+angle), 0);
					circlesGeometry.vertices.push(v);
					v = undefined;
				}
			}
			var mesh = scene.getObjectByName("circleX" + i);
			var curve_line = new MeshLine();
			curve_line.setGeometry(circlesGeometry);
			var new_mesh = new THREE.Mesh(curve_line.geometry, mesh.material);
			scene.remove(mesh);
			new_mesh.name = "circleX" + i;
			scene.add(new_mesh);
			new_mesh.position.z = -1900;
			mesh.geometry.dispose();
			mesh.material.dispose();
			circlesGeometry.dispose();
			curve_line.geometry.dispose();
		}
		//Move trace-bars
		for(var i=0; i < barAmount*2; i++)
		{
			var mesh = scene.getObjectByName("circle" + i);
			mesh.position.z += 10;
			if(i%5 == 0)
			{
				mesh.material.uniforms.opacity.value = 0.4 + 0.1*bSum;
				mesh.material.uniforms.color.value = new THREE.Color("hsl("+gColor[0]+", 100%, "+(40+Math.round(bSum*10))+"%)");
			}
			else
			{
				mesh.material.uniforms.opacity.value = 0.4;
				mesh.material.uniforms.color.value = new THREE.Color("hsl("+gColor[0]+", 100%, 40%)");
			}
			if(mesh.position.z >= 1100)
			{
				if(i < barAmount)	var gmesh = scene.getObjectByName("circleX0");
				else var gmesh = scene.getObjectByName("circleX1");
				var new_mesh = new THREE.Mesh(gmesh.geometry, mesh.material);
				mesh.geometry.dispose();
				mesh.material.dispose();
				scene.remove(mesh);
				new_mesh.name = "circle" + i;
				scene.add(new_mesh);
				new_mesh.position.z = -1900;
				gmesh.geometry.dispose();
			}
		}
		//redraw scene
		renderer.render(scene, camera);
		renderer.renderLists.dispose();
		ctx.filter = "brightness("+(100+bSum*30)+"%)";
		ctx.drawImage(canvas, 0, 0);
		//update center circle
		for(var i = 0; i < histSize; i++)
		{
			ctx.beginPath();
			//ctx.fillStyle = "hsl("+gColor[0]+",100%,"+(10+Math.round(bSumHistory[59-i]*15/30)*30)+"%)";
			var k = bSumHistory[i]/6;
			ctx.fillStyle = "rgba(255,255,255," + k/10 + ")";
			ctx.arc(parentWidth/2, parentHeight/2, 130-130/histSize*i, 0, 2*Math.PI, false);
			ctx.fill();
		}
		var grad = ctx.createRadialGradient(parentWidth/2, parentHeight/2, 0, parentWidth/2, parentHeight/2, Math.max(parentWidth/2, parentHeight/2));
		grad.addColorStop(0, "rgba(255,255,255,1)");
		grad.addColorStop(0.15, "rgba(255,255,255,1)");
		grad.addColorStop(0.5, "rgba(255,255,255,1)");
		grad.addColorStop(1, "rgba(255,255,255,0.2)");
		ctx.fillStyle = grad;
		ctx.globalCompositeOperation = 'source-in';
		ctx.fillRect(0,0,parentWidth,parentHeight);
		ctx.fillStyle = "hsl("+gColor[0]+",100%,60%)";
		ctx.fillRect(0,0,parentWidth,parentHeight);
		//update debug info
		var debug1 = document.getElementById('dbg1');
		var debug2 = document.getElementById('dbg2');
		var debug3 = document.getElementById('dbg3');
		var debug4 = document.getElementById('dbg4');
		var debug5 = document.getElementById('dbg5');
		var debug6 = document.getElementById('dbg6');
		var debug7 = document.getElementById('dbg7');
		var debug8 = document.getElementById('dbg8');
		var debug9 = document.getElementById('dbg9');
		var debug10 = document.getElementById('dbg10');
		debug1.textContent = '_____________FPS: ' + fpsR;
		debug2.textContent = '_____________PowerS: ' + Math.round(powerS) + " GC: " + gColor[0];
		debug3.textContent = '_____________Center[' + parentWidth/2 + ':' + parentHeight/2 + '], max:  ' + maxbSum + ', BassSum: ' + bSum;
		debug4.textContent = 'WebGLRenderer: Geometries - ' + renderer.info.memory.geometries;
		debug6.textContent = 'WebGLRenderer: Textures - ' + renderer.info.memory.textures;
		debug7.textContent = 'WebGLRenderer: Calls - ' + renderer.info.render.calls;
		debug8.textContent = 'WebGLRenderer: Triangles - ' + renderer.info.render.triangles;
		debug9.textContent = 'WebGLRenderer: Points - ' + renderer.info.render.points;
		debug10.textContent = 'WebGLRenderer: Lines - ' + renderer.info.render.lines;
		window.requestAnimationFrame(_.draw);
    }
	
	
	window.wallpaperPropertyListener = 
	{
		applyUserProperties: function(properties) 
		{
			if (properties.schemecolor) 
			{
				var schemeColor = properties.schemecolor.value.split(' ');
				schemeColor = schemeColor.map(function(c) {return Math.ceil(c * 255);});
				properties.schemeColor = schemeColor;
			}
			if (properties.fpsCap)
			{
				if (properties.fpsCap.value !== "")
				{ 
					fpsCap = properties.fpsCap.value; 
					createjs.Ticker.setFPS(fpsCap);
				}
				else fpsCap = 60;
			}
			if (properties.gColor) 
			{
				var cc = [];
				var cc = properties.gColor.value.split(' ').map(function(c) 
				{
					return Math.ceil(c * 255);
				});
				gColor = rgb2hsl(cc);
			}
		}
	};

    _.listening = function() 
	{
        if (window.wallpaperRegisterAudioListener) 
		{
            window.wallpaperRegisterAudioListener(function(data) 
			{
                newaudioS = AudioCorrection(data);
                if (audioS.length == newaudioS.length) 
				{
                    createjs.Tween.get(audioS, {
                        override: true
                    }).to(newaudioS, 50);
                } else {
                    audioS = newaudioS;
                }
            });
        } 
		else 
		{
            setInterval(function() 
			{
                audioS = [];
                for (x = 0; x < 128; x++) 
				{
                    audioS.push(Math.random() * 1);
                }
            }, 75);
        }
    }

    function AudioCorrection(data) 
	{
        var pinkNoise = [1.1760367470305, 0.85207379418243, 0.68842437227852, 0.63767902570829, 0.5452348949654, 0.50723325864167, 0.4677726234682, 0.44204182748767, 0.41956517802157, 0.41517375040002, 0.41312118577934, 0.40618363960446, 0.39913707474975, 0.38207008614508, 0.38329789106488, 0.37472136606245, 0.36586428412968, 0.37603017335105, 0.39762590761573, 0.39391828858591, 0.37930603769622, 0.39433365764563, 0.38511504613859, 0.39082579241834, 0.3811852720504, 0.40231453727161, 0.40244151133175, 0.39965366884521, 0.39761103827545, 0.51136400422212, 0.66151212038954, 0.66312205226679, 0.7416276690995, 0.74614971301133, 0.84797007577483, 0.8573583910469, 0.96382997811663, 0.99819377577185, 1.0628692615814, 1.1059083969751, 1.1819808497335, 1.257092297208, 1.3226521464753, 1.3735992532905, 1.4953223705889, 1.5310064942373, 1.6193923584808, 1.7094805527135, 1.7706604552218, 1.8491987941428, 1.9238418849406, 2.0141596921333, 2.0786429508827, 2.1575522518646, 2.2196355526005, 2.2660112509705, 2.320762171749, 2.3574848254513, 2.3986127976537, 2.4043566176474, 2.4280476777842, 2.3917477397336, 2.4032522546622, 2.3614180150678];
        audioMaxV = 0;
		for (var i = 0; i < data.length; i++) 
		{
            if(i < 64) data[i] /= pinkNoise[i];
			else data[i] /= pinkNoise[i-64];
			if(data[i] > audioMaxV) audioMaxV = data[i];
        }
		audioPeakV = audioPeakV * 0.99 + audioMaxV * 0.01;
		var olddata = [data.length];
		for(var i = 0; i < data.length; i++ ) 
		{
			data[i] /= audioPeakV;
			if(data[i] > 1.1) data[i] = 1.1;
			olddata[i] = data[i];
		}
		for(var i = 0; i < data.length; i++) 
		{
			if(i == 0) data[i] = (olddata[data.length-1]*2+olddata[i]*3+olddata[i+1]*2)/7;
			else if(i > 0 && i < 127) data[i] = (olddata[i-1]*2+olddata[i]*3+olddata[i+1]*2)/7;
			else data[i] = (olddata[i-1]*2+olddata[i]*3+olddata[0]*2)/7;
		}
        return data;
    }
	
	function onWindowResized() 
	{
		$("#canvas").attr({
            width: $(document).width(),
            height: $(document).height()
        });
		$("#canvas2").attr({
            width: $(document).width(),
            height: $(document).height()
        });
	}
    $(document).ready(function() 
	{
		onWindowResized();
		init();
    });
})(jQuery, createjs)