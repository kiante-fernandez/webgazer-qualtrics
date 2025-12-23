# Continuous Eye Tracking for Qualtrics

Track where participants look throughout your **entire survey** - on every question, from start to finish.

## What You Get

- **One-time calibration** - Calibrate once at the start
- **Continuous tracking** - Collect gaze data on every survey question
- **Raw coordinates** - Get x, y gaze positions at 15 samples/second
- **Large surveys** - Supports 50+ questions

## How It Works

```
Question 1 (Calibration)
    ↓
Participant calibrates → Iframe switches to tracking mode → Becomes hidden
    ↓
Questions 2-N (Your Survey)
    ↓
    ↓
Each question activates tracking → Gaze streams at 15 Hz → Data saved on advance
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
gaze_Q10
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
  // IMPORTANT: Replace this URL with your own hosted calibration.html
  iframe.src = 'https://YOUR-USERNAME.github.io/webgazer-qualtrics/experiments/calibration.html';
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

    // Remove listener immediately to prevent firing on future pages
    window.removeEventListener('message', messageHandler);

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
```

4. **Change ONLY the last line** to match your question number:
   - For Q2: `})('Q2');`
   - For Q3: `})('Q3');`
   - For Q4: `})('Q4');`
   - etc.
5. Save the question



---

## You're Done!

Your continuous eye tracking is now set up. When participants take your survey:
1. Q1: They'll complete calibration
2. Q2+: Gaze data streams automatically on every question
3. Data exports with your Qualtrics responses

---

## Reference

### Data Format
 
Gaze data is saved as a **JSON Array of Arrays**: `[[0,512,384],[67,515,386],...]`
 
Where each inner array contains:
- `[0]` = Timestamp in ms (relative to question start)
- `[1]` = Gaze X coordinate in pixels
- `[2]` = Gaze Y coordinate in pixels
 
**Example:** `gaze_Q2 = [[0,512,384],[67,515,386],...]`
 
**Data Size:** This format saves ~50% space compared to standard JSON. At 15 Hz, expect ~1-1.5 KB per 5-second question.

### Configuration

**Sampling Rate:** Default sampling rate is determined by the WebEyeTrack library (typically 15-30 Hz depending on device). Higher rates generate more data.

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
- Look for `[Calibration] Sample #` messages in console to verify tracking is active

**Coordinates Wrong or NaN/Null**
- Verify calibration completed successfully
- Check for `[Calibration] Tracking mode active` in console

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
