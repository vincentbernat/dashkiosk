module.exports = (function(window) {
  'use strict';

  // Most of the code is stolen from here:
  //  https://android.googlesource.com/platform/external/chromium_org/third_party/WebKit/+/refs/heads/master/PerformanceTests/Animation/balls-javascript.html

  require('./polyfills')();

  /* 
   Copyright (c) 2012 Cameron Adams. All rights reserved.
   Copyright (c) 2012 Code Aurora Forum. All rights reserved.
   Copyright (C) 2013 Google Inc. All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are
   met:
   * Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
   copyright notice, this list of conditions and the following disclaimer
   in the documentation and/or other materials provided with the
   distribution.
   * Neither the name of Code Aurora Forum Inc., Google Inc. nor the
   names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
   OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
   SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
   LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
   DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
   THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

   This test is based on code written by Cameron Adams and imported from
     http://themaninblue.com/experiment/AnimationBenchmark/html
   */
  var benchmark = null,
      maxParticles = 500,
      minVelocity = 50,
      maxVelocity = 500,
      particles = [],
      stageWidth = 100,
      stageHeight = 100,
      prevTime = 0,
      testRunning = true,
      frames = 0,
      duration = 1000,
      document = window.document;

  function Particle() {
    var angle = Math.PI * 2 * Math.random();
    var velocity = minVelocity + ((maxVelocity - minVelocity) * Math.random());
    this.x = stageWidth / 2;
    this.y = stageHeight / 2;
    this.dx = Math.cos(angle) * velocity;
    this.dy = Math.sin(angle) * velocity;

    this.domNode = document.createElement('span');
    this.domNode.classList.add('particle');
    this.domNode.style.left = this.x + 'px';
    this.domNode.style.top = this.y + 'px';
    benchmark.appendChild(this.domNode);
  }

  Particle.prototype.destroy = function() {
    this.domNode.parentNode.removeChild(this.domNode);
  };

  Particle.prototype.draw = function(timeDelta) {
    var timeDeltaSeconds = timeDelta / 1000;
    var testX = this.x + (this.dx * timeDeltaSeconds);
    var testY = this.y + (this.dy * timeDeltaSeconds);
    this.x = testX;
    this.y = testY;
    this.domNode.style.left = this.x + 'px';
    this.domNode.style.top = this.y + 'px';
  };

  function createParticles() {
    for (var i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    var currTime = window.performance.now();
    var timeDelta = currTime - prevTime;
    for (var particle in particles) {
      particles[particle].draw(timeDelta);
    }
    prevTime = currTime;
    frames += 1;
    if (testRunning) {
      window.requestAnimationFrame(animate);
    }
  }

  var done = function(cb) {
    var run = function() {

      // Only run the benchmark if the page is not hidden. If the
      // visibility API is unavailable, the document will never be
      // considered hidden.
      window.document.removeEventListener('visibilitychange', run, false);
      if (window.document.hidden === true) {
        window.document.addEventListener('visibilitychange', run, false);
        return;
      }
      window.document.removeEventListener('visibilitychange', run, false);

      // Setup some global variables
      benchmark = document.querySelector('.benchmark');
      stageWidth = benchmark.clientWidth;
      stageHeight = benchmark.clientHeight;

      // Create and start animate particles
      createParticles();
      prevTime = window.performance.now();
      animate();

      window.setTimeout(function() {
        // Stop the benchmark
        testRunning = false;
        for (var i = 0; i < particles.length; i++) {
          particles[i].destroy();
        }
        particles = [];
        benchmark.parentNode.removeChild(benchmark);

        // Record the number of frames displayed
        var fps = frames / duration * 1000;
        console.log('[Dashkiosk] Benchmark: ' + fps + ' fps');
        if (fps > 10) {
          document.body.classList.add('dk-fast-browser');
        }

        // Call callback
        cb();
      }, duration);
    };

    run();
  };

  return {
    done: done
  };

})(window);
