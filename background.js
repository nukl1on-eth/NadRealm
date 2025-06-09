// Подключаем particles.js (если не подключено глобально)
if (typeof particlesJS === "undefined") {
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
  script.onload = initParticles;
  document.head.appendChild(script);
} else {
  initParticles();
}

function initParticles() {
  particlesJS("particles-js", {
    "particles": {
      "number": { "value": 20, "density": { "enable": true, "value_area": 800 } },
      "color": { "value": "#ffffff" },
      "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 } },
      "opacity": { "value": 0.5, "random": false },
      "size": { "value": 3, "random": true },
      "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
      "move": { "enable": true, "speed": 1, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": { "onhover": { "enable": false }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
      "modes": { "push": { "particles_nb": 4 } }
    },
    "retina_detect": true
  });
}