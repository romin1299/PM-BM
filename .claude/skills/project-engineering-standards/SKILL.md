---
name: project-engineering-standards
description: Apply the project's engineering standards to all development work. Use when implementing, modifying, refactoring, reviewing, or optimizing project code. Treat the Spare module as the primary reference architecture while critically improving it when necessary. Enforce reusable, scalable, optimized, low-latency, maintainable, DRY, component-based React and service-oriented backend patterns while preserving existing production behavior.
---

# Project Engineering Standards

## Project Context

This is a long-running production project that has been actively developed since 2022.

The codebase contains:

- Legacy implementations
- Intermediate implementations
- Modern implementations

The `Spare` module represents the latest and preferred implementation style.

Use `Spare` as the primary architectural reference for future development, but do not assume it is perfect.

---

## Core Engineering Principle

For every development task, aim for:

Correctness

- Reusability
- Maintainability
- Scalability
- Performance
- Low Latency
- Backward Compatibility
- Consistency

Do not optimize blindly or introduce unnecessary complexity.

---

## 1. Investigate Before Coding

Before modifying code:

1. Understand the requested requirement.
2. Locate the relevant existing functionality.
3. Trace the complete execution flow.
4. Search for similar implementations elsewhere.
5. Inspect the `Spare` module for equivalent patterns.
6. Search for reusable functions, services, controllers, utilities, and components.
7. Identify database and API dependencies.
8. Identify performance and scalability concerns.
9. Design the smallest safe implementation.
10. Only then modify code.

Never speculate about code that has not been inspected.

---

## 2. Spare Module as Reference Architecture

When implementing new functionality:

- Prefer patterns used by `Spare`.
- Follow its folder organization where applicable.
- Follow its API flow.
- Follow its service/controller separation.
- Follow its validation patterns.
- Follow its database access patterns.
- Follow its error handling.
- Follow its React component architecture.
- Follow its reusable utility patterns.

However:

Do NOT blindly copy Spare code.

Critically evaluate it.

If a better approach exists for:

- Performance
- Scalability
- Latency
- Database efficiency
- Memory usage
- Maintainability
- Reusability
- Security

then use the improved approach.

When significantly deviating from Spare, briefly explain why.

---

## 3. DRY — Don't Repeat Yourself

Never duplicate existing logic unnecessarily.

Before creating code:

- Search the repository for equivalent functionality.
- Reuse existing utilities.
- Reuse existing services.
- Reuse existing controllers.
- Reuse existing components.
- Reuse existing validation.
- Reuse existing database helpers.

If functionality is needed in multiple locations, create it once in the appropriate shared layer and reuse it.

Avoid:

- Duplicate business logic
- Duplicate API logic
- Duplicate validation
- Duplicate database queries
- Duplicate React UI
- Duplicate transformation logic

Prefer a single well-designed implementation.

---

## 4. Backend Architecture

Keep controllers thin.

Preferred flow:

Route
→ Controller
→ Service
→ Repository/Model/Database
→ Response

Controllers should primarily handle:

- Request extraction
- Authentication/authorization context
- Validation coordination
- Calling services
- Returning responses

Business logic should generally live in reusable services.

Do not place large business workflows inside controllers.

Create reusable services when the same business operation is required in multiple places.

---

## 5. React Architecture

Use component-based architecture.

Prefer:

Page
→ Feature Components
→ Reusable Components
→ Hooks/Utilities
→ API/Service Layer

Avoid large monolithic components.

Separate:

- UI
- Business logic
- API calls
- State management
- Reusable behavior

If UI or behavior appears in multiple places, create a reusable component/hook/utility rather than duplicating it.

Before creating a new component, search for an existing component that can be reused or extended.

---

## 6. Performance and Low Latency

For every implementation, consider:

### Backend

- Minimize database round trips.
- Avoid N+1 queries.
- Fetch only required fields.
- Use appropriate indexes.
- Avoid unnecessary aggregations.
- Avoid repeated calculations.
- Avoid unnecessary serialization/deserialization.
- Use parallel asynchronous operations when operations are independent.
- Avoid blocking operations.
- Reuse connections/resources correctly.
- Use caching only when it provides a real benefit.

### Database

Analyze:

- Query efficiency
- Index usage
- Query filters
- Sorting
- Pagination
- Aggregation pipelines
- Projection
- Large collection scans
- Repeated queries

Do not fetch entire documents when only a few fields are required.

Do not introduce caching without considering cache invalidation and consistency.

### Frontend

Consider:

- Unnecessary re-renders
- Duplicate API calls
- Large component trees
- Unnecessary state updates
- Lazy loading
- Code splitting
- Memoization where justified
- Efficient list rendering
- Avoiding expensive calculations during render

Do not use optimization techniques simply because they exist. Use them when they solve an actual performance problem.

---

## 7. Scalability

Design new functionality so it can handle growth in:

- Users
- Requests
- Database records
- Concurrent operations
- Modules
- Features

Avoid implementations that depend on the current data size.

Prefer:

- Pagination
- Efficient queries
- Proper indexing
- Stateless services where appropriate
- Reusable service layers
- Efficient asynchronous processing
- Modular architecture

Avoid unnecessary architectural complexity.

---

## 8. Backward Compatibility

This is an existing production system.

Preserve existing:

- Business rules
- API contracts
- Database behavior
- Permissions
- User workflows
- Existing integrations

Do not modify unrelated modules.

Do not perform broad refactoring unless explicitly requested.

If legacy code is not relevant to the requested change, leave it alone.

---

## 9. Avoid Overengineering

Use the simplest architecture that satisfies the requirement.

Do not:

- Create abstractions for one-time operations.
- Create unnecessary files.
- Create unnecessary services.
- Introduce new dependencies without justification.
- Rewrite working code without a reason.
- Refactor unrelated code.
- Add speculative features.

The goal is high-quality engineering, not maximum abstraction.

---

## 10. Reuse Before Create

Before creating anything new, search the repository.

Check for:

- Existing controller
- Existing service
- Existing utility
- Existing hook
- Existing component
- Existing API client
- Existing validation
- Existing database helper
- Existing constants
- Existing types/interfaces

Only create new functionality when an appropriate reusable implementation does not already exist.

---

## 11. Code Quality

Prefer code that is:

- Easy to understand
- Easy to test
- Easy to reuse
- Easy to maintain
- Efficient
- Consistent with the existing architecture

Use clear naming.

Keep functions focused.

Keep modules cohesive.

Avoid unnecessary comments.

Comments should explain WHY, not obvious WHAT.

---

## 12. Future Task Workflow

For every future coding request, follow:

### Phase 1 — Understand

Understand the requirement and identify affected functionality.

### Phase 2 — Investigate

Inspect existing implementation and trace dependencies.

### Phase 3 — Compare

Compare the relevant implementation with `Spare`.

### Phase 4 — Reuse

Search the repository for reusable functionality.

### Phase 5 — Design

Choose the smallest safe architecture that satisfies the requirement.

### Phase 6 — Optimize

Check performance, scalability, database efficiency, and latency.

### Phase 7 — Implement

Modify only the necessary files.

### Phase 8 — Verify

Check:

- Existing functionality
- New functionality
- Error handling
- API behavior
- Database behavior
- Performance implications
- Regression risks

---

## Important Rule

Do not make code changes merely because code can be improved.

For a requested feature:

Implement the feature correctly first,
reuse existing architecture,
follow Spare where appropriate,
improve Spare patterns when justified,
and avoid unrelated refactoring.

The final implementation should feel like it belongs naturally in this project.
