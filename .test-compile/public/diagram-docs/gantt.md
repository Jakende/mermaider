# Gantt Charts

Gantt charts are used for project management to schedule tasks over time.

## How to Start
- Use the keyword `gantt`.
- Define a `dateFormat`.
- Add `sections` to group tasks.
- Add tasks with a name, status/alias, and duration.

## Simple Example
```mermaid
gantt
    title Construction Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1
    Foundation   :active, a1, 2023-10-01, 10d
    Walls        :after a1, 20d
    section Phase 2
    Roof         :2023-10-31, 5d
```

## Syntax Guide

### 1. Task Definitions
`Task Name : [status], [alias], [start-date], [duration]`
- **Status**: `active`, `done`, `crit` (critical).
- **Alias**: Reference tasks later (e.g., `after a1`).
- **Duration**: `5d` (days), `2h` (hours), `1w` (weeks).

### 2. Configurations
- `dateFormat`: e.g., `YYYY-MM-DD`.
- `axisFormat`: Determines timeline appearance (e.g., `%m-%d`).
- `excludes`: Skip days like `weekends`.
