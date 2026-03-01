# State Diagrams

State diagrams describe the different states a system can be in and how it transitions from one state to another.

## How to Start
- Use the keyword `stateDiagram-v2`.
- Use `[*]` to represent the starting point and ending point.
- Define transitions with `-->`.

## Simple Example
```mermaid
stateDiagram-v2
    [*] --> Off
    Off --> On : Press Switch
    On --> Active : Start Engine
    Active --> Off : Shutdown
```

## Syntax Guide

### 1. States & Labels
- `[*] --> StateName`: Initial state transition.
- `StateName --> [*]`: Final state transition.
- `State1 --> State2 : Description`: A labeled transition.

### 2. Composite States
Nesting states inside another:
```mermaid
state Machine {
    Idle --> Working
    Working --> Error
}
```

### 3. Decisions
Use `state choice_name <<choice>>` to create a diamond decision point.
```mermaid
stateDiagram-v2
    state is_valid <<choice>>
    [*] --> is_valid
    is_valid --> Success : if yes
    is_valid --> Failure : if no
```
