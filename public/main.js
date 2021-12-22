import "./lib/three.min.js";

(async function init() {
  let resizeDebouncer;
  let holder = document.querySelector(".canvas");
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  let svg = document.querySelector("svg");
  let path = document.querySelector("path");
  let wiggleTimer;

  class Vector {
    constructor(x, y, size, type, time) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.type = type;
      this.time = time;
    }
  }
  let fake = [];
  let vectors = [];
  let moves = [];
  let targets = [];
  let down = false;
  let first = true;
  let pointTime = new Date();
  let animation;

  resize();
  // Create an empty scene
  var scene = new THREE.Scene();

  // Create a basic perspective camera
  var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 4;

  // Create a renderer with Antialiasing
  var renderer = new THREE.WebGLRenderer({ antialias: true });

  // Configure renderer clear color
  renderer.setClearColor("#9BE2F3");

  // Configure renderer size

  // Append Renderer to DOM

  holder.appendChild(renderer.domElement);
  console.log("2");

  function getTexture(tex) {
    return new Promise((resolve, reject) => {
      const manager = new THREE.LoadingManager(() => resolve(textures));
      const loader = new THREE.TextureLoader(manager);
      const textures = loader.load(tex);
      // const textures = [
      //   "image1.jpg",
      //   "image2.jpg",
      //   "image3.jpg"
      // ].map(filename=>loader.load(filename));
    });
  }

  const familyTex = await getTexture("good.jpg");
  const redTex = await getTexture("redpaper.jpg");
  const paperTex = await getTexture("paper.jpg");

  const redpaper = new THREE.MeshBasicMaterial({
    color: "#fff",
    map: redTex,
  });
  const familyMat = new THREE.MeshBasicMaterial({
    color: "#fff",
    map: familyTex,
  });
  const paperMat = new THREE.MeshBasicMaterial({
    color: "#fff",
    map: paperTex,
  });

  // Create a Cube Mesh with basic material
  var cubeGeo = new THREE.BoxGeometry(3, 2, 0.2);
  var coneGeo = new THREE.ConeGeometry(1.5, 2, 4);
  var letterGeo = new THREE.BoxGeometry(2, 3, 0.2);
  var photoGeo = new THREE.BoxGeometry(1.5, 1, 0.2);
  coneGeo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1, 0));

  var envelope = new THREE.Group();
  var cone = new THREE.Mesh(coneGeo, redpaper);
  cone.scale.set(1, 0.66, 0.02);
  cone.position.y = 1;
  cone.position.z = -0.02;
  cone.rotation.x = -Math.PI;
  envelope.add(cone);

  var cube = new THREE.Mesh(cubeGeo, redpaper);
  cube.scale.set(1, 1, 0.2);
  envelope.add(cube);
  scene.add(envelope);

  var paper = new THREE.Mesh(letterGeo, paperMat);
  var photo = new THREE.Mesh(photoGeo, familyMat);

  let letter = new THREE.Group();
  letter.scale.set(1, 0.5, 0.2);
  letter.position.z = -1;

  photo.position.z = 0.1;
  photo.position.x = 0.1;
  photo.position.y = 0.6;
  photo.rotation.z = -0.1;
  letter.add(paper);
  letter.add(photo);
  scene.add(letter);

  var bounce;

  // Render Loop
  var render = function () {
    requestAnimationFrame(render);

    //envelope.rotation.x = 1;
    //envelope.rotation.y = Math.PI / 2;

    if (animation) {
      if (animation == "open") {
        if (cone.rotation.x < 0) {
          letter.scale.y += 0.01;
          cone.rotation.x += 0.06;
        } else animation = "pull";
      } else if (animation == "pull") {
        envelope.position.y -= 0.06;
        envelope.position.z += 0.03;
        envelope.rotation.x += 0.05;

        if (envelope.position.y < -6) {
          animation = "zoom";
        }
      } else if (animation == "zoom") {
        letter.position.z += 0.04;
        if (letter.position.z > 2) {
          animation = undefined;
          fakeDraw();
          wiggle();
        }
      }
    } //4.1457
    // Render the scene
    renderer.render(scene, camera);
  };
  function resize() {
    clearTimeout(resizeDebouncer);
    resizeDebouncer = setTimeout(function () {
      svg.setAttribute("width", holder.offsetWidth + "px");
      svg.setAttribute("height", holder.offsetHeight + "px");
      renderer.setSize(window.innerWidth, window.innerHeight);
      console.log(document.body.offsetHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      // if (Render) {
      //   Render.resize();
      // }
      //UI.systemMessage('inner ' + window.innerWidth + '; screen ' + window.screen.width, 'success')
    }, 250);
  }

  function pointmove(ev) {
    if (down) point(ev);
  }
  function pointup() {
    down = false;
    refreshPoints();
  }
  function pointdown(ev) {
    // ev.pressure;
    // let c = cube.clone();
    // c.position.set(ev.clientX / 100, ev.clientY / 100, 0);
    // scene.add(c);
    if (!down) {
      first = true;
      down = true;
    }
    point(ev);
  }
  function point(ev) {
    let type = "L";
    if (first) {
      first = false;
      type = "M";
    }
    let time = Math.min(new Date() - pointTime, 1500);
    vectors.push(new Vector(ev.clientX, ev.clientY, ev.pressure, type, time));
    pointTime = new Date();
    draw();
  }
  function draw() {
    let s = `M0 0`;
    vectors.forEach((v) => {
      s += `${v.type} ${v.x} ${v.y}`;
    });
    path.setAttribute("d", s);
  }

  let time = 0;
  function refreshPoints() {
    console.log("before " + vectors.length);
    let last;
    let mid;
    for (let i = 0; i < vectors.length; i++) {
      let v = vectors[i];
      if (last && mid && mid.type == "L") {
        let x = last.x - v.x;
        let y = last.y - v.y;
        let r = Math.sqrt(x * x + y * y);
        if (r < 4) {
          vectors.splice(i - 1, 1);
          mid = v;
        } else {
          last = mid;
          mid = v;
        }
      } else {
        last = mid;
        mid = v;
      }
    }
    console.log("after " + vectors.length);
    vectors.forEach((v, i) => {
      moves[i] = new Vector(v.x, v.y, v.pressure, v.type);
      targets[i] = new Vector(v.x, v.y, v.pressure, v.type);
    });
  }

  let wiggleDebounce;

  function wiggle() {
    let s = `M0 0`;
    time++;
    // for (let i = 0; i < vectors.length; i++) {
    //   if (time > 20) {
    //     targets[i].x = Math.random() * 8 - 4 + vectors[i].x;
    //     targets[i].y = Math.random() * 8 - 4 + vectors[i].y;
    //   } else {
    //     moves[i].x -= (moves[i].x - targets[i].x) / 20;
    //     moves[i].y -= (moves[i].y - targets[i].y) / 20;
    //   }
    //   s += `${moves[i].type} ${moves[i].x} ${moves[i].y}`;
    // }

    for (let i = 0; i < vectors.length; i++) {
      targets[i].x = Math.cos(vectors[i].x + time / 3.14) * 4 + vectors[i].x;
      targets[i].y = Math.sin(vectors[i].y + time / 3.14) * 4 + vectors[i].y;

      moves[i].x -= (moves[i].x - targets[i].x) / 20;
      moves[i].y -= (moves[i].y - targets[i].y) / 20;

      s += `${moves[i].type} ${moves[i].x} ${moves[i].y}`;
    }

    if (time > 20) {
      time = 0;
    }
    path.setAttribute("d", s);
  }

  let fakeInt = 0;
  function fakeDraw() {
    fakeInt = 0;
    refreshPoints();
    fake = vectors;
    vectors = [];
    _fakeLoop();
  }

  function _fakeLoop() {
    let next = fake[fakeInt];
    if (next) {
      vectors.push(next);
      draw();
      fakeInt++;
      setTimeout(() => {
        _fakeLoop();
      }, next.time);
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlParams.entries());
  if (params["admin"] && params["admin"] == "ye") {
    admin();
  } else {
    user(params["page"]);
  }
  function admin() {
    let one = document.querySelector(".square");
    let two = document.querySelector(".square2");
    let three = document.querySelector(".square3");
    one.style.display = "block";
    two.style.display = "block";
    three.style.display = "block";
    one.addEventListener("click", (ev) => {
      ev.stopPropagation();

      save(JSON.stringify(vectors));
    });
    two.addEventListener("click", (ev) => {
      ev.stopPropagation();
      vectors = [];
      if (wiggleTimer) clearInterval(wiggleTimer);
      draw();
    });
    three.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!wiggleTimer) {
        wiggleTimer = setInterval(() => {
          wiggle();
        }, 10);
      }
      fakeDraw();
    });

    holder.addEventListener("pointermove", pointmove);
    holder.addEventListener("pointerdown", pointdown);
    holder.addEventListener("pointerup", pointup);
    window.addEventListener("keydown", (ev) => {
      if (ev.key == " ") {
        setInterval(() => {
          wiggle();
        }, 10);
      } else if (ev.key == "a") {
        fakeDraw();
      }
    });
    letter.scale.set(1, 1.0300000000000005, 0.02);
    animation = "zoom";
  }

  async function user(page) {
    let eventListener = (ev) => {
      document.querySelector("h4").style.display = "none";
      animation = "open";
      window.removeEventListener("click", eventListener);
    };
    window.addEventListener("click", eventListener);

    if (page) {
      let ret = await postData("./load", { url: page });
      console.log(ret);
      if (ret.data) {
        vectors = JSON.parse(ret.data);
      }
    }
  }

  async function save(s) {
    let ret = await postData("./save", vectors);
    console.log(ret);
    if (ret && ret.user && ret.user.url) {
      window.location.replace("./?page=" + ret.user.url);
    }
  }
  async function postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

  render();
})();
