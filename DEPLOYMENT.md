# WebEyeTrack Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Build Status
- [x] Bundle built successfully: `dist/gaze-adapter.bundle.umd.js` (1.1 MB, 296 KB gzipped)
- [x] Model files present: `dist/web/model.json` (44 KB) and `dist/web/group1-shard1of1.bin` (609 KB)
- [x] Total dist size: ~1.7 MB
- [x] All source files compiled without errors

### ✅ Path Configuration
- [x] Model loading uses relative path: `./dist/web/model.json`
- [x] Works in both development and production
- [x] MediaPipe WASM loads from CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm`
- [x] Face model loads from Google CDN: `https://storage.googleapis.com/mediapipe-models/...`

### ✅ Documentation Updated
- [x] README.md has correct GitHub Pages URL
- [x] qualtrics/continuous-tracking-guide.md has correct iframe URL
- [x] qualtrics/example-question-code.js references WebEyeTrack

### ✅ Core Functionality
- [x] Demo page tested and working (`demo/gaze-demo.html`)
- [x] Calibration flow tested
- [x] Gaze tracking produces predictions
- [x] Red dot visual feedback works

## Files to Deploy to GitHub Pages

### Required Files
```
dist/
  ├── gaze-adapter.bundle.umd.js    (1.1 MB) - Main bundle
  └── web/
      ├── model.json                 (44 KB)  - BlazeGaze model metadata
      └── group1-shard1of1.bin       (609 KB) - BlazeGaze model weights

experiments/
  └── calibration.html               - Iframe entry point

qualtrics/
  ├── continuous-tracking-guide.md   - Setup instructions
  ├── example-question-code.js       - Code templates
  └── README.md                      - Quick reference
```

### Optional (for reference)
```
README.md                            - Project overview
QA_REPORT.md                         - Quality assurance report
demo/
  └── gaze-demo.html                 - Standalone demo
```

## Deployment Steps

### 1. Commit Built Files
```bash
git add dist/ experiments/ qualtrics/ README.md
git commit -m "build: WebEyeTrack production bundle ready for deployment"
git push origin webeyetrack-qualtrics
```

### 2. Merge to Main (if ready)
```bash
git checkout main
git merge webeyetrack-qualtrics
git push origin main
```

### 3. Enable GitHub Pages
1. Go to repository Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` (or `webeyetrack-qualtrics` for testing)
4. Folder: `/ (root)`
5. Click Save
6. Wait 1-2 minutes for deployment

### 4. Verify Deployment
Test these URLs load correctly:
- [ ] `https://kiante-fernandez.github.io/webgazer-qualtrics/dist/gaze-adapter.bundle.umd.js`
- [ ] `https://kiante-fernandez.github.io/webgazer-qualtrics/dist/web/model.json`
- [ ] `https://kiante-fernandez.github.io/webgazer-qualtrics/dist/web/group1-shard1of1.bin`
- [ ] `https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html`

### 5. Test in Browser
Open calibration page directly:
```
https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html
```

Check browser console for (in order):
- [ ] `[WebEyeTrackProxy] Repo base: /webgazer-qualtrics`
- [ ] `[WebEyeTrackProxy] Model path: https://kiante-fernandez.github.io/webgazer-qualtrics/dist/web/model.json`
- [ ] `[WebEyeTrackProxy] Worker is ready`
- [ ] `✅ BlazeGaze model loaded successfully from: [path]`
- [ ] No CORS errors
- [ ] No 404 errors in Network tab
- [ ] Red dot appears and tracks gaze after calibration

## Qualtrics Integration

### Header Code
Copy from `qualtrics/continuous-tracking-guide.md` Step 2:
```html
<script>
(function() {
  if (document.getElementById('calibration-iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.id = 'calibration-iframe';
  iframe.src = 'https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html';
  iframe.allow = 'camera; microphone';
  // ... rest of iframe configuration
})();
</script>
```

### Question Templates
Use code from `qualtrics/example-question-code.js`:
- **Q1**: "Question 1: Calibration + Tracker Initialization"
- **Q2+**: "Questions 2+: Standard Tracking"
- **Q10, Q20, etc.**: "Recalibration Questions"

## Testing in Qualtrics

### Minimal Test Survey
1. Create new Qualtrics survey
2. Add header code (Look & Feel → General → Header)
3. Add 3 questions using templates (Q1 = calibration, Q2-Q3 = tracking)
4. Add Embedded Data fields: `eyetracking_model_key`, `gaze_Q2`, `gaze_Q3`
5. Preview survey
6. Complete calibration on Q1
7. Verify tracking on Q2 and Q3
8. Check Data & Analysis → View Responses → Download Data

### Expected Results
- [ ] Camera permission requested on Q1
- [ ] Calibration dots appear and can be clicked
- [ ] Console shows: "Calibration complete, hiding iframe"
- [ ] Console shows: "Tracking ACTIVE for Q2"
- [ ] `gaze_Q2` and `gaze_Q3` columns contain compressed JSON data
- [ ] Each gaze field is 3-5 KB

## Known Issues & Limitations

### Browser Compatibility
- ✅ **Chrome/Edge**: Fully supported
- ✅ **Firefox**: Fully supported
- ⚠️ **Safari**: Supported (requires HTTPS for camera)
- ❌ **IE11**: Not supported (requires modern JavaScript)

### Performance
- Initial load: ~2-3 seconds (model downloads)
- Tracking latency: 50-100ms per sample
- Memory usage: ~200-300 MB (stable)
- CPU usage: Medium (offloaded to Web Worker)

### Qualtrics Limitations
- Maximum embedded data size: ~32 KB per field
- Solution: Each question stores ~3-5 KB, well within limits
- For 50+ questions: Consider external data storage

### Known Edge Cases
- **Camera blocked**: Survey still works, but no gaze data collected
- **Mobile devices**: Works but accuracy may be lower
- **Multiple tabs**: Only one tab can access camera at a time
- **Browser refresh**: Calibration lost, must recalibrate

## Troubleshooting

### "BlazeGaze model failed to load"
- **Error**: `Failed to parse URL from ./dist/web/model.json`
  - **Cause**: Old version cached - relative paths don't work in Web Workers
  - **Fix**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to get latest bundle
  - **Verify**: Console should show `[WebEyeTrackProxy] Model path: https://...` (absolute URL)

- **Error**: `Request to https://.../experiments/dist/web/model.json failed with status code 404`
  - **Cause**: Model is at repo root, not in experiments folder
  - **Expected Path**: `https://kiante-fernandez.github.io/webgazer-qualtrics/dist/web/model.json`
  - **Wrong Path**: `https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/dist/web/model.json`
  - **Fix**: Hard refresh to get latest bundle (v12983ad or newer)
  - **Verify**: Console shows `[WebEyeTrackProxy] Repo base: /webgazer-qualtrics` (not `/webgazer-qualtrics/experiments`)

- **General checks**:
  - Visit `https://kiante-fernandez.github.io/webgazer-qualtrics/dist/web/model.json` directly in browser
  - Should download or display JSON (not 404)
  - Check Network tab for CORS errors
  - Verify console shows repo base correctly extracted

### "Worker not ready"
- Check: Web Workers enabled in browser
- Check: No CSP blocking workers
- Check: Console for worker errors

### "No camera permission"
- Check: Survey served over HTTPS
- Check: `allow="camera"` in iframe
- Check: User granted permission

### "No gaze data collected"
- Check: Console shows "Tracking ACTIVE for Q#"
- Check: Console shows "Received gaze-data" messages
- Check: isTracking flag is true
- Check: Camera is not blocked

## Rollback Plan

If issues arise in production:

### Option 1: Switch Back to WebGazer
```bash
git checkout main  # or previous stable tag
git push origin main --force
```

### Option 2: Disable Eye Tracking
Remove header code from Qualtrics Look & Feel

### Option 3: Debug with Console
Add `?debug=true` to survey URL and check console logs

## Success Criteria

- [x] Bundle builds without errors
- [x] Demo page works in Chrome, Firefox, Safari
- [ ] Calibration.html loads in iframe without errors
- [ ] Model loads successfully (no 404s)
- [ ] Web Worker initializes
- [ ] Gaze data collected on all questions
- [ ] Data exports to CSV correctly
- [ ] No memory leaks over 50 questions
- [ ] Performance acceptable (<2s initial load)

## Contact

For issues or questions:
- GitHub Issues: https://github.com/kiante-fernandez/webgazer-qualtrics/issues
- Documentation: See `qualtrics/continuous-tracking-guide.md`
