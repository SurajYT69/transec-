# Testing Guide

## Running Tests
Run the entire test suite using standard npm commands:
```bash
npm test
```

For watch mode during development:
```bash
npm run test:watch
```

## Test Categories
1. **Unit Tests**:
   - `detection.test.ts`: Language detection accuracy.
   - `normalizer.test.ts`: Hinglish rule transformations.
   - `tokenProtector.test.ts`: Extraction and restoration of Discord tokens.
   - `pipeline.test.ts`: Logic flow and stage execution.
2. **Integration Tests**:
   - Database operations (SQLite interactions).
   - Rate limiting functionality.
3. **Corpus Tests**:
   - Tests run against a predefined Hinglish corpus to ensure normalization and detection regressions don't occur.

## What is Tested
- Pure functions (normalization, detection algorithms).
- Caching eviction algorithms.
- Pipeline state transformations.
- Deduplication locks in the `ReactionTracker`.

## What is NOT Tested
- **External API Calls**: The Google Gemini and Azure APIs are mocked during unit tests. We do not test external network boundaries in the standard CI pipeline.
- **Discord WebSocket**: Discord.js client connectivity is mocked.

## Adding New Test Cases
When fixing a detection or normalization issue:
1. Add the offending string to the target test file.
2. Ensure the expected output is strictly defined.
3. Run the test suite to ensure the fix didn't regress other patterns.
