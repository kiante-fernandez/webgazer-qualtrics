# Qualtrics Integration Guide

This guide shows you how to embed eye tracking experiments into your Qualtrics surveys using iframes.

## Quick Start (3 Steps)

### 1. Create Embedded Data Fields (Optional but Recommended)

Before adding the eye tracking question, set up embedded data fields to store the results:

1. Go to **Survey Flow** in your Qualtrics survey
2. Click **Add a New Element Here** → **Embedded Data**
3. Add these fields:
   - `eyetracking_validation`
   - `eyetracking_average_offset`
4. Move this element to the **top** of the survey flow
5. Click **Save Flow**

### 2. Create Eye Tracking Question

1. Add a new **Text/Graphic** question to your survey
2. Give it a name like "Eye Tracking Setup"
3. Click the **HTML View** button (`<>`) in the question editor
4. Paste one of the code snippets below (choose your variant)
5. Save the question

### 3. That's It!

The eye tracking will run automatically when respondents reach this question, and data will be saved to the embedded data fields.

---

## Code Snippets

Choose one of the three variants below based on your needs:

### Option A: Minimal (Recommended for Most Users)

**Duration:** ~30 seconds
**Features:** Camera init → Calibration → Validation → Auto-advance

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/minimal.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'eyetracking-complete') {
      // Save to Qualtrics embedded data
      if (typeof Qualtrics !== 'undefined') {
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation));
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_average_offset', event.data.validation.average_offset);

        // Auto-advance to next question
        setTimeout(function() {
          document.querySelector('#NextButton').click();
        }, 1000);
      }
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

### Option B: Standard (With Instructions)

**Duration:** ~2 minutes
**Features:** Welcome screen → Instructions → Calibration → Validation → Auto-advance

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/standard.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'eyetracking-complete') {
      // Save to Qualtrics embedded data
      if (typeof Qualtrics !== 'undefined') {
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation));
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_average_offset', event.data.validation.average_offset);

        // Auto-advance to next question
        setTimeout(function() {
          document.querySelector('#NextButton').click();
        }, 1000);
      }
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

### Option C: Full Experiment (With Recalibration & Example Trial)

**Duration:** ~5 minutes
**Features:** Full instructions → Calibration → Validation → Optional recalibration → Example trial → Auto-advance

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/full.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'eyetracking-complete') {
      // Save to Qualtrics embedded data
      if (typeof Qualtrics !== 'undefined') {
        // Full experiment sends both eyetracking_data and calibration_data
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_data', JSON.stringify(event.data.eyetracking_data));
        Qualtrics.SurveyEngine.setEmbeddedData('calibration_data', JSON.stringify(event.data.calibration_data));

        // Auto-advance to next question
        setTimeout(function() {
          document.querySelector('#NextButton').click();
        }, 1000);
      }
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

---

## Data Output

### Minimal & Standard Variants

The validation data is saved to the `eyetracking_validation` embedded data field as a JSON object:

```json
{
  "raw_gaze": [[x, y], [x, y], ...],
  "validation_points": [[x, y], [x, y], ...],
  "average_offset": 156.7,
  "percent_in_roi": [95, 90, 85, 80, 75],
  "... other jsPsych validation data ..."
}
```

**Key fields:**
- `average_offset` - Average distance between gaze predictions and target points (in pixels). Lower is better. Typical range: 50-200px.
- `percent_in_roi` - Percentage of gaze predictions within region of interest for each validation point.
- `raw_gaze` - All raw gaze coordinates during validation.

### Full Variant

The full experiment saves two fields:
- `eyetracking_data` - Array of all validation trials
- `calibration_data` - Array of all calibration trials

---

## Customization

### Adjust Iframe Height

If the content doesn't fit properly, adjust the height:

```html
<div style="width: 100%; height: 900px;">  <!-- Changed from 800px -->
  <iframe
    ...
    height="900px">  <!-- Changed from 800px -->
```

### Disable Auto-Advance

Remove these lines from the code:

```javascript
// Auto-advance to next question
setTimeout(function() {
  document.querySelector('#NextButton').click();
}, 1000);
```

And remove this style:

```html
<style>
  #NextButton { display: none !important; }
</style>
```

### Custom Calibration Points

To use different calibration points, you'll need to fork the repository and modify the experiment HTML files. See the main README for instructions.

---

## Troubleshooting

### Camera Permission Denied

**Problem:** Participants see "Permission denied" or camera doesn't initialize.

**Solution:**
- Ensure participants are using HTTPS (required for camera access)
- Ask participants to check browser permissions and allow camera access
- Some browsers block camera in iframes - this is rare but can happen

### Iframe Not Displaying

**Problem:** Blank space where iframe should be.

**Solution:**
- Check browser console for errors
- Verify the iframe `src` URL is correct
- Ensure your Qualtrics survey allows iframes (some organizations restrict this)

### Data Not Saving

**Problem:** Embedded data fields are empty after completion.

**Solution:**
- Verify embedded data fields are created in Survey Flow **before** the eye tracking question
- Field names must match exactly: `eyetracking_validation`, `eyetracking_average_offset`
- Check browser console for JavaScript errors

### Poor Calibration Accuracy

**Problem:** `average_offset` is very high (>300px).

**Solution:**
- Ensure good lighting on participant's face
- Ask participant to sit still and maintain consistent head position
- Use the **Full** variant which allows recalibration
- Consider adding instructions before the eye tracking question

---

## Technical Details

### Why Iframe Approach?

Qualtrics enforces a Content Security Policy (CSP) that blocks `eval()` in JavaScript. WebGazer's regression models require `eval()` to function. By hosting the experiments externally and embedding via iframe, the experiments run in a different origin where CSP restrictions don't apply.

### Browser Compatibility

- **Supported:** Chrome, Edge, Firefox, Safari (modern versions)
- **Required:** HTTPS connection for camera access
- **Note:** Mobile browsers have limited webcam support

### Privacy & Data

- Eye tracking runs entirely in the participant's browser
- No video or images are sent to any server
- Only gaze coordinates (x, y pixel positions) are saved
- Participants must explicitly grant camera permission

---

## Next Steps

After setting up eye tracking:

1. **Test in Preview Mode** - Always test the survey in preview mode first
2. **Check Data Export** - Download test response and verify embedded data fields contain the expected JSON
3. **Add Real Survey Questions** - The eye tracker remains active after calibration, so you can track gaze on subsequent questions (requires additional setup)
4. **Analyze Results** - Use the validation data to filter out low-quality responses (e.g., average_offset > 250px)

---

## Support

For issues, questions, or feature requests:
- [GitHub Repository](https://github.com/kiante-fernandez/webgazer-qualtrics)
- [Open an Issue](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)

---

## Credits

This integration uses:
- [jsPsych](https://www.jspsych.org/) - Behavioral experiment framework
- [WebGazer.js](https://webgazer.cs.brown.edu/) - Eye tracking library
