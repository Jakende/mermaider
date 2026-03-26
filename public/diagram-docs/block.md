# Block Diagram

Block diagrams provide a visual way to construct block-based layouts quickly. Great for architecture and grid-like component diagrams.

## Syntax Example

\`\`\`mermaid
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
\`\`\`

## Layout Basics
* Define the number of elements per row using \`columns X\`.
* Groups of elements can be created using the \`block:ID ... end\` syntax.
* Elements automatically wrap when the column limit is reached.
