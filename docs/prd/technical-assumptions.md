# Technical Assumptions

### Repository Structure: Monorepo
A single repository to house the entire extension codebase, aligning with the project's self-contained nature and limited resources.

### Service Architecture
Serverless architecture leveraging Chrome extension APIs for DOM manipulation and storage, with no backend services required.

### Testing Requirements: Unit + Integration
Focus on unit tests for core logic (entities, use cases) and integration tests for repository interactions and DOM operations to ensure 99% reliability without over-testing for a simple extension.

### Additional Technical Assumptions and Requests
- Use Chrome storage sync for preset data persistence, ensuring cross-device availability.
- Implement DOM selectors and virtual scrolling handlers to interact with Google Calendar's dynamic sidebar reliably.
- Ensure full Manifest V3 compliance for Chrome Web Store distribution.
- No external APIs or databases beyond Chrome's built-in storage.
- Prioritize performance for unlimited calendars via on-demand state setting during scrolling.
