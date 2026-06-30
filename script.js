(function () {
  'use strict';

  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');
  var header = document.getElementById('header');
  var yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav--open');
    });

    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('nav--open');
      });
    });
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle('header--scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initCyberNetwork() {
    var canvas = document.getElementById('cyber-network');
    var hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var nodes = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var animId = null;
    var isVisible = true;

    var GOLD = '212, 175, 55';
    var WHITE = '245, 240, 235';
    var CONNECT_DIST = 140;
    var MOUSE_RADIUS = 160;

    function getNodeCount() {
      var w = canvas.width;
      if (w < 480) return 35;
      if (w < 768) return 50;
      return 65;
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildNodes();
    }

    function buildNodes() {
      var count = getNodeCount();
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.5 + 1,
          gold: Math.random() > 0.6
        });
      }
    }

    function onMouseMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }

    function onMouseLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function draw() {
      if (!isVisible) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var i, j, node, other, dx, dy, dist;

      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];

        if (mouse.active) {
          dx = mouse.x - node.x;
          dy = mouse.y - node.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.015;
            node.vx -= (dx / dist) * force;
            node.vy -= (dy / dist) * force;
          }
        }

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        node.vx *= 0.999;
        node.vy *= 0.999;
      }

      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          dx = nodes[i].x - nodes[j].x;
          dy = nodes[i].y - nodes[j].y;
          dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            var alpha = (1 - dist / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + GOLD + ', ' + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        var nodeAlpha = node.gold ? 0.2 : 0.15;
        var color = node.gold ? GOLD : WHITE;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + color + ', ' + nodeAlpha + ')';
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    hero.addEventListener('mousemove', onMouseMove, { passive: true });
    hero.addEventListener('mouseleave', onMouseLeave, { passive: true });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      observer.observe(hero);
    }

    animId = requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCyberNetwork);
  } else {
    initCyberNetwork();
  }
})();
