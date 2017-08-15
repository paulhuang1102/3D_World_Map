'use strict';

$(function () {
    var main = document.querySelector('.main');
    // console.log(main.offsetWidth)
    var worldMap = void 0;
    var mouse = { x: 0, y: 0 };

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

        init_d3: function init_d3() {
            var geoConfig = function geoConfig() {
                this.projection = d3.geoMercator().scale(120).translate([450, 0]);
                this.path = d3.geoPath().projection(this.projection);
            };

            this.geo = new geoConfig();
        },

        init_three: function init_three() {
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

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

            // this.controls = new THREE.TrackballControls(this.camera);
            // this.controls.rotateSpeed = 1.0;
            // this.controls.zoomSpeed = 1.2;
            // this.controls.panSpeed = 0.8;
            // this.controls.noZoom = false;
            // this.controls.noPan = false;
            // this.controls.staticMoving = true;
            // this.controls.dynamicDampingFactor = 0.3;
        },

        addCountry: function addCountry(data) {
            var countries = [];

            for (var i in data.features) {
                var geoFeature = data.features[i];
                var properties = geoFeature.properties;
                var feature = this.geo.path(geoFeature);

                var mesh = transformSVGPathExposed(feature);
                for (var j in mesh) {
                    countries.push({ 'data': properties, 'mesh': mesh[j] });
                }
            }

            for (var _i in countries) {
                var shape3d = new THREE.ExtrudeGeometry(countries[_i].mesh, {
                    amount: 1,
                    bevelEnabled: false
                });

                var material = new THREE.MeshPhongMaterial({
                    color: this.getColor(countries[_i].data),
                    opacity: 0.5,
                    transparent: true
                });

                var toAdd = new THREE.Mesh(shape3d, material);
                toAdd.name = countries[_i].data.name;

                toAdd.rotation.x = Math.PI / 2;
                toAdd.translateX(-490);
                toAdd.translateY(50);
                toAdd.translateX(20);

                this.scene.add(toAdd);
            }
        },

        getColor: function getColor(data) {
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

        addLight: function addLight(x, y, z, intensity, color) {
            var pointLight = new THREE.PointLight(color);
            pointLight.position.x = x;
            pointLight.position.y = y;
            pointLight.position.z = z;
            pointLight.intensity = intensity;
            this.scene.add(pointLight);
        },

        addPlane: function addPlane(x, y, z, color) {
            var planeGeo = new THREE.CubeGeometry(x, y, z);
            var planeMat = new THREE.MeshLambertMaterial({ color: color });
            var plane = new THREE.Mesh(planeGeo, planeMat);

            // plane.rotation.y = -Math.PI / 2;
            this.scene.add(plane);
        },

        // setCameraPosition: function(x, y, z, lx, lz) {
        //     this.cameraX = x;
        //     this.cameraY = y;
        //     this.cameraZ = z;
        //     this.cameraLX = lx;
        //     this.cameraLZ = lz;
        // },

        // moveCamera: function() {
        //     let speed = 0.2;
        //     let targetX = (this.cameraX = this.camera.position.x) * speed;
        //     let targetY = (this.cameraY = this.camera.position.y) * speed;
        //     let targetZ = (this.cameraZ = this.camera.position.z) * speed;
        //
        //     this.camera.position.x += targetX;
        //     this.camera.position.y += targetY;
        //     this.camera.position.z += targetZ;
        //     this.camera.lookAt({ x: this.cameraLX, y: 0, z: this.cameraLZ });
        // },

        animate: function animate() {
            // if (this.cameraX !== this.camera.position.x ||
            //     this.cameraY !== this.camera.position.y ||
            //     this.cameraZ !== this.camera.position.z) {
            //     this.moveCamera();
            // }
            var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(vector, this.camera);
            var intersects = raycaster.intersectObjects(this.scene.children);

            var objects = this.scene.children;
            if (intersects.length >= 1) {
                if (this.intersected != intersects[0].object) {
                    if (this.intersected) {
                        for (var i = 0; i < objects.length; i++) {
                            if (objects[i].name === this.intersected.name) {
                                objects[i].material.opacity = 0.5;
                                objects[i].scale.z = 1;
                            }
                        }
                        this.intersected = null;
                    }
                }
                this.intersected = intersects[0].object;
                for (var _i2 = 0; _i2 < objects.length; _i2++) {
                    if (objects[_i2].name == this.intersected.name) {
                        objects[_i2].material.opacity = 1.0;
                        objects[_i2].scale.z = 5;
                    }
                }
            } else if (this.intersected) {
                for (var _i3 = 0; _i3 < objects.length; _i3++) {
                    if (objects[_i3].name == this.intersected.name) {
                        objects[_i3].material.opacity = 0.5;
                        objects[_i3].scale.z = 1;
                    }
                }
                this.intersected = null;
            }
            this.render();
        },

        render: function render() {
            // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.renderer.render(this.scene, this.camera);
        }

    };

    function init() {
        $.when($.getJSON('data/countries.json')).then(function (data) {
            console.log(data);
            worldMap = new Map();
            worldMap.init_d3();
            worldMap.init_three();
            // worldMap.addPlane(1400, 700, 30, 0xEEEEEE);
            worldMap.addCountry(data);
            worldMap.addLight(0, 3000, 0, 1.0, 0xFFFFFF);

            var onFrame = window.requestAnimationFrame;

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
        mouse.x = (e.clientX - main.offsetLeft) / main.offsetWidth * 2 - 1;
        mouse.y = -((e.clientY - main.offsetTop) / main.offsetHeight) * 2 + 1;
    }

    window.onunload = init();
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsbC5qcyJdLCJuYW1lcyI6WyIkIiwibWFpbiIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIndvcmxkTWFwIiwibW91c2UiLCJ4IiwieSIsIk1hcCIsIndpZHRoIiwib2Zmc2V0V2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJ2aWV3QW5nbGUiLCJuZWFyIiwiZmFyIiwiY2FtZXJhWCIsImNhbWVyYVkiLCJjYW1lcmFaIiwiY2FtZXJhTFgiLCJjYW1lcmFMWSIsImNhbWVyYUxaIiwiZ2VvIiwic2NlbmUiLCJyZW5kZXJlciIsImNhbWVyYSIsImNvbnRyb2xzIiwiaW50ZXJzZWN0ZWQiLCJwcm90b3R5cGUiLCJpbml0X2QzIiwiZ2VvQ29uZmlnIiwicHJvamVjdGlvbiIsImQzIiwiZ2VvTWVyY2F0b3IiLCJzY2FsZSIsInRyYW5zbGF0ZSIsInBhdGgiLCJnZW9QYXRoIiwiaW5pdF90aHJlZSIsIkRldGVjdG9yIiwid2ViZ2wiLCJUSFJFRSIsIldlYkdMUmVuZGVyZXIiLCJhbnRpYWxpYXMiLCJzZXRDbGVhckNvbG9yIiwiQ2FudmFzUmVuZGVyZXIiLCJhcHBlbmRDaGlsZCIsImRvbUVsZW1lbnQiLCJzZXRTaXplIiwiU2NlbmUiLCJQZXJzcGVjdGl2ZUNhbWVyYSIsInBvc2l0aW9uIiwieiIsImxvb2tBdCIsIk9yYml0Q29udHJvbHMiLCJhZGRDb3VudHJ5IiwiZGF0YSIsImNvdW50cmllcyIsImkiLCJmZWF0dXJlcyIsImdlb0ZlYXR1cmUiLCJwcm9wZXJ0aWVzIiwiZmVhdHVyZSIsIm1lc2giLCJ0cmFuc2Zvcm1TVkdQYXRoRXhwb3NlZCIsImoiLCJwdXNoIiwic2hhcGUzZCIsIkV4dHJ1ZGVHZW9tZXRyeSIsImFtb3VudCIsImJldmVsRW5hYmxlZCIsIm1hdGVyaWFsIiwiTWVzaFBob25nTWF0ZXJpYWwiLCJjb2xvciIsImdldENvbG9yIiwib3BhY2l0eSIsInRyYW5zcGFyZW50IiwidG9BZGQiLCJNZXNoIiwibmFtZSIsInJvdGF0aW9uIiwiTWF0aCIsIlBJIiwidHJhbnNsYXRlWCIsInRyYW5zbGF0ZVkiLCJhZGQiLCJhZGRMaWdodCIsImludGVuc2l0eSIsInBvaW50TGlnaHQiLCJQb2ludExpZ2h0IiwiYWRkUGxhbmUiLCJwbGFuZUdlbyIsIkN1YmVHZW9tZXRyeSIsInBsYW5lTWF0IiwiTWVzaExhbWJlcnRNYXRlcmlhbCIsInBsYW5lIiwiYW5pbWF0ZSIsInZlY3RvciIsIlZlY3RvcjMiLCJyYXljYXN0ZXIiLCJSYXljYXN0ZXIiLCJzZXRGcm9tQ2FtZXJhIiwiaW50ZXJzZWN0cyIsImludGVyc2VjdE9iamVjdHMiLCJjaGlsZHJlbiIsIm9iamVjdHMiLCJsZW5ndGgiLCJvYmplY3QiLCJyZW5kZXIiLCJpbml0Iiwid2hlbiIsImdldEpTT04iLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRnJhbWUiLCJ3aW5kb3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ0aWNrIiwidGltZXN0YW1wIiwiaHRtbCIsImFkZEV2ZW50TGlzdGVuZXIiLCJtb3VzZU1vdmUiLCJlIiwicHJldmVudERlZmF1bHQiLCJjbGllbnRYIiwib2Zmc2V0TGVmdCIsImNsaWVudFkiLCJvZmZzZXRUb3AiLCJvbnVubG9hZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQUEsRUFBRSxZQUFXO0FBQ1QsUUFBTUMsT0FBT0MsU0FBU0MsYUFBVCxDQUF1QixPQUF2QixDQUFiO0FBQ0E7QUFDQSxRQUFJQyxpQkFBSjtBQUNBLFFBQUlDLFFBQVEsRUFBQ0MsR0FBRyxDQUFKLEVBQU9DLEdBQUcsQ0FBVixFQUFaOztBQUVBLGFBQVNDLEdBQVQsR0FBZTtBQUNYLGFBQUtDLEtBQUwsR0FBYVIsS0FBS1MsV0FBbEI7QUFDQSxhQUFLQyxNQUFMLEdBQWNWLEtBQUtXLFlBQW5COztBQUVBLGFBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxhQUFLQyxJQUFMLEdBQVksR0FBWjtBQUNBLGFBQUtDLEdBQUwsR0FBVyxLQUFYO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLENBQWY7QUFDQSxh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QUFsQjtBQUNILENBM1FEIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBtYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1haW4nKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKG1haW4ub2Zmc2V0V2lkdGgpXHJcbiAgICBsZXQgd29ybGRNYXA7XHJcbiAgICBsZXQgbW91c2UgPSB7eDogMCwgeTogMH07XHJcblxyXG4gICAgZnVuY3Rpb24gTWFwKCkge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBtYWluLm9mZnNldFdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gbWFpbi5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMudmlld0FuZ2xlID0gNDU7XHJcbiAgICAgICAgdGhpcy5uZWFyID0gMC4xO1xyXG4gICAgICAgIHRoaXMuZmFyID0gMTAwMDA7XHJcbiAgICAgICAgdGhpcy5jYW1lcmFYID0gMDtcclxuICAgICAgICB0aGlzLmNhbWVyYVkgPSAzNTA7XHJcbiAgICAgICAgdGhpcy5jYW1lcmFaID0gNTAwO1xyXG4gICAgICAgIHRoaXMuY2FtZXJhTFggPSAwO1xyXG4gICAgICAgIHRoaXMuY2FtZXJhTFkgPSAwO1xyXG4gICAgICAgIHRoaXMuY2FtZXJhTFogPSAwO1xyXG5cclxuICAgICAgICB0aGlzLmdlbztcclxuICAgICAgICB0aGlzLnNjZW5lID0ge307XHJcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IHt9O1xyXG4gICAgICAgIHRoaXMuY2FtZXJhID0ge307XHJcbiAgICAgICAgdGhpcy5jb250cm9scyA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmludGVyc2VjdGVkID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBNYXAucHJvdG90eXBlID0ge1xyXG5cclxuICAgICAgICBpbml0X2QzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgbGV0IGdlb0NvbmZpZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0aW9uID0gZDMuZ2VvTWVyY2F0b3IoKS5zY2FsZSgxMjApLnRyYW5zbGF0ZShbNDUwLCAwXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGggPSBkMy5nZW9QYXRoKCkucHJvamVjdGlvbih0aGlzLnByb2plY3Rpb24pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZW8gPSBuZXcgZ2VvQ29uZmlnKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5pdF90aHJlZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vKj09PT09PT09PT09PT09PT09PT09PT09PT09IHN1cHBvcnQgaWZcclxuICAgICAgICAgICAgaWYgKERldGVjdG9yLndlYmdsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgIGFudGlhbGlhczogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHg4ODg4ODgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBUSFJFRS5DYW52YXNSZW5kZXJlcigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL3N1cHBvcnQgaWYgPT09PT09PT09PT09PT09PT09PT09PT09PT0qXHJcblxyXG4gICAgICAgICAgICBtYWluLmFwcGVuZENoaWxkKHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSh0aGlzLnZpZXdBbmdsZSwgdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0LCB0aGlzLm5lYXIsIHRoaXMuZmFyKTtcclxuICAgICAgICAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24ueCA9IHRoaXMuY2FtZXJhWDtcclxuICAgICAgICAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24ueSA9IHRoaXMuY2FtZXJhWTtcclxuICAgICAgICAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24ueiA9IHRoaXMuY2FtZXJhWjtcclxuICAgICAgICAgICAgdGhpcy5jYW1lcmEubG9va0F0KHsgeDogdGhpcy5jYW1lcmFMWCwgeTogMCwgejogdGhpcy5jYW1lcmFMWiB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMgPSBuZXcgVEhSRUUuT3JiaXRDb250cm9scyh0aGlzLmNhbWVyYSwgdGhpcy5yZW5kZXJlci5kb21FbGVtZW50KTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzLmNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKHRoaXMuY2FtZXJhKTtcclxuICAgICAgICAgICAgLy8gdGhpcy5jb250cm9scy5yb3RhdGVTcGVlZCA9IDEuMDtcclxuICAgICAgICAgICAgLy8gdGhpcy5jb250cm9scy56b29tU3BlZWQgPSAxLjI7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuY29udHJvbHMucGFuU3BlZWQgPSAwLjg7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuY29udHJvbHMubm9ab29tID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuY29udHJvbHMubm9QYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gdGhpcy5jb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAvLyB0aGlzLmNvbnRyb2xzLmR5bmFtaWNEYW1waW5nRmFjdG9yID0gMC4zO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGRDb3VudHJ5OiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIGxldCBjb3VudHJpZXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgaW4gZGF0YS5mZWF0dXJlcykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGdlb0ZlYXR1cmUgPSBkYXRhLmZlYXR1cmVzW2ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IHByb3BlcnRpZXMgPSBnZW9GZWF0dXJlLnByb3BlcnRpZXM7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmVhdHVyZSA9IHRoaXMuZ2VvLnBhdGgoZ2VvRmVhdHVyZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG1lc2ggPSB0cmFuc2Zvcm1TVkdQYXRoRXhwb3NlZChmZWF0dXJlKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogaW4gbWVzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50cmllcy5wdXNoKHsgJ2RhdGEnOiBwcm9wZXJ0aWVzLCAnbWVzaCc6IG1lc2hbal0gfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSBpbiBjb3VudHJpZXMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZTNkID0gbmV3IFRIUkVFLkV4dHJ1ZGVHZW9tZXRyeShjb3VudHJpZXNbaV0ubWVzaCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGFtb3VudDogMSxcclxuICAgICAgICAgICAgICAgICAgICBiZXZlbEVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLmdldENvbG9yKGNvdW50cmllc1tpXS5kYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB0b0FkZCA9IG5ldyBUSFJFRS5NZXNoKHNoYXBlM2QsIG1hdGVyaWFsKTtcclxuICAgICAgICAgICAgICAgIHRvQWRkLm5hbWUgPSBjb3VudHJpZXNbaV0uZGF0YS5uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgIHRvQWRkLnJvdGF0aW9uLnggPSBNYXRoLlBJIC8gMjtcclxuICAgICAgICAgICAgICAgIHRvQWRkLnRyYW5zbGF0ZVgoLTQ5MCk7XHJcbiAgICAgICAgICAgICAgICB0b0FkZC50cmFuc2xhdGVZKDUwKTtcclxuICAgICAgICAgICAgICAgIHRvQWRkLnRyYW5zbGF0ZVgoMjApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2NlbmUuYWRkKHRvQWRkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldENvbG9yOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZGF0YS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdVbml0ZWQgS2luZ2RvbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDB4NDZhM2ZmO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnQ2FuYWRhJzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMHhmZjNiM2I7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdUaGFpbGFuZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDB4MGRmZjBkO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMHhkOGQ4ZDg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGxldCBtdWx0aXBsaWVyID0gMDtcclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcclxuICAgICAgICAgICAgLy8gICAgIG11bHRpcGxpZXIgKz0gZGF0YS5pc29fYTMuY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBtdWx0aXBsaWVyID0gKDEuMCAvIDM2NikgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAvLyByZXR1cm4gbXVsdGlwbGllciAqIDB4ZmZmZmZmXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkTGlnaHQ6IGZ1bmN0aW9uKHgsIHksIHosIGludGVuc2l0eSwgY29sb3IpIHtcclxuICAgICAgICAgICAgbGV0IHBvaW50TGlnaHQgPSBuZXcgVEhSRUUuUG9pbnRMaWdodChjb2xvcik7XHJcbiAgICAgICAgICAgIHBvaW50TGlnaHQucG9zaXRpb24ueCA9IHg7XHJcbiAgICAgICAgICAgIHBvaW50TGlnaHQucG9zaXRpb24ueSA9IHk7XHJcbiAgICAgICAgICAgIHBvaW50TGlnaHQucG9zaXRpb24ueiA9IHo7XHJcbiAgICAgICAgICAgIHBvaW50TGlnaHQuaW50ZW5zaXR5ID0gaW50ZW5zaXR5O1xyXG4gICAgICAgICAgICB0aGlzLnNjZW5lLmFkZChwb2ludExpZ2h0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGRQbGFuZTogZnVuY3Rpb24oeCwgeSwgeiwgY29sb3IpIHtcclxuICAgICAgICAgICAgbGV0IHBsYW5lR2VvID0gbmV3IFRIUkVFLkN1YmVHZW9tZXRyeSh4LCB5LCB6KTtcclxuICAgICAgICAgICAgbGV0IHBsYW5lTWF0ID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoeyBjb2xvcjogY29sb3IgfSk7XHJcbiAgICAgICAgICAgIGxldCBwbGFuZSA9IG5ldyBUSFJFRS5NZXNoKHBsYW5lR2VvLCBwbGFuZU1hdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBwbGFuZS5yb3RhdGlvbi55ID0gLU1hdGguUEkgLyAyO1xyXG4gICAgICAgICAgICB0aGlzLnNjZW5lLmFkZChwbGFuZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gc2V0Q2FtZXJhUG9zaXRpb246IGZ1bmN0aW9uKHgsIHksIHosIGx4LCBseikge1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYVggPSB4O1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYVkgPSB5O1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYVogPSB6O1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYUxYID0gbHg7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhTFogPSBsejtcclxuICAgICAgICAvLyB9LFxyXG5cclxuICAgICAgICAvLyBtb3ZlQ2FtZXJhOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyAgICAgbGV0IHNwZWVkID0gMC4yO1xyXG4gICAgICAgIC8vICAgICBsZXQgdGFyZ2V0WCA9ICh0aGlzLmNhbWVyYVggPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi54KSAqIHNwZWVkO1xyXG4gICAgICAgIC8vICAgICBsZXQgdGFyZ2V0WSA9ICh0aGlzLmNhbWVyYVkgPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi55KSAqIHNwZWVkO1xyXG4gICAgICAgIC8vICAgICBsZXQgdGFyZ2V0WiA9ICh0aGlzLmNhbWVyYVogPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi56KSAqIHNwZWVkO1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnggKz0gdGFyZ2V0WDtcclxuICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24ueSArPSB0YXJnZXRZO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi56ICs9IHRhcmdldFo7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhLmxvb2tBdCh7IHg6IHRoaXMuY2FtZXJhTFgsIHk6IDAsIHo6IHRoaXMuY2FtZXJhTFogfSk7XHJcbiAgICAgICAgLy8gfSxcclxuXHJcbiAgICAgICAgYW5pbWF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIGlmICh0aGlzLmNhbWVyYVggIT09IHRoaXMuY2FtZXJhLnBvc2l0aW9uLnggfHxcclxuICAgICAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhWSAhPT0gdGhpcy5jYW1lcmEucG9zaXRpb24ueSB8fFxyXG4gICAgICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmFaICE9PSB0aGlzLmNhbWVyYS5wb3NpdGlvbi56KSB7XHJcbiAgICAgICAgICAgIC8vICAgICB0aGlzLm1vdmVDYW1lcmEoKTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICBsZXQgdmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjMobW91c2UueCwgbW91c2UueSwgMSk7XHJcbiAgICAgICAgICAgIGxldCByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XHJcbiAgICAgICAgICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKHZlY3RvciwgdGhpcy5jYW1lcmEpO1xyXG4gICAgICAgICAgICBsZXQgaW50ZXJzZWN0cyA9cmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHModGhpcy5zY2VuZS5jaGlsZHJlbik7XHJcblxyXG4gICAgICAgICAgICBsZXQgb2JqZWN0cyA9IHRoaXMuc2NlbmUuY2hpbGRyZW47XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnRlcnNlY3RlZCAhPSBpbnRlcnNlY3RzWzBdLm9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmludGVyc2VjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdHNbaV0ubmFtZSA9PT0gdGhpcy5pbnRlcnNlY3RlZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1tpXS5tYXRlcmlhbC5vcGFjaXR5ID0gMC41O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdHNbaV0uc2NhbGUueiA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnNlY3RlZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnNlY3RlZCA9IGludGVyc2VjdHNbMF0ub2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdHNbaV0ubmFtZSA9PSB0aGlzLmludGVyc2VjdGVkLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1tpXS5tYXRlcmlhbC5vcGFjaXR5ID0gMS4wO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzW2ldLnNjYWxlLnogPSA1O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pbnRlcnNlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdHNbaV0ubmFtZSA9PSB0aGlzLmludGVyc2VjdGVkLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1tpXS5tYXRlcmlhbC5vcGFjaXR5ID0gMC41O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzW2ldLnNjYWxlLnogPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJzZWN0ZWQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gdGhpcy5jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKHRoaXMuY2FtZXJhLCB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAgICAgJC53aGVuKCQuZ2V0SlNPTignZGF0YS9jb3VudHJpZXMuanNvbicpKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICB3b3JsZE1hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgd29ybGRNYXAuaW5pdF9kMygpO1xyXG4gICAgICAgICAgICB3b3JsZE1hcC5pbml0X3RocmVlKCk7XHJcbiAgICAgICAgICAgIC8vIHdvcmxkTWFwLmFkZFBsYW5lKDE0MDAsIDcwMCwgMzAsIDB4RUVFRUVFKTtcclxuICAgICAgICAgICAgd29ybGRNYXAuYWRkQ291bnRyeShkYXRhKTtcclxuICAgICAgICAgICAgd29ybGRNYXAuYWRkTGlnaHQoMCwgMzAwMCwgMCwgMS4wLCAweEZGRkZGRik7XHJcblxyXG5cclxuICAgICAgICAgICAgbGV0IG9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gdGljayh0aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgIHdvcmxkTWFwLmFuaW1hdGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod29ybGRNYXAuaW50ZXJzZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjY291bnRyeS1uYW1lJykuaHRtbCh3b3JsZE1hcC5pbnRlcnNlY3RlZC5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2NvdW50cnktbmFtZScpLmh0bWwoXCJtb3ZlIG1vdXNlIG92ZXIgbWFwXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG9uRnJhbWUodGljayk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG9uRnJhbWUodGljayk7XHJcbiAgICAgICAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlLCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1vdXNlTW92ZShlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgbW91c2UueCA9ICgoZS5jbGllbnRYIC0gbWFpbi5vZmZzZXRMZWZ0ICkgLyBtYWluLm9mZnNldFdpZHRoKSAqIDIgLSAxO1xyXG4gICAgICAgbW91c2UueSA9IC0gKChlLmNsaWVudFkgLSBtYWluLm9mZnNldFRvcCApIC8gbWFpbi5vZmZzZXRIZWlnaHQpICogMiArIDE7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHdpbmRvdy5vbnVubG9hZCA9IGluaXQoKTtcclxufSk7Il19
