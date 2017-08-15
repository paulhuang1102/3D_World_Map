$(function() {
    const main = document.querySelector('.main');
    // console.log(main.offsetWidth)
    let worldMap;
    let mouse = {x: 0, y: 0};

    function Map() {
        this.width = main.offsetWidth;
        this.height = main.offsetHeight;

        this.viewAngle = 45;
        this.near = 0.1;
        this.far = 10000;
        this.cameraX = 0;
        this.cameraY = 350;
        this.cameraZ = 500;
        this.cameraLX = 0;
        this.cameraLY = 0;
        this.cameraLZ = 0;

        this.geo;
        this.scene = {};
        this.renderer = {};
        this.camera = {};
        this.controls = {};

        this.intersected = null;
    }

    Map.prototype = {

        init_d3: function() {
            let geoConfig = function() {
                this.projection = d3.geoMercator().scale(120).translate([450, 0]);
                this.path = d3.geoPath().projection(this.projection);
            };

            this.geo = new geoConfig();
        },

        init_three: function() {
            //*========================== support if
            if (Detector.webgl) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                this.renderer.setClearColor(0x888888);
            } else {
                this.renderer = new THREE.CanvasRenderer();
            }

            //support if ==========================*

            main.appendChild(this.renderer.domElement);
            this.renderer.setSize(this.width, this.height);

            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(this.viewAngle, this.width / this.height, this.near, this.far);
            this.camera.position.x = this.cameraX;
            this.camera.position.y = this.cameraY;
            this.camera.position.z = this.cameraZ;
            this.camera.lookAt({ x: this.cameraLX, y: 0, z: this.cameraLZ });

            // this.controls = new THREE.TrackballControls(this.camera);
            // this.controls.rotateSpeed = 1.0;
            // this.controls.zoomSpeed = 1.2;
            // this.controls.panSpeed = 0.8;
            // this.controls.noZoom = false;
            // this.controls.noPan = false;
            // this.controls.staticMoving = true;
            // this.controls.dynamicDampingFactor = 0.3;

        },

        addCountry: function(data) {
            let countries = [];

            for (let i in data.features) {
                let geoFeature = data.features[i];
                let properties = geoFeature.properties;
                let feature = this.geo.path(geoFeature);

                let mesh = transformSVGPathExposed(feature);
                for (let j in mesh) {
                    countries.push({ 'data': properties, 'mesh': mesh[j] })
                }
            }

            for (let i in countries) {
                let shape3d = new THREE.ExtrudeGeometry(countries[i].mesh, {
                    amount: 1,
                    bevelEnabled: false
                });

                let material = new THREE.MeshPhongMaterial({
                    color: this.getColor(countries[i].data),
                    opacity: 0.5,
                    transparent: true
                });

                let toAdd = new THREE.Mesh(shape3d, material);
                toAdd.name = countries[i].data.name;

                toAdd.rotation.x = Math.PI / 2;
                toAdd.translateX(-490);
                toAdd.translateY(50);
                toAdd.translateX(20);

                this.scene.add(toAdd);
            }
        },

        getColor: function(data) {
            switch (data.name) {
                case 'United Kingdom':
                    return 0x46a3ff;
                case 'Canada':
                    return 0xff3b3b;
                case 'Thailand':
                    return 0x0dff0d;
                default:
                    return 0xd8d8d8;
            }

            // let multiplier = 0;
            //
            // for (let i = 0; i < 3; i++) {
            //     multiplier += data.iso_a3.charCodeAt(i);
            // }
            //
            // multiplier = (1.0 / 366) * multiplier;
            // return multiplier * 0xffffff
        },

        addLight: function(x, y, z, intensity, color) {
            let pointLight = new THREE.PointLight(color);
            pointLight.position.x = x;
            pointLight.position.y = y;
            pointLight.position.z = z;
            pointLight.intensity = intensity;
            this.scene.add(pointLight);
        },

        addPlane: function(x, y, z, color) {
            let planeGeo = new THREE.CubeGeometry(x, y, z);
            let planeMat = new THREE.MeshLambertMaterial({ color: color });
            let plane = new THREE.Mesh(planeGeo, planeMat);

            // plane.rotation.y = -Math.PI / 2;
            this.scene.add(plane);
        },

        setCameraPosition: function(x, y, z, lx, lz) {
            this.cameraX = x;
            this.cameraY = y;
            this.cameraZ = z;
            this.cameraLX = lx;
            this.cameraLZ = lz;
        },

        moveCamera: function() {
            let speed = 0.2;
            let targetX = (this.cameraX = this.camera.position.x) * speed;
            let targetY = (this.cameraY = this.camera.position.y) * speed;
            let targetZ = (this.cameraZ = this.camera.position.z) * speed;

            this.camera.position.x += targetX;
            this.camera.position.y += targetY;
            this.camera.position.z += targetZ;
            this.camera.lookAt({ x: this.cameraLX, y: 0, z: this.cameraLZ });
        },

        animate: function() {
            if (this.cameraX !== this.camera.position.x ||
                this.cameraY !== this.camera.position.y ||
                this.cameraZ !== this.camera.position.z) {
                this.moveCamera();
            }
            let vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(vector, this.camera);
            let intersects =raycaster.intersectObjects(this.scene.children);

            let objects = this.scene.children;
            if (intersects.length >= 1) {
                if (this.intersected != intersects[0].object) {
                    if (this.intersected) {
                        for (let i = 0; i < objects.length; i++) {
                            if (objects[i].name === this.intersected.name) {
                                objects[i].material.opacity = 0.5;
                                objects[i].scale.z = 1;
                            }
                        }
                        this.intersected = null;
                    }
                }
                this.intersected = intersects[0].object;
                for (let i = 0; i < objects.length; i++) {
                    if (objects[i].name == this.intersected.name) {
                        objects[i].material.opacity = 1.0;
                        objects[i].scale.z = 5;
                    }
                }

            } else if (this.intersected) {
                for (let i = 0; i < objects.length; i++) {
                    if (objects[i].name == this.intersected.name) {
                        objects[i].material.opacity = 0.5;
                        objects[i].scale.z = 1;
                    }
                }
                this.intersected = null;
            }
            this.render();
        },

        render: function() {
            // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.renderer.render(this.scene, this.camera);
        }


    };

    function init() {
        $.when($.getJSON('../assets/countries.json')).then((data) => {
            console.log(data);
            worldMap = new Map();
            worldMap.init_d3();
            worldMap.init_three();
            // worldMap.addPlane(1400, 700, 30, 0xEEEEEE);
            worldMap.addCountry(data);
            worldMap.addLight(0, 3000, 0, 1.0, 0xFFFFFF);


            let onFrame = window.requestAnimationFrame;

            function tick(timestamp) {
                worldMap.animate();

                if (worldMap.intersected) {
                    $('#country-name').html(worldMap.intersected.name);
                } else {
                    $('#country-name').html("move mouse over map");
                }

                onFrame(tick);
            }

            onFrame(tick);
            main.addEventListener('mousemove', mouseMove, false);
        });

    }

    function mouseMove(e) {
        e.preventDefault();
       mouse.x = ((e.clientX - main.offsetLeft ) / main.offsetWidth) * 2 - 1;
       mouse.y = - ((e.clientY - main.offsetTop ) / main.offsetHeight) * 2 + 1;
    }


    window.onunload = init();
});