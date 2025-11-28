Qualtrics.SurveyEngine.addOnload(function () {
    /* Place your JavaScript here to run when the page loads */
    console.log("Calibration Question Loaded");

    // Hide the Next button until calibration is complete
    this.hideNextButton();

    var that = this;
    var points = [
        { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
        { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
        { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 }
    ];

    var completedPoints = 0;

    // Create container for points
    var container = document.createElement('div');
    container.id = 'calibration-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Add Instructions
    var instructions = document.createElement('div');
    instructions.innerHTML = "<h2 style='text-align:center; margin-top:20px; background:white; padding:10px;'>Initializing eye tracker... Please look at the camera.</h2>";
    container.appendChild(instructions);

    // Wait for WebGazer tracker to be fully initialized
    function waitForTracker(callback) {
        console.log("Waiting for WebGazer tracker to initialize...");

        var attempts = 0;
        var maxAttempts = 100; // 10 seconds max wait

        var checkInterval = setInterval(function() {
            attempts++;

            // Check if WebGazer is ready
            var isGlobalReady = window.webgazerGlobal && window.webgazerGlobal.isReady;

            // Try to get a prediction
            var hasPrediction = false;
            try {
                var pred = webgazer.getCurrentPrediction();
                hasPrediction = (pred !== null && pred !== undefined &&
                               typeof pred.x === 'number' && typeof pred.y === 'number');
            } catch (e) {
                // Not ready yet
            }

            if (isGlobalReady && hasPrediction) {
                clearInterval(checkInterval);
                console.log("✓ Tracker ready for calibration after " + (attempts * 100) + "ms");
                callback();
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn("⚠ Tracker initialization timeout, proceeding anyway");
                callback();
            }
        }, 100);
    }

    // Function to create a point
    function createPoint(x, y, index) {
        var point = document.createElement('div');
        point.className = 'calibration-point';
        point.style.left = x + '%';
        point.style.top = y + '%';
        point.setAttribute('data-index', index);
        point.setAttribute('data-clicks', '0');

        // Visual counter inside the point
        point.innerText = "3"; // Reduced to 3 for easier testing
        point.style.color = "white";
        point.style.display = "flex";
        point.style.alignItems = "center";
        point.style.justifyContent = "center";
        point.style.fontWeight = "bold";
        point.style.fontSize = "12px";

        point.addEventListener('click', function (event) {
            var p = this;
            console.log("Calibration point clicked:", index);

            // Explicitly record calibration data for WebGazer
            // This is crucial for legacy versions to learn the mapping
            if (typeof webgazer !== 'undefined' && webgazer.recordScreenPosition) {
                webgazer.recordScreenPosition(event.clientX, event.clientY, 'click');
            } else {
                console.warn("WebGazer not ready for calibration step");
            }

            var clicks = parseInt(p.getAttribute('data-clicks') || '0');
            clicks++;
            p.setAttribute('data-clicks', clicks);

            // Update counter
            var remaining = 3 - clicks;
            p.innerText = remaining > 0 ? remaining : "✓";

            // Visual feedback
            p.style.backgroundColor = 'yellow';
            setTimeout(() => {
                if (!p.classList.contains('calibrated')) {
                    p.style.backgroundColor = 'red';
                }
            }, 200);

            if (clicks >= 3) { // Require 3 clicks per point
                p.style.backgroundColor = 'green';
                p.classList.add('calibrated');
                p.style.pointerEvents = 'none'; // Disable further clicks
                completedPoints++;
                console.log("Point completed. Total:", completedPoints);

                if (completedPoints >= points.length) {
                    finishCalibration();
                }
            }
        });

        container.appendChild(point);
        // Show point
        point.style.display = 'block';
    }

    // Wait for tracker, then show calibration
    waitForTracker(function() {
        instructions.innerHTML = "<h2 style='text-align:center; margin-top:20px; background:white; padding:10px;'>Calibration: Click each red dot 3 times while looking at it.</h2>";

        // NOW create the calibration points
        points.forEach(function (pt, index) {
            createPoint(pt.x, pt.y, index);
        });
    });

    function finishCalibration() {
        alert("Calibration Complete!");
        container.style.display = 'none';
        that.showNextButton();
    }

});

Qualtrics.SurveyEngine.addOnReady(function () {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /* Place your JavaScript here to run when the page is unloaded */
    var container = document.getElementById('calibration-container');
    if (container) {
        container.remove();
    }
});
