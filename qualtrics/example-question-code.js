/*
 * Webcam Eye Tracking - Qualtrics Integration Templates
 *
 * Copy and paste the appropriate template into each question's JavaScript.
 *
 * Template Guide:
 * - Q1: Calibration (REQUIRED - first question only)
 * - Q2+: Standard Tracking
 */

// ============================================================================
// HEADER: PERSISTENT IFRAME (REQUIRED)
// ============================================================================
// Add to: Look & Feel > General > Header

/*
<script>
(function() {
  if (document.getElementById('calibration-iframe')) return;

  const iframe = document.createElement('iframe');
  iframe.id = 'calibration-iframe';
  iframe.src = 'https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html';
  iframe.allow = 'camera; microphone';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.left = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);
})();
</script>
*/

// ============================================================================
// QUESTION 1: CALIBRATION
// ============================================================================
// Create a "Text/Graphic" question with this JavaScript

/*
Qualtrics.SurveyEngine.addOnload(function() {
  const iframe = document.getElementById('calibration-iframe');
  if (!iframe) {
    console.error('[Q1] Iframe not found');
    return;
  }

  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: '0',
    left: '0',
    visibility: 'visible',
    pointerEvents: 'auto',
    zIndex: '10000'
  });

  const messageHandler = function(event) {
    if (!event.data || event.data.type !== 'calibration-complete') return;

    window.removeEventListener('message', messageHandler);

    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_model_key', event.data.model_key);

    Object.assign(iframe.style, {
      width: '100%',
      height: '100vh',
      position: 'fixed',
      top: '0',
      left: '0',
      opacity: '0.01',
      pointerEvents: 'none',
      zIndex: '-1',
      visibility: 'visible'
    });

    setTimeout(function() {
      document.getElementById('NextButton').click();
    }, 1000);
  };

  window.addEventListener('message', messageHandler);
});
*/

// ============================================================================
// QUESTIONS 2+: STANDARD TRACKING
// ============================================================================
// Change 'Q2' to match your question number

/*
(function (questionId) {
  let gazeData = [];
  let gazeListener = null;
  let viewportInterval = null;
  let trackingStartTime = 0;

  Qualtrics.SurveyEngine.addOnload(function () {
    const iframe = document.getElementById('calibration-iframe');
    if (!iframe) {
      console.error('[' + questionId + '] Iframe not found');
      return;
    }

    gazeData = [];
    trackingStartTime = performance.now();

    iframe.contentWindow.postMessage({
      type: 'start-tracking',
      questionId: questionId
    }, '*');

    viewportInterval = setInterval(function () {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'viewport-update',
          scrollX: window.scrollX,
          scrollY: window.scrollY
        }, '*');
      }
    }, 100);

    gazeListener = function (event) {
      if (!event.data || !event.data.type) return;

      if (event.data.type === 'gaze-data') {
        if (typeof event.data.x === 'number' && typeof event.data.y === 'number') {
          gazeData.push([
            Math.round(event.data.timestamp - trackingStartTime),
            Math.round(event.data.x),
            Math.round(event.data.y)
          ]);
        }
      }
    };
    window.addEventListener('message', gazeListener);
  });

  Qualtrics.SurveyEngine.addOnPageSubmit(function () {
    const iframe = document.getElementById('calibration-iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
    }

    if (viewportInterval) clearInterval(viewportInterval);
    if (gazeListener) window.removeEventListener('message', gazeListener);

    Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, JSON.stringify(gazeData));
  });
})('Q2');
*/



// ============================================================================
// EMBEDDED DATA FIELDS (Survey Flow)
// ============================================================================
/*
 * Add these fields to Survey Flow > Embedded Data (at the TOP):
 *
 * Calibration:
 * - eyetracking_offset
 * - eyetracking_recalibrated
 * - eyetracking_attempts
 * - eyetracking_validation
 * - eyetracking_model_key
 *
 * Gaze Data (one per question):
 * - gaze_Q2
 * - gaze_Q3
 * - gaze_Q4
 * - ...
 */

// ============================================================================
// DATA FORMAT
// ============================================================================
/*
 * Gaze data: [[t,x,y], [t,x,y], ...]
 *
 * - t = timestamp (ms, relative to question start)
 * - x = gaze x-coordinate (pixels)
 * - y = gaze y-coordinate (pixels)
 *
 * Parse in R:
 *   library(jsonlite)
 *   df <- as.data.frame(fromJSON(gaze_data))
 *   colnames(df) <- c("t", "x", "y")
 *
 * Parse in Python:
 *   import json, pandas as pd
 *   df = pd.DataFrame(json.loads(gaze_data), columns=['t', 'x', 'y'])
 */
