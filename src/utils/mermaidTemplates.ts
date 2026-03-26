export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  category: 'core' | 'advanced';
}

export const MERMAID_TEMPLATES: DiagramTemplate[] = [
  // Core Diagram Types
  {
    id: 'flowcharts',
    name: 'Flowchart',
    description: 'Basic structural flowcharts.',
    category: 'core',
    code: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    description: 'Shows how processes operate with one another and in what order.',
    category: 'core',
    code: `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!`
  },
  {
    id: 'class',
    name: 'Class Diagram',
    description: 'Structure of a system by showing its classes, attributes, operations.',
    category: 'core',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`
  },
  {
    id: 'state',
    name: 'State Diagram',
    description: 'Describe the behavior of a system.',
    category: 'core',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    id: 'er',
    name: 'Entity Relationship',
    description: 'Shows relationships of entity sets stored in a database.',
    category: 'core',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    description: 'A bar chart that illustrates a project schedule.',
    category: 'core',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    description: 'A circular statistical graphic.',
    category: 'core',
    code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  },
  {
    id: 'requirement',
    name: 'Requirement Diagram',
    description: 'Provides a mapping of requirements and their connections.',
    category: 'core',
    code: `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`
  },
  {
    id: 'gitgraph',
    name: 'Git Graph',
    description: 'Visual representations of git branching and commits.',
    category: 'core',
    code: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`
  },
  {
    id: 'c4',
    name: 'C4 Diagram',
    description: 'Architecture diagrams focused on Context, Containers, Components, and Code.',
    category: 'core',
    code: `C4Context
    title System Context diagram for Internet Banking System
    Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
    Person(customerB, "Banking Customer B")
    Person_Ext(customerC, "Banking Customer C", "desc")
    System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")
    
    Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")
    
    Rel(customerA, SystemAA, "Uses")
    Rel(SystemAA, customerD, "Sends e-mails to")`
  },

  // Advanced / Specialized
  {
    id: 'mindmap',
    name: 'Mindmap',
    description: 'A diagram used to visually organize information.',
    category: 'advanced',
    code: `mindmap
  root((mindmap))
    Out of box shaping
      node
      round-square
      circle
    Default shape
      [Square]
    Shapes
      (Rounded rectangle)`
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Shows events in chronological order.',
    category: 'advanced',
    code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter`
  },
  {
    id: 'userjourney',
    name: 'User Journey',
    description: 'Describes at a high level how a user steps through a system.',
    category: 'advanced',
    code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`
  },
  {
    id: 'quadrant',
    name: 'Quadrant Chart',
    description: 'A chart consisting of 4 quadrants, useful for categorizing data.',
    category: 'advanced',
    code: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`
  },
  {
    id: 'sankey',
    name: 'Sankey Diagram',
    description: 'Flow diagram where width of arrows indicates flow quantity.',
    category: 'advanced',
    code: `sankey-beta

%% source,target,value
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
`
  },
  {
    id: 'xychart',
    name: 'XY Chart',
    description: 'A chart with an X and Y axis, e.g., bar or line chart.',
    category: 'advanced',
    code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`
  },
  {
    id: 'block',
    name: 'Block Diagram',
    description: 'A diagram of a system in which the principal parts or functions are represented by blocks.',
    category: 'advanced',
    code: `block-beta
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
  style B fill:#969,stroke:#333,stroke-width:4px`
  }
];
