Qualtrics.SurveyEngine.addOnload(function () {
    /* Place your JavaScript here to run when the page loads */
    console.log("Validation Question Loaded");
    this.hideNextButton();

    var that = this;
    var validationPoints = [
        { x: 20, y: 20 }, { x: 80, y: 20 },
        { x: 50, y: 50 },
        { x: 20, y: 80 }, { x: 80, y: 80 }
    ];

    var currentPointIndex = 0;
    var samples = [];

    // Create container
    var container = document.createElement('div');
    container.id = 'validation-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'rgba(255,255,255,0.9)'; // White background to focus attention
    document.body.appendChild(container);

    // Instruction text
    var msg = document.createElement('div');
    msg.innerHTML = "<h1>Validation</h1><p>Please look at the blue dot. Do not move your mouse.</p>";
    msg.style.textAlign = 'center';
    msg.style.marginTop = '20%';
    container.appendChild(msg);

    function showPoint(index) {
        if (index >= validationPoints.length) {
            finishValidation();
            return;
        }

        var pt = validationPoints[index];
        var point = document.createElement('div');
        point.className = 'calibration-point';
        point.style.backgroundColor = 'blue';
        point.style.left = pt.x + '%';
        point.style.top = pt.y + '%';
        point.style.display = 'block';
        container.appendChild(point);

        // Wait 1 second for eyes to settle, then record for 2 seconds
        setTimeout(function () {
            startSampling(pt, point);
        }, 1000);
    }

    function startSampling(targetPt, pointElement) {
        var startTime = Date.now();
        var pointSamples = [];

        var interval = setInterval(function () {
            var prediction = null;
            try {
                prediction = webgazer.getCurrentPrediction();
            } catch (e) {
                console.warn("WebGazer prediction error:", e);
            }

            if (prediction) {
                pointSamples.push({
                    predX: prediction.x,
                    predY: prediction.y,
                    targetX: (targetPt.x / 100) * window.innerWidth,
                    targetY: (targetPt.y / 100) * window.innerHeight
                });
            }

            if (Date.now() - startTime > 2000) {
                clearInterval(interval);
                pointElement.remove();
                samples = samples.concat(pointSamples);
                currentPointIndex++;
                showPoint(currentPointIndex);
            }
        }, 33); // ~30Hz
    }

    function finishValidation() {
        container.style.display = 'none';

        // Calculate accuracy (average distance error in pixels)
        var totalError = 0;
        samples.forEach(function (s) {
            var dx = s.predX - s.targetX;
            var dy = s.predY - s.targetY;
            totalError += Math.sqrt(dx * dx + dy * dy);
        });

        var avgError = samples.length > 0 ? (totalError / samples.length) : 9999;
        var accuracyMsg = "Average Error: " + Math.round(avgError) + "px";
        console.log(accuracyMsg);

        // Save to Embedded Data
        Qualtrics.SurveyEngine.setEmbeddedData('ValidationScore', Math.round(avgError));

        alert("Validation Complete. " + accuracyMsg);
        that.showNextButton();
    }

    // Start validation process
    function waitForWebGazer() {
        if (window.webgazerGlobal && window.webgazerGlobal.isReady) {
            checkFaceLock();
        } else {
            console.log("Waiting for WebGazer to be ready...");
            setTimeout(waitForWebGazer, 500);
        }
    }

    function checkFaceLock() {
        msg.innerHTML = "<h2>Detecting Face...</h2><p>Please look at the screen.</p>";

        var attempts = 0;
        var checkInterval = setInterval(function () {
            var pred = null;
            try { pred = webgazer.getCurrentPrediction(); } catch (e) { }

            if (pred && typeof pred.x === 'number' && typeof pred.y === 'number') {
                clearInterval(checkInterval);
                msg.innerHTML = "<h1>Validation</h1><p>Please look at the blue dot.</p>";
                setTimeout(function () {
                    msg.style.display = 'none';
                    showPoint(0);
                }, 1000);
            } else {
                attempts++;
                if (attempts > 100) { // 10 seconds
                    msg.innerHTML = "<h2>Face Not Detected</h2><p>Please ensure your face is in the green box and the camera is on.</p>";
                }
            }
        }, 100);
    }

    // Initial delay to allow UI to settle, then wait for WebGazer
    setTimeout(waitForWebGazer, 1000);

});

Qualtrics.SurveyEngine.addOnUnload(function () {
    var container = document.getElementById('validation-container');
    if (container) container.remove();
});
