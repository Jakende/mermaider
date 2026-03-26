# Requirement Diagram

A Requirement diagram provides a visualization for requirements and their connections, to each other and other documented elements.

## Syntax Example

\`\`\`mermaid
requirementDiagram

requirement test_req {
  id: 1
  text: the test text.
  risk: high
  verifymethod: test
}

element test_entity {
  type: simulation
}

test_entity - satisfies -> test_req
\`\`\`

## Properties
* **Requirements** can have properties like \`id\`, \`text\`, \`risk\` (low, medium, high), and \`verifymethod\` (analysis, demonstration, inspection, test).
* **Elements** are parts of the system that can satisfy requirements.
* **Relationships** mapped: \`contains\`, \`copies\`, \`derives\`, \`satisfies\`, \`verifies\`, \`refines\`, \`traces\`.
