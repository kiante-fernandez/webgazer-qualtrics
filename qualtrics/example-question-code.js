/*
 * WebGazer Continuous Tracking - Qualtrics Integration Templates
 *
 * This file contains code templates for integrating continuous eye tracking
 * into your Qualtrics surveys. Copy and paste the appropriate template into
 * each question's HTML/JavaScript as needed.
 *
 * Template Selection Guide:
 * - Q1: Use "Question 1: Calibration + Tracker Initialization" template (REQUIRED - first question only)
 * - Q2-Q9, Q11-Q19, etc.: Use "Questions 2+: Standard Tracking" template
 * - Q10, Q20, Q30, Q40, etc.: Use "Recalibration Questions" template (every 10th question)
 */

// ============================================================================
// HEADER: PERSISTENT IFRAME (REQUIRED - Add this FIRST)
// ============================================================================
/*
 * Add this to Look & Feel > General > Header BEFORE setting up any questions.
 * This creates ONE iframe that persists throughout the entire survey.
 *
 * Instructions:
 * 1. In Qualtrics, go to Look & Feel (top of survey editor)
 * 2. Click "General" tab
 * 3. Scroll down to "Header" section
 * 4. Click "Edit"
 * 5. Paste the code below
 * 6. Click "Save"
 */

// HEADER CODE (Look & Feel > General > Header):
/*
<script>
// Create persistent iframe that lives throughout entire survey
(function() {
  // Only create once
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

  console.log('[Header] Persistent iframe created');
})();
</script>
*/

// ============================================================================
// QUESTION 1: CALIBRATION
// ============================================================================
/*
 * Use this template for the FIRST question in your survey (after setting up header).
 * This makes the persistent iframe visible for calibration, then hides it again.
 *
 * Instructions:
 * 1. Create a new "Text/Graphic" question in Qualtrics
 * 2. Set question text to: "Please complete the eye tracking calibration."
 * 3. Click the gear icon → "Add JavaScript"
 * 4. Paste the JavaScript code below
 * 5. Save the question
 */

// JAVASCRIPT CODE FOR QUESTION 1:
/*
Qualtrics.SurveyEngine.addOnload(function() {
  const iframe = document.getElementById('calibration-iframe');

  if (!iframe) {
    console.error('[Q1] Persistent iframe not found! Check header setup.');
    return;
  }

  // Make iframe visible and full-size for calibration
  iframe.style.width = '100%';
  iframe.style.height = '800px';
  iframe.style.position = 'relative';
  iframe.style.visibility = 'visible';
  iframe.style.pointerEvents = 'auto';
  iframe.style.zIndex = '1';

  // Listen for calibration-complete message from iframe
  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      console.log('[Q1] Calibration complete, hiding iframe');

      // Save calibration data to embedded data
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_model_key', event.data.model_key);

      // Hide iframe (but keep it alive!)
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '0';
      iframe.style.left = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-1';

      // Advance to next question after brief delay
      setTimeout(function() {
        document.getElementById('NextButton').click();
      }, 1000);
    }
  });
});
*/

// ============================================================================
// QUESTIONS 2+: STANDARD TRACKING QUESTIONS
// ============================================================================
/*
 * Use this template for regular survey questions with eye tracking (Q2, Q3, Q4, etc.)
 * Skip questions Q10, Q20, Q30, etc. - use the recalibration template for those.
 *
 * Instructions:
 * 1. Create your survey question normally in Qualtrics
 * 2. Click "Add JavaScript" in the question
 * 3. Paste the JavaScript code below
 * 4. Change 'Q2' to match your question number (e.g., 'Q3', 'Q4', etc.)
 */

// JAVASCRIPT CODE FOR STANDARD TRACKING QUESTIONS:
/*
Qualtrics.SurveyEngine.addOnload(function() {
  // ⚠️ IMPORTANT: Change this to match your question number (Q2, Q3, Q4, etc.)
  const questionId = 'Q2';  // ← UPDATE THIS FOR EACH QUESTION

  // Get the persistent iframe (created by header)
  const iframe = document.getElementById('calibration-iframe');

  if (!iframe) {
    console.error('[Q' + questionId.substring(1) + '] Persistent iframe not found!');
    return;
  }

  let gazeData = [];
  let trackingStartTime = performance.now();

  // Wait for tracking-ready message from iframe
  const trackingReadyListener = function(event) {
    if (event.data.type === 'tracking-ready') {
      console.log('[Q' + questionId.substring(1) + '] 📡 Tracking ready message received');

      // Add delay to ensure iframe is ready to receive messages
      setTimeout(function() {
        console.log('[Q' + questionId.substring(1) + '] ▶️ Sending start-tracking command');

        // Start tracking for this question
        iframe.contentWindow.postMessage({
          type: 'start-tracking',
          questionId: questionId,
          questionStartTime: trackingStartTime
        }, '*');
      }, 200); // 200ms delay

      // Remove this one-time listener
      window.removeEventListener('message', trackingReadyListener);
    }
  };
  window.addEventListener('message', trackingReadyListener);

  // Send viewport updates for coordinate transformation (handles scrolling)
  const viewportInterval = setInterval(function() {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'viewport-update',
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }, '*');
    }
  }, 100);
  this.viewportInterval = viewportInterval;

  // Listen for gaze data from tracking iframe
  const gazeListener = function(event) {
    if (event.data.type === 'gaze-data') {
      // Log first data point to confirm tracking is working
      if (gazeData.length === 0) {
        console.log('[Q' + questionId.substring(1) + '] ✅ First gaze data received:', event.data);
      }

      gazeData.push({
        t: Math.round(event.data.timestamp - trackingStartTime),
        x: Math.round(event.data.x),
        y: Math.round(event.data.y)
      });
    }
  };
  window.addEventListener('message', gazeListener);
  this.gazeListener = gazeListener;
  this.gazeData = gazeData;
  this.trackingStartTime = trackingStartTime;
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
  const questionId = 'Q2';  // ← UPDATE THIS TO MATCH ABOVE

  console.log('[Q' + questionId.substring(1) + '] 💾 Saving gaze data. Sample count:', this.gazeData ? this.gazeData.length : 0);

  const trackingIframe = document.getElementById('calibration-iframe');

  // Pause tracking during page transition
  if (trackingIframe) {
    trackingIframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
  }

  // Clean up
  if (this.viewportInterval) {
    clearInterval(this.viewportInterval);
  }
  if (this.gazeListener) {
    window.removeEventListener('message', this.gazeListener);
  }

  // Save gaze data to embedded data (compressed format)
  const gazeDataArray = this.gazeData || [];
  const compressed = gazeDataArray.map(d => `${d.t},${d.x},${d.y}`).join('|');

  console.log('[Q' + questionId.substring(1) + '] 💾 Compressed data length:', compressed.length, 'bytes');

  Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, compressed);
});
*/

// ============================================================================
// RECALIBRATION QUESTIONS (Q10, Q20, Q30, etc.)
// ============================================================================
/*
 * Use this template for every 10th question (Q10, Q20, Q30, Q40, etc.)
 * Offers optional recalibration while still collecting gaze data.
 *
 * Instructions:
 * 1. Create a new "Text/Graphic" question at Q10 position
 * 2. Click HTML view and paste the HTML code
 * 3. Click "Add JavaScript" and paste the JavaScript code
 * 4. Update question numbers in both HTML and JavaScript
 */

// HTML CODE FOR RECALIBRATION QUESTIONS:
/*
<div id="recalibration-container">
  <!-- Recalibration prompt -->
  <div id="recalibration-prompt" style="text-align: center; padding: 50px;">
    <h2>Optional: Recalibrate Eye Tracking</h2>
    <p>We've reached the midpoint of the survey. Would you like to recalibrate your eye tracking for better accuracy?</p>
    <button onclick="showRecalibration()" style="padding: 15px 30px; font-size: 16px; margin: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Recalibrate
    </button>
    <button onclick="skipRecalibration()" style="padding: 15px 30px; font-size: 16px; margin: 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Skip
    </button>
  </div>

</div>

<script>
  function showRecalibration() {
    document.getElementById('recalibration-prompt').style.display = 'none';
    document.querySelector('#NextButton').style.display = 'none';

    // Find the persistent calibration iframe
    const calibrationIframe = document.getElementById('calibration-iframe');
    if (calibrationIframe) {
      // Show the iframe for recalibration
      calibrationIframe.style.position = 'relative';
      calibrationIframe.style.width = '100%';
      calibrationIframe.style.height = '800px';
      calibrationIframe.style.visibility = 'visible';
      calibrationIframe.style.pointerEvents = 'auto';
      calibrationIframe.style.zIndex = 'auto';
      calibrationIframe.style.border = '2px solid #3498db';

      // Move back to container if it was moved to body
      document.getElementById('recalibration-container').appendChild(calibrationIframe);

      // Send recalibrate command to iframe
      calibrationIframe.contentWindow.postMessage({ type: 'recalibrate' }, '*');
    }
  }

  function skipRecalibration() {
    // Just advance to next question
    document.querySelector('#NextButton').click();
  }

  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      // Hide calibration iframe and return to tracking mode
      const calibrationIframe = document.getElementById('calibration-iframe');
      if (calibrationIframe) {
        calibrationIframe.style.position = 'fixed';
        calibrationIframe.style.bottom = '0';
        calibrationIframe.style.left = '0';
        calibrationIframe.style.width = '1px';
        calibrationIframe.style.height = '1px';
        calibrationIframe.style.border = 'none';
        calibrationIframe.style.visibility = 'hidden';
        calibrationIframe.style.pointerEvents = 'none';
        calibrationIframe.style.zIndex = '-1';

        // Move back to document.body
        document.body.appendChild(calibrationIframe);

        // Resume tracking (iframe automatically switches to tracking mode after recalibration)
        calibrationIframe.contentWindow.postMessage({ type: 'resume-tracking' }, '*');
      }

      // Save recalibration event
      Qualtrics.SurveyEngine.setEmbeddedData('recalibrated_at_Q10', true);  // UPDATE QUESTION NUMBER

      // Auto-advance
      setTimeout(function() {
        document.querySelector('#NextButton').click();
      }, 1500);
    }
  });
</script>

<style>
  #NextButton { display: inline-block !important; }
</style>
*/

// JAVASCRIPT CODE FOR RECALIBRATION QUESTIONS:
/*
Qualtrics.SurveyEngine.addOnload(function() {
  // ⚠️ IMPORTANT: Change this to match your question number (Q10, Q20, Q30, etc.)
  const questionId = 'Q10';  // ← UPDATE THIS FOR EACH RECALIBRATION QUESTION

  // Get the persistent iframe (created by header)
  const iframe = document.getElementById('calibration-iframe');

  if (!iframe) {
    console.error('[Q' + questionId.substring(1) + '] Persistent iframe not found!');
    return;
  }

  let gazeData = [];
  let trackingStartTime = performance.now();

  // Wait for tracking-ready message from iframe
  const trackingReadyListener = function(event) {
    if (event.data.type === 'tracking-ready') {
      console.log('[Q' + questionId.substring(1) + '] 📡 Tracking ready message received');

      // Add delay to ensure iframe is ready to receive messages
      setTimeout(function() {
        console.log('[Q' + questionId.substring(1) + '] ▶️ Sending start-tracking command');

        // Start tracking for this question (tracks during prompt and recalibration)
        iframe.contentWindow.postMessage({
          type: 'start-tracking',
          questionId: questionId,
          questionStartTime: trackingStartTime
        }, '*');
      }, 200); // 200ms delay

      // Remove this one-time listener
      window.removeEventListener('message', trackingReadyListener);
    }
  };
  window.addEventListener('message', trackingReadyListener);

  // Send viewport updates
  const viewportInterval = setInterval(function() {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'viewport-update',
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }, '*');
    }
  }, 100);
  this.viewportInterval = viewportInterval;

  // Listen for gaze data
  const gazeListener = function(event) {
    if (event.data.type === 'gaze-data') {
      // Log first data point to confirm tracking is working
      if (gazeData.length === 0) {
        console.log('[Q' + questionId.substring(1) + '] ✅ First gaze data received:', event.data);
      }

      gazeData.push({
        t: Math.round(event.data.timestamp - trackingStartTime),
        x: Math.round(event.data.x),
        y: Math.round(event.data.y)
      });
    }
  };
  window.addEventListener('message', gazeListener);
  this.gazeListener = gazeListener;
  this.gazeData = gazeData;
  this.trackingStartTime = trackingStartTime;
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
  const questionId = 'Q10';  // ← UPDATE THIS TO MATCH ABOVE

  console.log('[Q' + questionId.substring(1) + '] 💾 Saving gaze data. Sample count:', this.gazeData ? this.gazeData.length : 0);

  const trackingIframe = document.getElementById('calibration-iframe');

  // Pause tracking
  if (trackingIframe) {
    trackingIframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
  }

  // Cleanup
  if (this.viewportInterval) {
    clearInterval(this.viewportInterval);
  }
  if (this.gazeListener) {
    window.removeEventListener('message', this.gazeListener);
  }

  // Save gaze data
  const gazeDataArray = this.gazeData || [];
  const compressed = gazeDataArray.map(d => `${d.t},${d.x},${d.y}`).join('|');

  console.log('[Q' + questionId.substring(1) + '] 💾 Compressed data length:', compressed.length, 'bytes');

  Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, compressed);
});
*/

// ============================================================================
// EMBEDDED DATA SETUP
// ============================================================================
/*
 * Before running your survey, set up these embedded data fields in Survey Flow:
 *
 * 1. Go to Survey Flow in Qualtrics
 * 2. Click "Add a New Element Here" at the TOP
 * 3. Select "Embedded Data"
 * 4. Add these fields (leave values blank):
 *
 * Calibration Data (from Q1):
 * - eyetracking_offset
 * - eyetracking_recalibrated
 * - eyetracking_attempts
 * - eyetracking_validation
 * - eyetracking_model_key
 *
 * Gaze Data (one per tracked question):
 * - gaze_Q2
 * - gaze_Q3
 * - gaze_Q4
 * ... (add one for each question you're tracking)
 * - gaze_Q10 (if using recalibration)
 * ...
 *
 * Recalibration Markers (optional):
 * - recalibrated_at_Q10
 * - recalibrated_at_Q20
 * ... (add one for each recalibration question)
 *
 * 5. Move this Embedded Data element to the VERY TOP of your Survey Flow
 * 6. Click "Save Flow"
 */

// ============================================================================
// DATA FORMAT
// ============================================================================
/*
 * Gaze data is stored in compressed format:
 * Format: "t1,x1,y1|t2,x2,y2|t3,x3,y3|..."
 *
 * Where:
 * - t = timestamp in milliseconds (relative to question start)
 * - x = gaze x-coordinate in pixels (relative to viewport)
 * - y = gaze y-coordinate in pixels (relative to viewport)
 *
 * Example:
 * "0,512,384|67,515,386|134,518,390|201,520,392|..."
 *
 * To parse in R:
 *   library(tidyr)
 *   gaze_df <- data.frame(raw = unlist(strsplit(gaze_data, "\\|")))
 *   gaze_df <- separate(gaze_df, raw, into = c("t", "x", "y"), sep = ",", convert = TRUE)
 *
 * To parse in Python:
 *   import pandas as pd
 *   samples = [s.split(',') for s in gaze_data.split('|')]
 *   df = pd.DataFrame(samples, columns=['t', 'x', 'y'], dtype=int)
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================
/*
 * Common Issues:
 *
 * 1. "Tracking iframe not found"
 *    - Make sure Q1 (calibration question) has been completed
 *    - Check that the tracking iframe is present in the page HTML
 *
 * 2. "No gaze data collected"
 *    - Verify participant granted camera permission on Q1
 *    - Check browser console for errors
 *    - Ensure embedded data fields are set up in Survey Flow
 *
 * 3. "Data shows NaN or null values"
 *    - Check that WebGazer is properly initialized
 *    - Verify calibration completed successfully
 *    - Look for JavaScript errors in console
 *
 * 4. "Coordinates seem wrong"
 *    - Ensure viewport updates are running (check console)
 *    - Verify no errors in coordinate transformation
 *    - Test with scrolling content
 *
 * 5. "Too much data / hitting size limits"
 *    - Reduce sampling rate (change from 15 Hz to lower)
 *    - Track fewer questions
 *    - Use external server for data storage instead of embedded data
 */
