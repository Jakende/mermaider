# XY Chart

The XY Chart allows you to build comprehensive column and line charts using cartesian coordinates.

## Syntax Example

\`\`\`mermaid
xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500]
    line [5000, 6000, 7500, 8200, 9500]
\`\`\`

## Structure
* Accepts an \`x-axis\` containing categories or a range.
* Define the \`y-axis\` with bounds representing the scale.
* Use \`bar\` or \`line\` followed by an array of values mapping to the x-axis points.
