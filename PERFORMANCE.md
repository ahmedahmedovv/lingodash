# Performance Testing Guide

This document describes the performance tests for LingoDash and how to run them.

## Overview

Performance tests ensure the application remains fast and responsive even with large datasets and frequent operations.

## Running Performance Tests

### Run all performance tests
```bash
npm run test:perf
```

### Run performance tests in watch mode
```bash
npm run test:perf:watch
```

### Run performance tests with detailed output
```bash
npm run test:perf -- --reporter=verbose
```

## Test Categories

### 1. Storage Performance (`storage.perf.test.js`)

Tests localStorage operations including:
- **Save 50 words**: Should complete in < 100ms
- **Retrieve words 1000 times**: Should average < 1ms per retrieval
- **Delete 25 words**: Should complete in < 50ms
- **Update duplicates 100 times**: Should complete in < 200ms
- **Rapid consecutive saves (20 words)**: Should complete in < 50ms
- **Large content (1000+ char definitions)**: Should complete in < 150ms
- **Enforce 50 word limit (100 saves)**: Should complete in < 200ms
- **Case-insensitive operations (50 times)**: Should complete in < 100ms
- **JSON serialization (100 reads)**: Should complete in < 100ms
- **Storage size**: Should be < 50KB for 50 words

### 2. UI Performance (`ui.perf.test.js`)

Tests DOM rendering and manipulation:
- **Render 50 words**: Should complete in < 100ms
- **50 rapid re-renders**: Should average < 5ms per render
- **Long content (500+ chars)**: Should render in < 150ms
- **Empty state (1000 renders)**: Should average < 0.5ms per render
- **Event listeners (50 buttons)**: Should attach in < 100ms
- **Special characters & unicode**: Should render in < 100ms
- **Date formatting (50 dates)**: Should format in < 100ms

### 3. Exercise Performance (`exercise.perf.test.js`)

Tests exercise functionality:
- **Word shuffling (1000 times)**: Should average < 0.5ms per shuffle
- **Regex replacements (100 cases)**: Should complete in < 50ms
- **Answer checking (10,000 comparisons)**: Should average < 0.01ms each
- **Percentage calculation (10,000 calcs)**: Should complete in < 50ms
- **Question transitions (20 questions)**: Should complete in < 50ms
- **Complex regex (1000 iterations)**: Should complete in < 200ms
- **DOM updates (30 questions)**: Should complete in < 100ms
- **Full exercise simulation**: Should complete in < 100ms

## Performance Benchmarks

### Critical Path Performance

| Operation | Target | Current |
|-----------|--------|---------|
| Save single word | < 5ms | ✅ |
| Load 50 words | < 1ms | ✅ |
| Render 50 words | < 100ms | ✅ |
| Start exercise | < 50ms | ✅ |
| Answer question | < 5ms | ✅ |

### Scalability Limits

| Metric | Limit | Reason |
|--------|-------|--------|
| Max saved words | 50 | LocalStorage optimization |
| Definition length | 1000 chars | Display performance |
| Example length | 500 chars | Display performance |
| Exercise questions | 50 max | User experience |

## Performance Optimization Tips

### LocalStorage
- Words are limited to 50 to prevent localStorage bloat
- JSON is used for efficient serialization
- Data structure is optimized for quick lookups

### DOM Rendering
- innerHTML is used for batch rendering (faster than individual appends)
- Event delegation could be used for better performance with many buttons
- Display only visible words if list grows (virtual scrolling)

### Memory Management
- Old words are automatically removed when limit is reached
- No memory leaks from event listeners (removed on re-render)
- Efficient data structures (arrays, not nested objects)

## Monitoring Performance

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Record while using the app
4. Look for:
   - Long tasks (> 50ms)
   - Layout thrashing
   - Memory leaks

### Lighthouse
```bash
# Run Lighthouse audit
npm run build
npm run preview
# Then run Lighthouse in Chrome DevTools
```

### Custom Performance Marks
Add performance marks in code:
```javascript
performance.mark('start-operation');
// ... operation ...
performance.mark('end-operation');
performance.measure('operation', 'start-operation', 'end-operation');
console.log(performance.getEntriesByName('operation'));
```

## Performance Regression Testing

### Automated Checks
Performance tests run in CI/CD to catch regressions:
- All tests must pass
- Performance thresholds must be met
- No significant slowdowns allowed

### Manual Testing
Before major releases:
1. Save 50 words
2. Navigate between tabs rapidly
3. Run complete exercise
4. Check browser memory usage
5. Test on slower devices/networks

## Troubleshooting Slow Performance

### LocalStorage Issues
```javascript
// Check localStorage size
const data = localStorage.getItem('lingodash_words');
console.log('Size:', new Blob([data]).size, 'bytes');

// Clear if corrupted
localStorage.removeItem('lingodash_words');
```

### DOM Rendering Issues
- Use browser DevTools to identify slow renders
- Check for unnecessary re-renders
- Verify event listeners are properly cleaned up

### API Call Issues
- Check network tab for slow API responses
- Implement request debouncing if needed
- Add loading states for better UX

## Future Optimizations

### Potential Improvements
1. **Virtual Scrolling**: Only render visible words
2. **Web Workers**: Move heavy computation off main thread
3. **IndexedDB**: For larger datasets (> 50 words)
4. **Memoization**: Cache expensive computations
5. **Code Splitting**: Lazy load exercise module
6. **Service Worker**: Cache API responses

### When to Optimize
- When users report slowness
- When tests start failing
- Before adding major features
- During performance audits

## Performance Budget

### Load Time
- Initial load: < 1s
- Time to interactive: < 2s
- First contentful paint: < 1s

### Runtime
- UI response: < 100ms
- Animation: 60 FPS
- Memory: < 50MB

### Bundle Size
- JavaScript: < 50KB (gzipped)
- CSS: < 10KB (gzipped)
- Total: < 60KB (gzipped)

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance](https://developer.chrome.com/docs/lighthouse/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
