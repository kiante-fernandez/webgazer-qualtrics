# WebEyeTrack for Qualtrics

Add eye tracking to your Qualtrics surveys with this ready-to-use integration. No hosting or setup required—just copy and paste code into your survey.

## What This Does

This integration adds browser-based eye tracking to Qualtrics surveys using **WebEyeTrack**. Participants complete a one-time calibration, then their gaze is tracked throughout your survey questions.

## Quick Start for Qualtrics Users

### 1. Add Header Code

In Qualtrics, go to **Look & Feel** → **General** → **Header** and paste:

```html
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
```

### 2. Set Up Your Questions

- **Question 1**: Add calibration code (see `qualtrics/README.md`)
- **Questions 2+**: Add tracking code (see `qualtrics/README.md`)

### 3. Collect Data

Eye tracking data saves automatically to embedded data fields in your survey responses.

**For complete setup instructions, see:** [`qualtrics/README.md`](qualtrics/README.md)

## For Developers

If you want to modify this integration or host your own version:

**Build from source:**
```bash
npm install
npm run build
npm run dev  # Test locally
```

**Files hosted on GitHub Pages:**
- `dist/gaze-adapter.bundle.umd.js` - Compiled adapter with all dependencies
- `experiments/calibration.html` - Calibration interface
- `dist/web/` - WebEyeTrack model files

## License

MIT License - See LICENSE file for details.
