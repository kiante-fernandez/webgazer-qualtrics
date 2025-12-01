# Continuous Eye Tracking for Qualtrics

Track where participants look throughout your **entire survey** - on every question, from start to finish.

## What You Get

- **One-time calibration** - Calibrate once at the start
- **Continuous tracking** - Collect gaze data on every survey question
- **Raw coordinates** - Get x, y gaze positions at 15 samples/second
- **Large surveys** - Supports 50+ questions
- **Optional recalibration** - Maintain accuracy in long surveys

## How It Works

```
Question 1 (Calibration)
    ↓
Participant calibrates → Iframe switches to tracking mode → Becomes hidden
    ↓
Questions 2-N (Your Survey)
    ↓
Each question activates tracking → Gaze streams at 15 Hz → Data saved on advance
    ↓
Questions 10, 20, 30... (Optional Recalibration)
    ↓
Show iframe → Recalibrate → Hide iframe → Resume tracking
```

**Key Feature**: ONE iframe persists throughout the entire survey, maintaining calibration data across all questions.

---

## Setup Guide

Follow these 5 steps to add continuous eye tracking to your Qualtrics survey.

### Step 1: Set Up Embedded Data Fields

**In Qualtrics:**
1. Go to **Survey Flow**
2. Click **"Add a New Element Here"** at the very top
3. Select **"Embedded Data"**
4. Add these field names (copy the list below):

```
eyetracking_offset
eyetracking_recalibrated
eyetracking_attempts
eyetracking_validation
eyetracking_model_key
gaze_Q2
gaze_Q3
gaze_Q4
gaze_Q5
gaze_Q6
gaze_Q7
gaze_Q8
gaze_Q9
recalibrated_at_Q10
gaze_Q11
gaze_Q12
```

> **Note**: Add one `gaze_Q#` field for each question you want to track. Add more as needed for your survey length.

5. **Move this element to the TOP** of your Survey Flow
6. Click **"Save Flow"**

### Step 2: Create Persistent Iframe (Header)

**In Qualtrics:**
1. Go to **Look & Feel** (top of survey editor)
2. Click **"General"** tab
3. Scroll down to **"Header"** section
4. Click **"Edit"**
5. **Copy and paste this code**:

```html
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
```

6. Click **"Save"**

**What this does:**
- Creates ONE iframe when survey starts that persists across all questions
- Iframe starts hidden (1px × 1px, invisible)
- Q1 will make it visible for calibration, then hide it again
- Q2+ reuse the same iframe for tracking

### Step 3: Create Question 1 (Calibration)

**In Qualtrics:**
1. Add a new **"Text/Graphic"** question as your first survey question
2. Set the question text to: **"Please complete the eye tracking calibration."**
3. Click the gear icon → **"Add JavaScript"**
4. **Copy and paste this code**:

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  const iframe = document.getElementById('calibration-iframe');

  if (!iframe) {
    console.error('[Q1] Persistent iframe not found! Check header setup.');
    return;
  }

  // Make iframe visible and full-size for calibration
  Object.assign(iframe.style, {
    width: '100%',
    height: '800px',
    position: 'relative',
    visibility: 'visible',
    pointerEvents: 'auto',
    zIndex: '1'
  });

  const messageHandler = function(event) {
    if (!event.data || event.data.type !== 'calibration-complete') return;

    console.log('[Q1] Calibration complete, hiding iframe');

    // Save calibration data to embedded data
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));
    Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_model_key', event.data.model_key);

    // Hide iframe but keep it rendering (preserve coordinate scaling)
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

    // Advance to next question after brief delay
    setTimeout(function() {
      const nextBtn = document.getElementById('NextButton');
      if (nextBtn) nextBtn.click();
    }, 1000);
  };

  window.addEventListener('message', messageHandler);
});
```

5. Save the question

**What this does:**
- Makes the persistent iframe visible for calibration
- Displays welcome screen with camera permission request
- Shows "Initializing camera..." status, then "Camera ready" when ready
- User sees clear instructions before calibration begins
- Green dots appear for calibration (8 positions)
- Blue dots appear for validation (4 positions)
- After calibration completes, hides the iframe again
- Iframe stays alive in tracking mode throughout rest of survey
- Auto-advances to Question 2

### Step 4: Add Tracking to Questions 2+

**For each survey question you want to track** (Q2, Q3, Q4, Q5, etc.):

**In Qualtrics:**
1. Create your survey question normally (Multiple Choice, Text Entry, etc.)
2. Click the gear icon → **"Add JavaScript"**
3. **Copy and paste this code**:

```javascript
(function (questionId) {
  let gazeData = [];
  let gazeListener = null;
  let viewportInterval = null;
  let trackingStartTime = 0;

  Qualtrics.SurveyEngine.addOnload(function () {
    const iframe = document.getElementById('calibration-iframe');
    if (!iframe) {
      console.error('[' + questionId + '] Persistent iframe not found! Make sure Header code is installed.');
      return;
    }

    gazeData = [];
    trackingStartTime = performance.now();

    iframe.contentWindow.postMessage({
      type: 'start-tracking',
      questionId: questionId,
      questionStartTime: trackingStartTime
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
      if (event.data.type === 'gaze-data') {
        // Ensure valid data before pushing
        if (typeof event.data.x === 'number' && typeof event.data.y === 'number') {
          gazeData.push({
            t: Math.round(event.data.timestamp - trackingStartTime),
            x: Math.round(event.data.x),
            y: Math.round(event.data.y)
          });
        }
      } else if (event.data.type === 'gaze-data-batch') {
        // Handle batch data (note: this usually arrives AFTER page submit, so it might be too late for saving)
        event.data.samples.forEach(s => {
          // FIX: Use s.timestamp instead of s.perf_t
          const timestamp = s.timestamp !== undefined ? s.timestamp : s.perf_t;

          gazeData.push({
            t: Math.round(timestamp - trackingStartTime),
            x: Math.round(s.x),
            y: Math.round(s.y)
          });
        });
      }
    };
    window.addEventListener('message', gazeListener);
  });

  Qualtrics.SurveyEngine.addOnPageSubmit(function () {
    const trackingIframe = document.getElementById('calibration-iframe');
    if (trackingIframe) {
      trackingIframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
    }

    if (viewportInterval) {
      clearInterval(viewportInterval);
    }

    // Delay listener removal slightly
    setTimeout(() => {
      if (gazeListener) {
        window.removeEventListener('message', gazeListener);
      }
    }, 1000);

    // Save as JSON
    const dataToSave = JSON.stringify(gazeData);
    Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, dataToSave);
  });
})('Q2');
```

4. **Change ONLY the last line** to match your question number:
   - For Q2: `})('Q2');`
   - For Q3: `})('Q3');`
   - For Q4: `})('Q4');`
   - etc.
5. Save the question

**Repeat for all tracked questions**: Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q11, Q12, etc. (skip Q10 for now)

### Step 5: Add Recalibration Questions (Optional but Recommended)

**For Question 10** (and Q20, Q30, Q40 if your survey is long):

**In Qualtrics:**
1. Create a new **"Text/Graphic"** question at position Q10
2. Click **HTML view** button
3. **Copy and paste this HTML**:

```html
<div id="recalibration-container">
  <div id="recalibration-prompt" style="text-align: center; padding: 50px;">
    <h2>Optional: Recalibrate Eye Tracking</h2>
    <p>We've reached the midpoint of the survey. Would you like to recalibrate for better accuracy?</p>
    <button onclick="showRecalibration()" style="padding: 15px 30px; font-size: 16px; margin: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Recalibrate</button>
    <button onclick="skipRecalibration()" style="padding: 15px 30px; font-size: 16px; margin: 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Skip</button>
  </div>
</div>

<script>
  function showRecalibration() {
    document.getElementById('recalibration-prompt').style.display = 'none';
    document.querySelector('#NextButton').style.display = 'none';
    const calibrationIframe = document.getElementById('calibration-iframe');
    if (calibrationIframe) {
      // 1. Make iframe visible (modal style) - DO NOT MOVE in DOM to avoid double reload
      Object.assign(calibrationIframe.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        visibility: 'visible',
        pointerEvents: 'auto',
        zIndex: '9999',
        background: 'white',
        opacity: '1'
      });

      // 2. Trigger recalibration via MESSAGE (no reload)
      calibrationIframe.contentWindow.postMessage({ type: 'recalibrate' }, '*');
    }
  }

  function skipRecalibration() {
    document.querySelector('#NextButton').click();
  }

  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      const calibrationIframe = document.getElementById('calibration-iframe');
      if (calibrationIframe) {
        // 3. Hide iframe and restore tracking state props
        Object.assign(calibrationIframe.style, {
          width: '100%',     // Keep full width for coordinate mapping
          height: '100vh',   // Keep full height
          opacity: '0.01',   // Hidden but rendering
          zIndex: '-1',
          pointerEvents: 'none',
          background: 'transparent' // Restore transparency
        });
        
        // Resume tracking
        calibrationIframe.contentWindow.postMessage({ type: 'resume-tracking' }, '*');
      }
      Qualtrics.SurveyEngine.setEmbeddedData('recalibrated_at_Q10', true);
      setTimeout(function() { document.querySelector('#NextButton').click(); }, 1500);
    }
  });
</script>

<style>
  #NextButton { display: inline-block !important; }
</style>
```

4. Click the gear icon → **"Add JavaScript"**
5. **Copy and paste this JavaScript**:

```javascript
(function (questionId) {
  let gazeData = [];
  let gazeListener = null;
  let viewportInterval = null;
  let trackingStartTime = 0;

  Qualtrics.SurveyEngine.addOnload(function () {
    const iframe = document.getElementById('calibration-iframe');
    if (!iframe) {
      console.error('[' + questionId + '] Persistent iframe not found! Make sure Header code is installed.');
      return;
    }

    gazeData = [];
    trackingStartTime = performance.now();

    iframe.contentWindow.postMessage({
      type: 'start-tracking',
      questionId: questionId,
      questionStartTime: trackingStartTime
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
      if (event.data.type === 'gaze-data') {
        // Ensure valid data before pushing
        if (typeof event.data.x === 'number' && typeof event.data.y === 'number') {
          gazeData.push({
            t: Math.round(event.data.timestamp - trackingStartTime),
            x: Math.round(event.data.x),
            y: Math.round(event.data.y)
          });
        }
      } else if (event.data.type === 'gaze-data-batch') {
        // Handle batch data (note: this usually arrives AFTER page submit, so it might be too late for saving)
        event.data.samples.forEach(s => {
          // FIX: Use s.timestamp instead of s.perf_t
          const timestamp = s.timestamp !== undefined ? s.timestamp : s.perf_t;

          gazeData.push({
            t: Math.round(timestamp - trackingStartTime),
            x: Math.round(s.x),
            y: Math.round(s.y)
          });
        });
      }
    };
    window.addEventListener('message', gazeListener);
  });

  Qualtrics.SurveyEngine.addOnPageSubmit(function () {
    const trackingIframe = document.getElementById('calibration-iframe');
    if (trackingIframe) {
      trackingIframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
    }

    if (viewportInterval) {
      clearInterval(viewportInterval);
    }

    // Delay listener removal slightly
    setTimeout(() => {
      if (gazeListener) {
        window.removeEventListener('message', gazeListener);
      }
    }, 1000);

    // Save as JSON
    const dataToSave = JSON.stringify(gazeData);
    Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, dataToSave);
  });
})('Q10');
```

6. **Update question IDs** in TWO places:
   - HTML: `'recalibrated_at_Q10'` → change to `'recalibrated_at_Q20'` for Q20, etc.
   - JavaScript: Change ONLY the last line to match your question number:
     - For Q10: `})('Q10');`
     - For Q20: `})('Q20');`
     - For Q30: `})('Q30');`
7. Save the question

**Repeat for Q20, Q30, Q40** if your survey has 20+ questions.

---

## You're Done!

Your continuous eye tracking is now set up. When participants take your survey:
1. Q1: They'll complete calibration
2. Q2+: Gaze data streams automatically on every question
3. Data exports with your Qualtrics responses

---

## Reference

### Data Format

Gaze data is saved as a **JSON string**: `[{"t":0,"x":512,"y":384},{"t":67,"x":515,"y":386},...]`

Where:
- `t` = Timestamp in ms (relative to question start)
- `x`, `y` = Gaze coordinates in pixels (relative to viewport)

**Example:** `gaze_Q2 = [{"t":0,"x":512,"y":384},{"t":67,"x":515,"y":386},...]`

**Data Size:** At 15 Hz, expect ~2-3 KB per 5-second question. A 50-question survey = ~150 KB (well within Qualtrics limits).

### Configuration

**Sampling Rate:** Default is 15 Hz. To increase fidelity, edit [calibration.html:251](../experiments/calibration.html#L251) and change `samplingRate = 15` to 30 or 60 Hz. Higher rates generate more data.

**Recalibration Frequency:** Consider adding recalibration questions at any interval (Q5, Q15, Q25) or skip entirely.

**Selective Tracking:** Only add tracking JavaScript to questions you want to track. Skip questions don't need tracking code.

### Troubleshooting

**Camera Permission Denied**
- Use HTTPS (required for webcam access)
- Participants must allow camera in browser
- Chrome/Edge work best

**Tracking Iframe Not Found**
- Verify Q1 calibration completed
- Check `calibration-iframe` exists in document.body (use browser dev tools)

**No Gaze Data Collected**
- Verify camera permission granted on Q1
- Check browser console for errors
- Ensure embedded data fields set up in Survey Flow
- Verify `questionId` matches in both `addOnload` and `addOnPageSubmit`
- Look for `[Calibration] WebGazer is producing predictions` in console

**Coordinates Wrong or NaN/Null**
- Verify calibration completed successfully
- Check for `[Calibration] Tracking mode active` in console
- Try recalibration if accuracy is poor

**Data Size Limits**
- Reduce sampling rate (edit calibration.html)
- Track fewer questions
- Use external server for storage

---

## Support

Questions or issues? [Open an issue on GitHub](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)

**Additional Resources:**
- [Code Templates](example-question-code.js)
- [Main README](../README.md)
