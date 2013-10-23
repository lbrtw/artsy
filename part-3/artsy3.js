// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name artsy3.min.js
// @js_externs var THREE = { MeshBasicMaterial : function() {}, Vector3 : function() {}, Mesh : function() {}, Geometry : function() { this.vertices = []; this.faces = []; }, Face3 : function() {}, MeshFaceMaterial : function() {}, PlaneGeometry : function() {}, Scene : function() {}, PerspectiveCamera : function() { this.lookAt = function() {}; }, WebGLRenderer : function() { this.setSize = function() {}; this.setClearColor = function() {}; this.render = function() {}; this.domElement = null; } };
// ==/ClosureCompiler==

(function() {
    // http://bitworld.bitfellas.org/demo.php?id=248
    // http://youtu.be/_5HacABiXUE
    
    // Minify, step 1: http://closure-compiler.appspot.com/home
    // Minify, step 2: https://github.com/Siorki/RegPack
    
    var dev = false;
    var autoplay = !dev;
    var showFrame = false;
    var rnd = Math.random;
    var create = function(elementName) { return document.createElement(elementName); };
    var timeOffset = 0;
    var frameDiff = 1;

    var getAny = function(names, target, fallback) {
        for (var i = 0; i < names.length; ++i) {
            var name = names[i];
            if (target[name]) {
                return target[name];
            }
        }
        
        return fallback;
    };
    
    var now = function() {
        return (new Date).getTime();
    };
    
    var reqAnimFrameFallback = function(func) {
        var now = (new Date).getTime();
        var next = (now - (now % 17)) + 17;
        var diff = next - now;
        if (diff < 5) diff = 17;
        window.setTimeout(function() {
            func.call(window, (new Date).getTime())
        }, diff);
    };
    
    var requestAnimationFrame = getAny([
        "requestAnimationFrame",
        "mozRequestAnimationFrame",
        "webkitRequestAnimationFrame"
    ], window, reqAnimFrameFallback);
    
    var width = 640;
    var height = 512;
    
    var pi = 4 * Math.atan(1);
    
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var largestHalf = Math.max(halfWidth, halfHeight);
    
    var smoothComplete = function(chapterComplete) {
        return (1 - Math.cos(chapterComplete * pi)) / 2;
    };

    var canvas, context, currentQuality,
        lastTime, startTime, currentTime, currentChapterIndex = 0, currentRenderer,
        playing, mobyle, select;
    
    var scene0, scene1, scene2, camera, fighters = [];
    var tjsRenderer;
    
    var colorMaterials = [];
    
    var getOrCreateColor = function(color) {
        var key = "#" + color.toString(16);
        if (colorMaterials[key]) return colorMaterials[key];
        
        var material = new THREE.MeshBasicMaterial( { color: color } );
        colorMaterials[key] = material;
        return material;
    };
    
    var createFighter = function(x, y, z) {
        var vectors = [
                        // Left outer disc (0..8)
                        new THREE.Vector3(-7, 8, -4),
                        new THREE.Vector3(-7, 8, 4),
                        new THREE.Vector3(-7, 4, 8),
                        new THREE.Vector3(-7, -4, 8),
                        new THREE.Vector3(-7, -8, 4),
                        new THREE.Vector3(-7, -8, -4),
                        new THREE.Vector3(-7, -4, -8),
                        new THREE.Vector3(-7, 4, -8),
                        new THREE.Vector3(-7, 0, 0),
                        
                        // Right outer disc (9..17)
                        new THREE.Vector3(7, 8, -4),
                        new THREE.Vector3(7, 8, 4),
                        new THREE.Vector3(7, 4, 8),
                        new THREE.Vector3(7, -4, 8),
                        new THREE.Vector3(7, -8, 4),
                        new THREE.Vector3(7, -8, -4),
                        new THREE.Vector3(7, -4, -8),
                        new THREE.Vector3(7, 4, -8),
                        new THREE.Vector3(7, 0, 0),
                        
                        // Left waist (18..25)
                        new THREE.Vector3(-6, 2, -1),
                        new THREE.Vector3(-6, 2, 1),
                        new THREE.Vector3(-6, 1, 2),
                        new THREE.Vector3(-6, -1, 2),
                        new THREE.Vector3(-6, -2, 1),
                        new THREE.Vector3(-6, -2, -1),
                        new THREE.Vector3(-6, -1, -2),
                        new THREE.Vector3(-6, 1, -2),
                        
                        // Right waist (26..33)
                        new THREE.Vector3(6, 2, -1),
                        new THREE.Vector3(6, 2, 1),
                        new THREE.Vector3(6, 1, 2),
                        new THREE.Vector3(6, -1, 2),
                        new THREE.Vector3(6, -2, 1),
                        new THREE.Vector3(6, -2, -1),
                        new THREE.Vector3(6, -1, -2),
                        new THREE.Vector3(6, 1, -2),
                        
                        // Left belly (34..41)
                        new THREE.Vector3(-2, 4, -2),
                        new THREE.Vector3(-2, 4, 2),
                        new THREE.Vector3(-2, 2, 3),
                        new THREE.Vector3(-2, -2, 3),
                        new THREE.Vector3(-2, -4, 2),
                        new THREE.Vector3(-2, -4, -2),
                        new THREE.Vector3(-2, -2, -3),
                        new THREE.Vector3(-2, 2, -3),
                        
                        // Right belly (42..49)
                        new THREE.Vector3(2, 4, -2),
                        new THREE.Vector3(2, 4, 2),
                        new THREE.Vector3(2, 2, 3),
                        new THREE.Vector3(2, -2, 3),
                        new THREE.Vector3(2, -4, 2),
                        new THREE.Vector3(2, -4, -2),
                        new THREE.Vector3(2, -2, -3),
                        new THREE.Vector3(2, 2, -3)
                      ];
        
        var geom = new THREE.Geometry();
        for (var i = 0; i < vectors.length; ++i) {
            geom.vertices.push(vectors[i]);
        }
        
        var materials = [
                            getOrCreateColor(0xb46a31),
                            getOrCreateColor(0xd28a43),
                            
                            getOrCreateColor(0xac8b86),
                            getOrCreateColor(0x896a64),
                            
                            getOrCreateColor(0x8f461e)
                        ];
        
        for (var i = 0; i <= 7; ++i) {
            // Left outer disc (X = -10)
            geom.faces.push(new THREE.Face3(i, 8, (i + 1) % 8, null, null, i % 2));
            
            // Right outer disc (X = 10)
            geom.faces.push(new THREE.Face3(i + 9, (i + 1) % 8 + 9, 17, null, null, (i + 1) % 2));
            
            // Left outer disc to waist (X : -7..-9)
            var lo0 = i,
                lo1 = (i + 1) % 8,
                lw1 = (i + 1) % 8 + 18,
                lw0 = i + 18;
            geom.faces.push(new THREE.Face3(lo0, lo1, lw1, null, null, (i % 2) + 2));
            geom.faces.push(new THREE.Face3(lw1, lw0, lo0, null, null, (i % 2) + 2));
            
            // Right outer disc to waist (X : 7..9)
            var ro0 = i + 9,
                ro1 = (i + 1) % 8 + 9,
                rw1 = (i + 1) % 8 + 26,
                rw0 = i + 26;
            geom.faces.push(new THREE.Face3(ro0, rw1, ro1, null, null, (i % 2) + 2));
            geom.faces.push(new THREE.Face3(rw1, ro0, rw0, null, null, (i % 2) + 2));
            
            // Left waist to belly (X: -6..-2)
            var lb0 = i + 34;
            var lb1 = (i + 1) % 8 + 34;
            geom.faces.push(new THREE.Face3(lw0, lw1, lb1, null, null, 3 - (i % 2)));
            geom.faces.push(new THREE.Face3(lb1, lb0, lw0, null, null, 3 - (i % 2)));
            
            // Right waist to belly (X: -6..-2)
            var rb0 = i + 42;
            var rb1 = (i + 1) % 8 + 42;
            geom.faces.push(new THREE.Face3(rw0, rb1, rw1, null, null, 3 - (i % 2)));
            geom.faces.push(new THREE.Face3(rb1, rw0, rb0, null, null, 3 - (i % 2)));
            
            // Belly (X: -2..2)
            geom.faces.push(new THREE.Face3(lb0, lb1, rb1, null, null, (i % 2) * 4));
            geom.faces.push(new THREE.Face3(rb1, rb0, lb0, null, null, (i % 2) * 4));
        }
        
        // Final stage: Create the mesh
        var result = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
        result.position = {x : x, y : y, z : z};
        
        return result;
    };
    
    var createGround = function(color) {
        var plane = new THREE.PlaneGeometry(2000, 2000, 10, 10);
        
        var result = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color : color }));
        result.rotation.x = Math.PI * -0.5;
        
        return result;
    };
    
    var precalcThreeDee = function() {
        scene0 = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
//        tjsRenderer = new THREE.CanvasRenderer();
        tjsRenderer = new THREE.WebGLRenderer();
        tjsRenderer.setSize(512, 512);
        tjsRenderer.sortObjects = true;
        
        fighters.push(createFighter(0, 190, 0));
        scene0.add(fighters[0]);
        scene0.add(createGround(0x406e30));
        
        scene1 = new THREE.Scene();
        scene1.add(createGround(0x2e6289));
        
        scene2 = new THREE.Scene();
    };
    
    var scrollBuffer, scrollContext,
        scrollBuffer2, scrollContext2;
    
    var scrollText = [
        "ARTSY (and slightly insane)",
        "",
        "",
        "",
        "",
        "",
        "",
        "Pure JavaScript!",
        "",
        "Chrome, Safari, FireFox, iOS Safari, IE9+",
        "(yes, even IE)",
        "",
        "No Flash or Silverlight needed!",
        "",
        "",
        "",
        "",
        "",
        "",
        "Code:",
        "",
        "       LBRTW",
        "",
        "Original design:",
        "",
        "       Mr. Pet",
        "       Chaos",
        "       McDeal",
        "",
        "Graphics:",
        "",
        "       Ra",
        "",
        "Music:",
        "",
        "       Moby",
        "",
        "",
        "",
        "",
        "",
        "",
        "Thanks must go to:",
        "",
        "mrdoob (and all the others who contribute to Three.js), everyone I knew back in the old Demo Scene days, Google (for making a kick-ass browser)",
        "",
        "",
        "",
        "",
        "",
        "",
        "Some words about the demo:",
        "",
        "The name \"Artsy (and slightly Insane)\" is of course a tribute to the names of the original demo and the amazing group who made it.",
        "",
        "The very first scene I wrote was the \"disc tunnel\" effect, and I was instantly so pleased with the results that I decided to give a full remake a serious try.",
        "",
        "After the first two parts were done, I showed some people what I had done, and it got really nice reception. Unfortunately I had no time at the moment to finish part three.",
        "",
        "So the demo was left hanging for almost six months, when I finally managed to free up some time for \"pleasure coding\" again. :)",
        "",
        "",
        "",
        "",
        "",
        "",
        "This is the only part that takes advantage of WebGL (through Three.js). All other parts are 100 % hand-coded JavaScript.",
        "",
        "I did use some of the original graphics that were easy to get hold of using screen dumps."
    ];
    
    var scrollPixelsUntilNextRow = 1,
        scrollTextNextLineIndex = 0,
        scrollTextNextCharOffset = 0;

    var threeDeeRenderer = function(subId, chapterOffset, chapterComplete, frameDiff) {
        if (dev) {
            if (subId == "getName") {
                return "Three Dee";
            }
        }
        
        if (!scrollBuffer) {
            scrollBuffer = document.createElement("CANVAS");
            scrollBuffer.width = 256;
            scrollBuffer.height = 1088;
            scrollContext = scrollBuffer.getContext("2d");
            scrollContext.fillStyle = "#ffffff";
            scrollContext.textBaseline = "top";
            
            scrollBuffer2 = document.createElement("CANVAS");
            scrollBuffer2.width = 256;
            scrollBuffer2.height = 1088;
            scrollContext2 = scrollBuffer2.getContext("2d");
        }
        
        context.clearRect(0, 0, 640, 512);
        
        if (subId == 0) {
            return;
        }

        switch (subId) {
            case 1:
                //fighters[0].rotation.y = 1.3 * (fighters[0].rotation.x = (chapterOffset / 1000));
                
                camera.position.x = 40 * Math.sin(chapterOffset / 1100);
                camera.position.z = 40 * Math.cos(chapterOffset / 1100);
                camera.position.y = 200 + 30 * Math.sin(chapterOffset / 950);
                camera.up = new THREE.Vector3(Math.sin(chapterOffset / 1000 + 0.7) * 0.4,1,Math.sin(chapterOffset / 1300 + 1.1) * 0.7);
                camera.lookAt(fighters[0].position);
                
                tjsRenderer.setClearColor("#0b46d2", 1);
                tjsRenderer.render(scene0, camera);
                break;
            case 2:
                tjsRenderer.setClearColor("#003f79", 1);
                tjsRenderer.render(scene1, camera);
                break;
            case 3:
                tjsRenderer.setClearColor("#0b46d2", 1);
                tjsRenderer.render(scene2, camera);
                break;
        }
        context.drawImage(tjsRenderer.domElement, 0, 0);
        
        // Scroll up
        scrollContext2.clearRect(0, 0, 256, 1088);
        scrollContext2.drawImage(scrollBuffer, 0, 0);
        scrollContext.clearRect(0, 0, 256, 1088);
        scrollContext.drawImage(scrollBuffer2, 0, -1);
        --scrollPixelsUntilNextRow;
        if (scrollPixelsUntilNextRow <= 0) {
            var text = scrollText[scrollTextNextLineIndex];
            scrollPixelsUntilNextRow = 39;
            if (typeof text == "string") {
                if (scrollTextNextLineIndex == 0) {
                    scrollContext.font = "bold normal 30px sans-serif";
                    scrollPixelsUntilNextRow = 48;
                    scrollContext.fillStyle = "#ff9900";
                } else {
                    scrollContext.font = "normal normal 26px sans-serif";
                    scrollContext.fillStyle = "#ffffff";
                }
                text = text.substr(scrollTextNextCharOffset);
                var textWidth = scrollContext.measureText(text).width;
                if (textWidth > 252) {
                    var parts = text.split(' ');
                    if (parts.length > 1) {
                        var newTextParts = [];
                        for (var j = 0; j < parts.length; ++j) {
                            newTextParts.push(parts[j]);
                            textWidth = scrollContext.measureText(newTextParts.join(' ')).width;
                            if (textWidth > 252) {
                                if (j == 0) {
                                    text = parts[0];
                                } else {
                                    newTextParts.length = newTextParts.length - 1;
                                    text = newTextParts.join(' ');
                                }
                                scrollTextNextCharOffset += text.length + 1;
                                break;
                            }
                        }
                    } else {
                        scrollTextNextCharOffset = 0;
                        scrollTextNextLineIndex++;
                    }
                } else {
                    scrollTextNextCharOffset = 0;
                    scrollTextNextLineIndex++;
                }
                
                scrollContext.fillText(text, 4, 1024);
            }
        }
        context.drawImage(scrollBuffer, 0, 0, 256, 1024, 512, 0, 128, 512);
        
        context.font = "normal normal 15px sans-serif";
        context.textBaseline = "top";
        context.textAlign = "center";

        context.fillStyle = "#000000";
        context.shadowColor = "#ffffff"
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 10;
        context.fillText("this part is obviously not finished yet", 256, 15);
    };
    
    var renderers = [
        threeDeeRenderer
    ],

    chapters = [
        {
            from : 0,
            to : 2000,
            rendererIndex : 0,
            subId : 0
        }, {
            from : 2000,
            to : 53180,
            rendererIndex : 0,
            subId : 1
        }, {
            from : 53180,
            to : 105840,
            rendererIndex : 0,
            subId : 2
        }, {
            from : 105840,
            to : 155000,
            rendererIndex : 0,
            subId : 3
        } ],
    
    preCalc = function() {
        precalcThreeDee();
    },
    
    animFrame = function(time) {
        if (startTime) {
            frameDiff = (time - lastTime) / 1000 * 60;
            
            timeOffset = time - startTime;
            
            var currentChapter = dev ? chapters[select.value] : chapters[currentChapterIndex];
            if (dev) {
                currentChapter.to -= currentChapter.from;
                currentChapter.from = 0;
            }
            if (currentChapter && (timeOffset >= currentChapter.to)) {
                ++currentChapterIndex;
                currentChapter = chapters[currentChapterIndex];
            }
            
            
            if (currentChapter) {
                var chapterTime = timeOffset - currentChapter.from;
                var chapterComplete = chapterTime / (currentChapter.to - currentChapter.from);
                currentRenderer = renderers[currentChapter.rendererIndex];
                
                var starting = now();
                context.globalAlpha = 1;
                context.save();
                currentRenderer.call(this, currentChapter.subId, chapterTime, chapterComplete, frameDiff);
                context.restore();
            } else {
                playing = false;
            }
            
            var ended = now();
            var ms = ended - starting;
            var qualityStep = (22 - ms - 10 * frameDiff) / 200;
            if (qualityStep > 0) {
                qualityStep *= 0.005;
            }
            var newQuality = currentQuality + qualityStep;
            if (newQuality > 1) {
                newQuality = 1;
            } else if (newQuality < 0.1) {
                newQuality = 0.1;
            }
            currentQuality = newQuality;
            
            if (showFrame || dev) {
                context.fillStyle = "#000000";
                context.fillRect(0, 0, 60, 13);
                context.fillStyle = "#ffffff";
                context.font = "10px Helvetica";
                context.textAlign = "right";
                context.textBaseline = "top";
                context.fillText((timeOffset / 1000).toFixed(3).replace('.',':'), 60, 0);
            }
        }
        
        if (currentTime) {
            if (currentTime < 1) {
//            if (!lastTime) {
                startTime = time - 1000 * currentTime - 250;
            }
            lastTime = time;
        }
        
        if (playing) {
            requestAnimationFrame(animFrame);
        } else {
            var event = document.createEvent("Event");
            event.initEvent("demoDone", true, true);
            
            window.dispatchEvent(event);
        }
    },
    
    onplay = function() {
        playing = true;
        requestAnimationFrame(animFrame);
    },
    
    ontimeupdate = function(event) {
        currentTime = this.currentTime;
    },
    
    areLoading = [],
    totalLoadingAdded = 0,
    
    addToLoading = function(item) {
        areLoading.push(item);
        ++totalLoadingAdded;

        var event = document.createEvent("Event");
        event.initEvent("itemsLoader", true, true);
        event.total = totalLoadingAdded;
        event.done = totalLoadingAdded - areLoading.length;
        
        window.dispatchEvent(event);
    },
    
    loadingDone = function(item) {
        var newLoading = [];
        for (var i = 0; i < areLoading.length; ++i) {
            if (areLoading[i] != item) {
                newLoading.push(areLoading[i]);
            }
        }
        areLoading = newLoading;
        
        var event = document.createEvent("Event");
        event.initEvent("itemsLoader", true, true);
        event.total = totalLoadingAdded;
        event.done = totalLoadingAdded - areLoading.length;
        
        window.dispatchEvent(event);
    },
    
    audioProgressTimerId = null,
    
    onIpadAudioProgressHack = function(audio) {
        audioProgressTimerId = null;
        audio.removeEventListener("progress", onAudioProgress, false);
        loadingDone(audio);
    },
    
    onAudioProgress = function(event) {
        if (audioProgressTimerId) {
            window.clearTimeout(audioProgressTimerId);
        }
        var audio = this;
        audioProgressTimerId = window.setTimeout(function() { onIpadAudioProgressHack(audio); }, 2000);
    },
    
    onAudioCanPlay = function(event) {
        if (audioProgressTimerId) {
            window.clearTimeout(audioProgressTimerId);
            audioProgressTimerId = null;
        }
        this.removeEventListener("progress", onAudioProgress, false);
        loadingDone(this);
    },
    
    loadAudio = function(oggSource, mp3Source) {
        // returns a reference to the AUDIO element
        var audio = create("AUDIO");
        audio.controls = true;
        audio.preload = "auto";
        
        addToLoading(audio);
        
        audio.addEventListener("play", onplay, false);
        audio.addEventListener("timeupdate", ontimeupdate, false);
        audio.addEventListener("progress", onAudioProgress, false);
        audio.addEventListener("canplay", onAudioCanPlay, false);
        
        var canPlayOgg = audio.canPlayType("audio/ogg");
        var canPlayMp3 = audio.canPlayType("audio/mpeg");
        
        if (canPlayOgg == "probably" || (canPlayOgg == "maybe" && canPlayMp3 != "probably")) {
            audio.src = oggSource;
        } else if (canPlayMp3 == "probably" || canPlayMp3 == "maybe") {
            audio.src = mp3Source;
        }
        
        audio.load();
        
        return audio;
    },
    
    onImageLoad = function() {
        loadingDone(this);
    },
    
    loadImage = function(src) {
        var image = new Image();
        
        addToLoading(image);
        
        image.addEventListener("load", onImageLoad, false);
        image.src = src + "?ts=" + now();
        
        return image;
    },
    
    startingTimerId = null;
    
    onLoadingDone = function() {
        if (startingTimerId) {
            window.clearTimeout(startingTimerId);
            startingTimerId = null;
        }
        
        preCalc();
        
        mobyle.play();
    };
    
    onItemsLoader = function(event) {
        if (startingTimerId) {
            window.clearTimeout(startingTimerId);
            startingTimerId = null;
        }
        
        context.fillStyle = "#000000"
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#000073";
        context.strokeStyle = "#000073";
        context.lineWidth = 50;
        context.lineCap = "round";
        
        context.beginPath();
        context.moveTo(halfWidth - 200, halfHeight);
        context.lineTo(halfWidth + 200, halfHeight);
        context.stroke();
        
        if (event.done < event.total) {
            context.strokeStyle = "#000000";
            context.lineWidth = 40;
            context.beginPath();
            context.moveTo(halfWidth - 200, halfHeight);
            context.lineTo(halfWidth + 200, halfHeight);
            context.stroke();
            
            context.strokeStyle = "#000073";
            context.lineWidth = 41;
            context.beginPath();
            context.moveTo(halfWidth - 200, halfHeight);
            context.lineTo(halfWidth - 200 + (400 * event.done / event.total), halfHeight);
            context.stroke();
        }
        
        if (event.done == event.total) {
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "20px sans-serif";
            context.fillText("Click to start...", halfWidth, halfHeight + 40);
            
            if (autoplay) {
                window.setTimeout(onLoadingDone, 1);
            }
            
            canvas.addEventListener("click", onLoadingDone, false);
        }
    },
    
    onDemoDone = function() {
        window.location.href = "/part-3/";
    },
    
    onload = function() {
        canvas = document.getElementById("demo");
        context = canvas.getContext("2d");
        
        playing = false;
        
        window.addEventListener("itemsLoader", onItemsLoader, false);
        
        mobyle = loadAudio("mobyle.ogg", "mobyle.mp3");

        if (dev) {
            select = document.createElement("SELECT");
            for (var i = 0; i < chapters.length; ++i) {
                var chapter = chapters[i];
                var name = renderers[chapter.rendererIndex]("getName") + ", part " + chapter.subId;
                var option = document.createElement("OPTION");
                option.value = i;
                option.appendChild(document.createTextNode(name));
                if (chapter.rendererIndex == 11) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
            document.body.insertBefore(select, document.body.firstChild);
        }
    };
    
    window.onload = onload;
})();