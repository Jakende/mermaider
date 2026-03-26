# Sankey Diagram

Sankey diagrams depict flow between nodes, where the width of the arrows is proportional to the flow value.

## Syntax Example

\`\`\`mermaid
sankey-beta
%% source,target,value
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
\`\`\`

## Format
* Defined using \`sankey-beta\`.
* Data rows consist of \`source,target,value\` separated by commas.
