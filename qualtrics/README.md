# Qualtrics Integration Guide

This guide shows you how to embed eye tracking calibration into your Qualtrics surveys using iframes.

## Quick Start (3 Steps)

### 1. Create Embedded Data Fields (Recommended)

Before adding the eye tracking question, set up embedded data fields to store the results:

1. Go to **Survey Flow** in your Qualtrics survey
2. Click **Add a New Element Here** → **Embedded Data**
3. Add these fields:
   - `eyetracking_offset`
   - `eyetracking_recalibrated`
   - `eyetracking_attempts`
   - `eyetracking_validation`
4. Move this element to the **top** of the survey flow
5. Click **Save Flow**

### 2. Create Eye Tracking Question

1. Add a new **Text/Graphic** question to your survey
2. Give it a name like "Eye Tracking Calibration"
3. Click the **HTML View** button (`<>`) in the question editor
4. Paste the code snippet below
5. Save the question

### 3. That's It!

The eye tracking calibration will run automatically when respondents reach this question, and data will be saved to the embedded data fields. All participants continue to the survey regardless of calibration quality.

---

## Code Snippet

Copy and paste this code into your Qualtrics question (HTML view):

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      // Save to Qualtrics embedded data
      if (typeof Qualtrics !== 'undefined') {
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
        Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));

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

## What Happens During Calibration

1. **Camera Initialization** - Participant grants webcam permission
2. **Calibration Instructions** - Clear instructions on what to do
3. **Calibration** - Participant clicks on 5 dots while looking at them (2 repetitions each)
4. **Validation** - System tests accuracy by showing 5 dots (no clicking, just looking)
5. **Optional Recalibration** - If accuracy is low (offset > 200px), participant can choose to recalibrate once
6. **Auto-Advance** - Survey continues to next question

**Important:** All participants continue to the survey regardless of calibration quality. No one is blocked or fails.

---

## Data Output

### Embedded Data Fields

Four fields are saved to your Qualtrics embedded data:

1. **`eyetracking_offset`** - Average offset in pixels (accuracy metric)
   - Lower = better accuracy
   - Typical range: 50-200 pixels
   - If > 200px, participant is offered optional recalibration
   - Use this for quality control in analysis

2. **`eyetracking_recalibrated`** - Whether participant chose to recalibrate
   - `true` = participant recalibrated
   - `false` = accepted initial calibration
   - Useful for understanding data quality improvements

3. **`eyetracking_attempts`** - Number of calibration attempts
   - `1` = accepted initial calibration
   - `2` = chose to recalibrate

4. **`eyetracking_validation`** - Full validation data (JSON string)
   - Contains raw gaze coordinates, validation points, percent in ROI, etc.
   - Parse this field for detailed analysis

### Validation Data Structure

The `eyetracking_validation` field contains a JSON string:

```json
{
  "raw_gaze": [[x, y], [x, y], ...],
  "validation_points": [[x, y], [x, y], ...],
  "average_offset": 156.7,
  "percent_in_roi": [95, 90, 85, 80, 75]
}
```

**Key metrics:**
- `average_offset` - Same as `eyetracking_offset` field
- `percent_in_roi` - Array of percentages (one per validation point) indicating how many gaze predictions fell within the region of interest
- `raw_gaze` - All raw gaze coordinates during validation

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

To use different calibration points or change the recalibration threshold, you'll need to fork the repository and modify `experiments/calibration.html`. See the main README for instructions.

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
- Field names must match exactly: `eyetracking_offset`, `eyetracking_recalibrated`, `eyetracking_attempts`, `eyetracking_validation`
- Check browser console for JavaScript errors

### Poor Calibration Accuracy

**Problem:** `eyetracking_offset` is very high (>300px) for most participants.

**Solution:**
- If offset > 200px, participants are automatically offered optional recalibration
- Ensure good lighting on participant's face
- Ask participant to sit still and maintain consistent head position
- Consider adding instructions before the eye tracking question
- Filter out low-quality responses in analysis using the `eyetracking_offset` field

---

## Technical Details

### Why Iframe Approach?

Qualtrics enforces a Content Security Policy (CSP) that blocks `eval()` in JavaScript. WebGazer's regression models require `eval()` to function. By hosting the experiment externally and embedding via iframe, the experiment runs in a different origin where CSP restrictions don't apply.

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

## Data Analysis Tips

After collecting data:

1. **Quality Control** - Filter responses by `eyetracking_offset`:
   - Good: < 150px
   - Acceptable: 150-250px
   - Poor: > 250px

2. **Check Recalibration** - Use `eyetracking_recalibrated` to see if participants who recalibrated had better accuracy

3. **Parse JSON** - The `eyetracking_validation` field is a JSON string - you'll need to parse it in your analysis software (R, Python, etc.)

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
