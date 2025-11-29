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

Follow these 4 steps to add continuous eye tracking to your Qualtrics survey.

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

### Step 2: Create Question 1 (Calibration)

**In Qualtrics:**
1. Add a new **"Text/Graphic"** question as your first survey question
2. Click the **HTML view** button (`<>`)
3. **Copy and paste this code**:

```html
<div style="width: 100%; height: 800px;">
  <!-- Single persistent iframe for both calibration and tracking -->
  <iframe id="calibration-iframe"
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html"
    width="100%" height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      // Save calibration data to embedded data
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_model_key', event.data.model_key);

      // Hide the calibration iframe (it switches to tracking mode automatically)
      const calibrationIframe = document.getElementById('calibration-iframe');
      if (calibrationIframe) {
        // Make iframe hidden but keep it loaded
        calibrationIframe.style.position = 'fixed';
        calibrationIframe.style.bottom = '0';
        calibrationIframe.style.left = '0';
        calibrationIframe.style.width = '1px';
        calibrationIframe.style.height = '1px';
        calibrationIframe.style.border = 'none';
        calibrationIframe.style.visibility = 'hidden';
        calibrationIframe.style.pointerEvents = 'none';
        calibrationIframe.style.zIndex = '-1';

        // Move iframe to document.body to persist across questions
        document.body.appendChild(calibrationIframe);
      }

      // Auto-advance to next question after 1.5 seconds
      setTimeout(function() {
        document.querySelector('#NextButton').click();
      }, 1500);
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

4. Save the question

**What this does:**
- Shows calibration interface to participant
- After calibration, iframe becomes hidden and persists
- Auto-advances to Question 2

### Step 3: Add Tracking to Questions 2+

**For each survey question you want to track** (Q2, Q3, Q4, Q5, etc.):

**In Qualtrics:**
1. Create your survey question normally (Multiple Choice, Text Entry, etc.)
2. Click the gear icon → **"Add JavaScript"**
3. **Copy and paste this code**:

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  // ⚠️ IMPORTANT: Change this to match your question number (Q2, Q3, Q4, etc.)
  const questionId = 'Q2';  // ← UPDATE THIS FOR EACH QUESTION

  let gazeData = [];
  let trackingStartTime = performance.now();

  // Find the persistent calibration iframe (now in tracking mode)
  const trackingIframe = document.getElementById('calibration-iframe');

  if (trackingIframe) {
    // Start tracking for this question
    trackingIframe.contentWindow.postMessage({
      type: 'start-tracking',
      questionId: questionId,
      questionStartTime: trackingStartTime
    }, '*');

    // Send viewport updates for coordinate transformation (handles scrolling)
    const viewportInterval = setInterval(function() {
      trackingIframe.contentWindow.postMessage({
        type: 'viewport-update',
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }, '*');
    }, 100);

    this.viewportInterval = viewportInterval;
  }

  // Listen for gaze data from tracking iframe
  const gazeListener = function(event) {
    if (event.data.type === 'gaze-data') {
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
  Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, compressed);
});
```

4. **Update the `questionId` variable** in TWO places:
   - Line 2: `const questionId = 'Q2';` → Change to your question number
   - Line 48: `const questionId = 'Q2';` → Change to match
5. Save the question

**Repeat for all tracked questions**: Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q11, Q12, etc. (skip Q10 for now)

### Step 4: Add Recalibration Questions (Optional but Recommended)

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
      calibrationIframe.style.position = 'relative';
      calibrationIframe.style.width = '100%';
      calibrationIframe.style.height = '800px';
      calibrationIframe.style.visibility = 'visible';
      calibrationIframe.style.pointerEvents = 'auto';
      calibrationIframe.style.zIndex = 'auto';
      calibrationIframe.style.border = '2px solid #3498db';
      document.getElementById('recalibration-container').appendChild(calibrationIframe);
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
        calibrationIframe.style.position = 'fixed';
        calibrationIframe.style.bottom = '0';
        calibrationIframe.style.left = '0';
        calibrationIframe.style.width = '1px';
        calibrationIframe.style.height = '1px';
        calibrationIframe.style.border = 'none';
        calibrationIframe.style.visibility = 'hidden';
        calibrationIframe.style.pointerEvents = 'none';
        calibrationIframe.style.zIndex = '-1';
        document.body.appendChild(calibrationIframe);
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
Qualtrics.SurveyEngine.addOnload(function() {
  const questionId = 'Q10';  // ⚠️ UPDATE FOR EACH RECALIBRATION QUESTION

  let gazeData = [];
  let trackingStartTime = performance.now();
  const trackingIframe = document.getElementById('calibration-iframe');

  if (trackingIframe) {
    trackingIframe.contentWindow.postMessage({
      type: 'start-tracking',
      questionId: questionId,
      questionStartTime: trackingStartTime
    }, '*');

    const viewportInterval = setInterval(function() {
      trackingIframe.contentWindow.postMessage({
        type: 'viewport-update',
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }, '*');
    }, 100);
    this.viewportInterval = viewportInterval;
  }

  const gazeListener = function(event) {
    if (event.data.type === 'gaze-data') {
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
  const questionId = 'Q10';  // ⚠️ UPDATE THIS TO MATCH ABOVE

  const trackingIframe = document.getElementById('calibration-iframe');
  if (trackingIframe) {
    trackingIframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
  }

  if (this.viewportInterval) {
    clearInterval(this.viewportInterval);
  }
  if (this.gazeListener) {
    window.removeEventListener('message', this.gazeListener);
  }

  const gazeDataArray = this.gazeData || [];
  const compressed = gazeDataArray.map(d => `${d.t},${d.x},${d.y}`).join('|');
  Qualtrics.SurveyEngine.setEmbeddedData('gaze_' + questionId, compressed);
});
```

6. **Update question IDs** in THREE places:
   - HTML: `'recalibrated_at_Q10'` (line 48)
   - JavaScript: `const questionId = 'Q10';` (line 2)
   - JavaScript: `const questionId = 'Q10';` (line 37)
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

Gaze data is saved in compressed format: `"t1,x1,y1|t2,x2,y2|..."`

Where:
- `t` = Timestamp in ms (relative to question start)
- `x`, `y` = Gaze coordinates in pixels (relative to viewport)

**Example:** `gaze_Q2 = "0,512,384|67,515,386|134,518,390|..."`

**Data Size:** At 15 Hz, expect ~1 KB per 5-second question. A 50-question survey = ~55 KB (well within Qualtrics limits).

### Configuration

**Sampling Rate:** Default is 15 Hz. To increase fidelity, edit [calibration.html:251](../experiments/calibration.html#L251) and change `samplingRate = 15` to 30 or 60 Hz. Higher rates generate more data.

**Recalibration Frequency:** Default is every 10 questions. Add recalibration questions at any interval (Q5, Q15, Q25) or skip entirely.

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
