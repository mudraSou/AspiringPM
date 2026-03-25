// All 11 learning stages with sub-topics — sourced from content-research-output.md

export const STAGES_DATA = [
  {
    id: "stage_1",
    name: "PM Foundations",
    description: "What is Product Management? The role, the reality, and how PMs are evaluated.",
    skillCategories: ["cat_product_thinking", "cat_business"],
    orderIndex: 1,
    estimatedHoursMin: 4,
    estimatedHoursMax: 6,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Pick any product you use daily. Write a 1-page analysis covering:
(a) What problem does it solve, and who is the target user?
(b) What are its 3 strongest features and WHY are they strong?
(c) What would you improve and what user problem would that improvement solve?

Be specific — avoid generic statements like "improve the UX." Name the exact friction point and why it matters to users.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Problem framing", weight: 30, description: "Clearly defines what problem the product solves and for whom" },
        { name: "Product analysis depth", weight: 30, description: "Goes beyond surface features to explain why they work for users" },
        { name: "Improvement reasoning", weight: 25, description: "Improvement is tied to a specific user pain point, not just a personal preference" },
        { name: "Communication clarity", weight: 15, description: "Well-structured, concise, professional" },
      ],
      passingNote: "Must identify a specific user type and articulate at least one concrete improvement with reasoning.",
    },
    subTopics: [
      {
        id: "st_1_1",
        name: "What PMs Actually Do",
        description: "Day-in-the-life across role types; responsibilities vs. myths about the PM role.",
        orderIndex: 1,
        resources: [
          { title: "What exactly is a Product Manager?", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/what-is-a-product-manager" },
          { title: "A Day in the Life of a Product Manager", type: "video", source: "Exponent", duration: 20, url: "https://www.youtube.com/watch?v=Q5xfx5pxMaU" },
          { title: "Product Manager vs. Project Manager — the real difference", type: "article", source: "ProductPlan", duration: 10, url: "https://www.productplan.com/learn/product-manager-vs-project-manager/" },
        ],
        quickCheckPrompt: "In 3-5 sentences: What are the 3 core responsibilities of a PM that distinguish the role from a project manager or business analyst?",
        quickCheckType: "text",
      },
      {
        id: "st_1_2",
        name: "Types of PM Roles",
        description: "Consumer, Growth, Technical, Platform, AI, B2B — real differences with examples.",
        orderIndex: 2,
        resources: [
          { title: "The 6 Types of Product Managers", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/product-manager-archetypes" },
          { title: "What type of PM should you become?", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/what-type-of-pm" },
          { title: "PM Archetypes Explained", type: "video", source: "Exponent", duration: 25, url: "https://www.youtube.com/watch?v=r0KkHC-lLGE" },
        ],
        quickCheckPrompt: "Pick two PM role types (e.g. Growth PM vs Consumer PM). In 4-6 sentences, explain the key difference in what they optimize for and what skills matter most for each.",
        quickCheckType: "text",
      },
      {
        id: "st_1_3",
        name: "The Product Lifecycle",
        description: "Ideation → Discovery → Build → Launch → Iterate → Sunset. How PMs operate at each stage.",
        orderIndex: 3,
        resources: [
          { title: "The Product Development Lifecycle", type: "article", source: "ProductPlan", duration: 15, url: "https://www.productplan.com/learn/product-development-lifecycle/" },
          { title: "From Idea to Launch: How products actually get built", type: "video", source: "YouTube", duration: 20, url: "https://www.youtube.com/watch?v=cGnMRoQ0aqM" },
        ],
        quickCheckPrompt: "What is the PM's primary job during the Discovery phase vs. the Launch phase? Give one concrete example of a decision they'd make at each.",
        quickCheckType: "text",
      },
      {
        id: "st_1_4",
        name: "PM vs. Adjacent Roles",
        description: "PM vs. Project Manager, Business Analyst, UX Designer, Engineering Manager — clear distinctions.",
        orderIndex: 4,
        resources: [
          { title: "PM vs. TPM vs. EM — Who owns what?", type: "article", source: "Medium", duration: 10, url: "https://medium.com/@hellojasminewong/pm-vs-tpm-who-does-what-and-how-do-we-work-together-3ff53f0d8a05" },
          { title: "How PMs work with designers and engineers", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/product-manager-design/" },
        ],
        quickCheckPrompt: "A stakeholder asks you to manage the sprint board and update Jira tickets daily. Is this a PM's job? In 3-4 sentences, explain where the line is between PM and project management.",
        quickCheckType: "text",
      },
      {
        id: "st_1_5",
        name: "The PM Toolkit",
        description: "Key tools awareness: Jira, Figma, Amplitude, Notion, SQL basics, Miro.",
        orderIndex: 5,
        resources: [
          { title: "Tools every PM should know", type: "article", source: "Product School", duration: 10, url: "https://productschool.com/blog/product-management-2/product-management-tools/" },
          { title: "Figma for PMs — 15 min overview", type: "video", source: "YouTube", duration: 15, url: "https://www.youtube.com/watch?v=Lk7c12sABG8" },
          { title: "Amplitude product analytics walkthrough", type: "video", source: "Amplitude", duration: 20, url: "https://www.youtube.com/watch?v=5r2LcqoJNWs" },
        ],
        quickCheckPrompt: "Name 3 tools from different categories (analytics, collaboration, design) that a PM would use and briefly explain what each is used for.",
        quickCheckType: "text",
      },
      {
        id: "st_1_6",
        name: "How PMs Are Evaluated",
        description: "What hiring managers actually look for: impact, execution, leadership. How to demonstrate it.",
        orderIndex: 6,
        resources: [
          { title: "What makes a great PM?", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/what-makes-a-great-product-manager" },
          { title: "The PM Competency Model — Ravi Mehta", type: "article", source: "Ravi Mehta", duration: 20, url: "https://www.ravi-mehta.com/product-manager-skills/" },
        ],
        quickCheckPrompt: "Hiring managers often say they look for 'product sense.' In 4-5 sentences, explain what product sense actually means in practice — not as a definition, but as something you would demonstrate.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_2",
    name: "Product Thinking",
    description: "How to think like a PM — problem framing, user empathy, product sense, tradeoffs.",
    skillCategories: ["cat_product_thinking", "cat_user_research"],
    orderIndex: 2,
    estimatedHoursMin: 8,
    estimatedHoursMax: 10,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Choose a product in your current industry or domain. Identify a real user problem that product doesn't solve well.

Write a 1-2 page analysis covering:
(a) Problem statement: who is affected, what they currently do instead, and why this matters
(b) 3 potential solutions with genuine tradeoffs for each (not just pros/cons — what do you gain AND give up with each?)
(c) Your recommended solution with clear reasoning across impact, feasibility, and user value

Be specific. Avoid generic solutions ("add AI," "improve the UI"). The problem and solution must be clearly connected.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Problem clarity", weight: 25, description: "Specific, user-centered, grounded in real behavior" },
        { name: "User understanding", weight: 20, description: "Shows genuine empathy — considers context, motivation, workarounds" },
        { name: "Solution quality", weight: 20, description: "3 distinct solutions, meaningful tradeoffs, feasible" },
        { name: "Recommendation reasoning", weight: 20, description: "Multi-dimensional reasoning: impact + feasibility + user value" },
        { name: "Communication quality", weight: 15, description: "Well-structured, concise, professional" },
      ],
      passingNote: "Must avoid 'solutions before problems.' Each solution must clearly address the stated problem.",
    },
    subTopics: [
      {
        id: "st_2_1",
        name: "Problem Framing",
        description: "Defining the right problem before jumping to solutions. 5 Whys, problem vs. solution statements.",
        orderIndex: 1,
        resources: [
          { title: "The art of the problem statement", type: "article", source: "Gibson Biddle", duration: 15, url: "https://gibsonbiddle.medium.com/how-to-write-a-great-problem-statement-1c7c9c5c8d7a" },
          { title: "5 Whys technique in product", type: "article", source: "Intercom", duration: 10, url: "https://www.intercom.com/blog/the-5-whys/" },
          { title: "How to frame product problems", type: "video", source: "Exponent", duration: 20, url: "https://www.youtube.com/watch?v=cdBJdvIFB8I" },
        ],
        quickCheckPrompt: "Reframe this solution as a proper problem statement: 'We should add a dark mode to our app.' Who has this problem, when does it occur, and what's the actual impact?",
        quickCheckType: "text",
      },
      {
        id: "st_2_2",
        name: "User Empathy & Personas",
        description: "Understanding users beyond demographics. Jobs-to-be-done, empathy maps, behavioral segmentation.",
        orderIndex: 2,
        resources: [
          { title: "Jobs to Be Done: Theory to Practice", type: "article", source: "JTBD.info", duration: 20, url: "https://jtbd.info/2-what-is-jobs-to-be-done-jtbd-796b82081cca" },
          { title: "How to build user personas that actually work", type: "article", source: "Nielsen Norman Group", duration: 15, url: "https://www.nngroup.com/articles/persona/" },
          { title: "Empathy mapping workshop", type: "video", source: "MURAL", duration: 20, url: "https://www.youtube.com/watch?v=QwF9a56WFWA" },
        ],
        quickCheckPrompt: "Pick a product you use. Write a JTBD (Jobs to be Done) statement for one type of user — 'When I [situation], I want to [motivation], so I can [outcome].' Then explain what this tells you about what the product should prioritize.",
        quickCheckType: "text",
      },
      {
        id: "st_2_3",
        name: "Product Sense Development",
        description: "Analyzing products critically. Understanding what makes products work vs. fail.",
        orderIndex: 3,
        resources: [
          { title: "How to develop product sense", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/how-to-develop-product-sense" },
          { title: "Product teardown: how to analyze any product", type: "video", source: "Exponent", duration: 25, url: "https://www.youtube.com/watch?v=5xq5l5Y5M14" },
          { title: "Sharpen your product sense", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/how-to-hire-a-product-manager/" },
        ],
        quickCheckPrompt: "Name a product feature you think is poorly designed. In 4-5 sentences, explain specifically why — what user need does it fail to meet, and what would a better design do differently?",
        quickCheckType: "text",
      },
      {
        id: "st_2_4",
        name: "First Principles Thinking",
        description: "Breaking problems to fundamentals. Avoiding framework theater — applying thinking, not naming frameworks.",
        orderIndex: 4,
        resources: [
          { title: "First principles thinking for PMs", type: "article", source: "Reforge Blog", duration: 15, url: "https://www.reforge.com/blog/first-principles-thinking" },
          { title: "Why PM frameworks can be dangerous", type: "article", source: "Shreyas Doshi", duration: 10, url: "https://www.linkedin.com/posts/shreyasdoshi_a-dirty-secret-about-product-frameworks-activity-6812727900490809344-kyXv" },
        ],
        quickCheckPrompt: "A PM interview question: 'How would you improve Google Maps?' Instead of naming frameworks, walk through your actual thought process: What do you need to understand first? What assumptions do you make? How do you narrow the scope?",
        quickCheckType: "text",
      },
      {
        id: "st_2_5",
        name: "Tradeoff Thinking",
        description: "Speed vs. quality, user vs. business, build vs. buy, now vs. later. Making real decisions under constraint.",
        orderIndex: 5,
        resources: [
          { title: "How great PMs make tradeoff decisions", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/how-to-make-tradeoff-decisions/" },
          { title: "The LNO Framework — Shreyas Doshi", type: "article", source: "Shreyas Doshi", duration: 10, url: "https://www.linkedin.com/pulse/lno-efficiency-framework-shreyas-doshi/" },
        ],
        quickCheckPrompt: "Scenario: Your team can ship a feature that 80% of users want in 2 weeks, OR a feature that your top 5 enterprise customers are threatening to churn over in 6 weeks. Both can't happen this quarter. How do you decide? Walk through your reasoning.",
        quickCheckType: "text",
      },
      {
        id: "st_2_6",
        name: "Feature Ideation & Validation",
        description: "Generating ideas from user problems (not solutions-first). Validation methods before building.",
        orderIndex: 6,
        resources: [
          { title: "How to validate product ideas before building", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/how-to-validate-product-ideas/" },
          { title: "Pretotyping: validate before you build", type: "article", source: "Alberto Savoia", duration: 15, url: "https://pretotyping.blogspot.com/" },
          { title: "PM brainstorming techniques", type: "video", source: "Product School", duration: 20, url: "https://www.youtube.com/watch?v=W-8_0AvfD-s" },
        ],
        quickCheckPrompt: "You have an idea for a new feature. Name 3 ways you would validate it before asking engineering to build it — and what specifically you would learn from each method.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_3",
    name: "User Research & Understanding",
    description: "Knowing your user. Research methods, interviews, personas, competitive analysis.",
    skillCategories: ["cat_user_research"],
    orderIndex: 3,
    estimatedHoursMin: 8,
    estimatedHoursMax: 10,
    gatePassingScore: 60,
    skipIfScoreAbove: 65,
    optionalForRoles: [],
    gateAssignmentPrompt: `Conduct 2 mini user interviews (15-20 minutes each) with people who use a product in your domain.

Deliverable:
(a) Your interview guide (5-7 questions you used — show these)
(b) Key quotes or observations from each interview (2-3 per person)
(c) Synthesis: 2 user personas based on your interviews, 3 validated pain points, and 1 opportunity area with justification

If you cannot conduct real interviews, use secondary research (reviews, forums, support tickets) and clearly note this.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Interview guide quality", weight: 20, description: "Open-ended questions, no leading questions, covers motivations not just behavior" },
        { name: "Research synthesis", weight: 30, description: "Patterns identified from data, not assumed; quotes/observations cited" },
        { name: "Persona quality", weight: 20, description: "Behavioral, not demographic — tied to the research, not generic" },
        { name: "Opportunity identification", weight: 20, description: "Opportunity flows logically from pain points; specific and actionable" },
        { name: "Communication quality", weight: 10, description: "Structured, readable, professional" },
      ],
      passingNote: "Personas must be grounded in the research, not invented. Pain points must be validated, not assumed.",
    },
    subTopics: [
      {
        id: "st_3_1",
        name: "User Research Methods Overview",
        description: "Qualitative vs. quantitative. When to use interviews, surveys, analytics, usability tests.",
        orderIndex: 1,
        resources: [
          { title: "When to use which user research method", type: "article", source: "Nielsen Norman Group", duration: 20, url: "https://www.nngroup.com/articles/which-ux-research-methods/" },
          { title: "Qualitative vs. quantitative research for PMs", type: "article", source: "Reforge", duration: 15, url: "https://www.reforge.com/blog/qualitative-vs-quantitative-research" },
        ],
        quickCheckPrompt: "You want to understand why users are dropping off at the payment screen. Would you start with qualitative or quantitative research, and why? What specific method would you use first?",
        quickCheckType: "text",
      },
      {
        id: "st_3_2",
        name: "Conducting User Interviews",
        description: "Writing interview guides, active listening, avoiding leading questions, synthesizing findings.",
        orderIndex: 2,
        resources: [
          { title: "How to conduct user interviews", type: "article", source: "Nielsen Norman Group", duration: 20, url: "https://www.nngroup.com/articles/user-interviews/" },
          { title: "The Mom Test — how to ask users the right questions", type: "article", source: "The Mom Test", duration: 25, url: "https://www.momtestbook.com/" },
          { title: "User interview masterclass", type: "video", source: "UX Mastery", duration: 30, url: "https://www.youtube.com/watch?v=MT4Ig2uqjTc" },
        ],
        quickCheckPrompt: "What's wrong with this interview question: 'Would you use a feature that let you track your spending automatically?' Rewrite it as a better user interview question.",
        quickCheckType: "text",
      },
      {
        id: "st_3_3",
        name: "User Personas & Segmentation",
        description: "Building data-informed personas (not fictional). Behavioral segmentation that drives decisions.",
        orderIndex: 3,
        resources: [
          { title: "Personas are not user segments", type: "article", source: "UX Collective", duration: 15, url: "https://uxdesign.cc/personas-are-not-user-segments-heres-how-to-tell-the-difference-8f72f2e0be2" },
          { title: "How to build behavioral personas", type: "article", source: "Nielsen Norman Group", duration: 20, url: "https://www.nngroup.com/articles/persona-types/" },
        ],
        quickCheckPrompt: "What's the difference between a demographic persona ('35-year-old urban professional') and a behavioral persona? Write a behavioral persona in 3-4 sentences for a user of a food delivery app.",
        quickCheckType: "text",
      },
      {
        id: "st_3_4",
        name: "Jobs to Be Done (JTBD)",
        description: "Understanding user motivations beyond features. Functional, emotional, and social jobs.",
        orderIndex: 4,
        resources: [
          { title: "Know your customers' jobs to be done", type: "article", source: "Harvard Business Review", duration: 20, url: "https://hbr.org/2016/09/know-your-customers-jobs-to-be-done" },
          { title: "JTBD in practice for PMs", type: "video", source: "Intercom", duration: 25, url: "https://www.youtube.com/watch?v=2pOzSdSMnDo" },
        ],
        quickCheckPrompt: "Milkshake example: A fast food chain wants to improve milkshake sales. Most customers buy milkshakes in the morning. What's the JTBD? What product decisions does this insight lead to?",
        quickCheckType: "text",
      },
      {
        id: "st_3_5",
        name: "Usability Testing Basics",
        description: "Planning and running usability tests. Analyzing results and iterating based on findings.",
        orderIndex: 5,
        resources: [
          { title: "How to run a usability test", type: "article", source: "Nielsen Norman Group", duration: 20, url: "https://www.nngroup.com/articles/usability-testing-101/" },
          { title: "Guerrilla usability testing guide", type: "article", source: "UX Booth", duration: 15, url: "https://www.uxbooth.com/articles/the-art-of-guerrilla-usability-testing/" },
        ],
        quickCheckPrompt: "You have a prototype of a new checkout flow and 5 users to test with. Write a 3-step plan for the usability test: what task you'd give users, what you'd observe, and how you'd decide if the design passes.",
        quickCheckType: "text",
      },
      {
        id: "st_3_6",
        name: "Competitive & Market Analysis",
        description: "Analyzing competitors systematically. Identifying gaps and opportunities in the market.",
        orderIndex: 6,
        resources: [
          { title: "How to do competitive analysis as a PM", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/competitive-analysis-product-management/" },
          { title: "Market sizing for PMs", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/how-to-size-markets" },
        ],
        quickCheckPrompt: "Pick a product category (e.g. note-taking apps, food delivery, UPI payments). Name 3 competitors. Identify one gap that none of them address well — and explain why that gap exists.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_4",
    name: "Metrics & Analytical Thinking",
    description: "Making decisions with data — metrics definition, funnel analysis, experimentation, root cause.",
    skillCategories: ["cat_analytical"],
    orderIndex: 4,
    estimatedHoursMin: 10,
    estimatedHoursMax: 12,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Scenario: You are the PM for a product in your domain. Your daily active users dropped 12% this month.

Answer the following:
(a) Step-by-step investigation plan — how would you approach diagnosing this? What would you check first, second, third?
(b) 3 specific hypotheses with the exact data you'd look at to validate or disprove each
(c) A metrics dashboard for this product: define 5-7 metrics with reasoning for each (include at least one north star, two input metrics, and one guardrail metric)
(d) Design an A/B test for one solution you'd propose — include hypothesis, control, variant, primary metric, sample size logic, and duration`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Structured investigation", weight: 25, description: "Systematic approach: external → platform → segment → specific failure modes" },
        { name: "Hypothesis quality", weight: 25, description: "Each hypothesis is testable and linked to specific data to check" },
        { name: "Metrics dashboard", weight: 20, description: "Balanced: north star + input metrics + guardrail; metrics are actionable" },
        { name: "Experiment design", weight: 20, description: "Clear hypothesis, control/variant defined, primary metric, sample size logic" },
        { name: "Communication clarity", weight: 10, description: "Structured, easy to follow" },
      ],
      passingNote: "This is the most interview-relevant stage. Investigation must be systematic, not random hypotheses.",
    },
    subTopics: [
      {
        id: "st_4_1",
        name: "Metrics That Matter",
        description: "North star, input vs. output metrics, vanity vs. actionable metrics. How to choose the right ones.",
        orderIndex: 1,
        resources: [
          { title: "How to define your north star metric", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/north-star-metric" },
          { title: "Vanity metrics vs. actionable metrics", type: "article", source: "Eric Ries / Lean Startup", duration: 15, url: "https://tim.blog/2009/05/19/vanity-metrics-vs-actionable-metrics/" },
          { title: "Product metrics masterclass", type: "article", source: "Reforge", duration: 30, url: "https://www.reforge.com/blog/north-star-metric-and-input-metrics" },
        ],
        quickCheckPrompt: "What's the north star metric for a ride-sharing app? Write it and explain why you chose it over alternatives like 'number of rides' or 'revenue.'",
        quickCheckType: "text",
      },
      {
        id: "st_4_2",
        name: "Defining Product Metrics",
        description: "HEART framework, AARRR (pirate metrics), input vs. output metrics. Choosing metrics for features.",
        orderIndex: 2,
        resources: [
          { title: "Google's HEART Framework", type: "article", source: "Google Research", duration: 15, url: "https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-surveys-and-the-heart-framework/" },
          { title: "AARRR Pirate Metrics explained", type: "article", source: "ProductPlan", duration: 15, url: "https://www.productplan.com/glossary/aarrr-framework/" },
          { title: "How to choose metrics for your feature", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/metrics-product-managers/" },
        ],
        quickCheckPrompt: "You're launching a new onboarding flow. Using the HEART framework (Happiness, Engagement, Adoption, Retention, Task Success), name one metric for each category and explain what you'd learn from it.",
        quickCheckType: "text",
      },
      {
        id: "st_4_3",
        name: "Funnel Analysis",
        description: "Understanding conversion funnels, identifying drop-offs, segmenting by user type.",
        orderIndex: 3,
        resources: [
          { title: "Funnel analysis for PMs", type: "article", source: "Amplitude Blog", duration: 20, url: "https://amplitude.com/blog/funnel-analysis" },
          { title: "How to interpret funnel drop-off", type: "video", source: "Mixpanel", duration: 20, url: "https://www.youtube.com/watch?v=s2MjTEDL2yU" },
        ],
        quickCheckPrompt: "Your app's signup funnel: Landing page → Account creation → Email verification → Profile setup → First action. Step 3 (email verification) has a 45% drop-off. What are 3 hypotheses for why, and how would you investigate each?",
        quickCheckType: "text",
      },
      {
        id: "st_4_4",
        name: "Cohort & Retention Analysis",
        description: "Measuring retention over time, cohort behavior, engagement loops, churn patterns.",
        orderIndex: 4,
        resources: [
          { title: "Retention analysis for product teams", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/retention-engagement-addiction-product" },
          { title: "Cohort analysis explained", type: "article", source: "Amplitude Blog", duration: 15, url: "https://amplitude.com/blog/cohort-analysis" },
          { title: "The retention curve", type: "video", source: "Reforge / Brian Balfour", duration: 25, url: "https://www.youtube.com/watch?v=kRBHk0TZoiY" },
        ],
        quickCheckPrompt: "You have two products: Product A has 40% Day-30 retention. Product B has 70% Day-7 retention but 20% Day-30. Which product has stronger retention health and why? What would you investigate next for the weaker product?",
        quickCheckType: "text",
      },
      {
        id: "st_4_5",
        name: "SQL for PMs (Practical)",
        description: "Writing basic queries to pull data. Joins, aggregations, filtering — enough to be self-sufficient.",
        orderIndex: 5,
        resources: [
          { title: "SQL for Product Managers", type: "article", source: "Mode Analytics", duration: 30, url: "https://mode.com/sql-tutorial/introduction-to-sql/" },
          { title: "Basic SQL queries every PM needs", type: "article", source: "Towards Data Science", duration: 20, url: "https://towardsdatascience.com/sql-for-product-managers-29891f3f4c57" },
          { title: "SQLZoo interactive tutorial", type: "interactive", source: "sqlzoo.net", duration: 45, url: "https://sqlzoo.net/wiki/SQL_Tutorial" },
        ],
        quickCheckPrompt: "Write a SQL query (pseudocode is fine) to find the top 10 users by number of orders placed in the last 30 days, including their user_id, email, and order count. What table joins would you need?",
        quickCheckType: "text",
      },
      {
        id: "st_4_6",
        name: "A/B Testing & Experimentation",
        description: "Hypothesis formation, test design, sample size, statistical significance basics, interpreting results.",
        orderIndex: 6,
        resources: [
          { title: "A/B testing for product managers", type: "article", source: "Optimizely", duration: 20, url: "https://www.optimizely.com/optimization-glossary/ab-testing/" },
          { title: "How to design a good A/B test", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/how-to-run-ab-tests" },
          { title: "Statistical significance explained for PMs", type: "article", source: "CXL", duration: 15, url: "https://cxl.com/blog/statistical-significance-in-a-b-testing/" },
        ],
        quickCheckPrompt: "You want to test a new checkout button color. Write the full experiment design: hypothesis, control, variant, primary metric, how long you'd run it, and what result would make you ship it.",
        quickCheckType: "text",
      },
      {
        id: "st_4_7",
        name: "Root Cause Analysis",
        description: "Diagnosing metric drops systematically. Separating correlation from causation.",
        orderIndex: 7,
        resources: [
          { title: "How to diagnose a metric drop", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/how-to-investigate-a-metric-drop" },
          { title: "Root cause analysis frameworks for PMs", type: "video", source: "Exponent", duration: 25, url: "https://www.youtube.com/watch?v=oNvh0rwEUGA" },
        ],
        quickCheckPrompt: "Revenue dropped 8% last week. Walk through the first 5 questions you'd ask to narrow down the cause — in order of priority and explain why each one comes before the next.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_5",
    name: "Prioritization & Strategy",
    description: "What to build and why. Frameworks, beyond frameworks, product strategy, saying no.",
    skillCategories: ["cat_product_thinking", "cat_business"],
    orderIndex: 5,
    estimatedHoursMin: 8,
    estimatedHoursMax: 10,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `You are PM for a product in your domain. You have a backlog of 8 feature requests (below). Your engineering team can build 3 this quarter.

Backlog:
1. Dark mode
2. Push notifications for re-engagement
3. In-app chat support
4. Performance improvements (load time -40%)
5. Social sharing feature
6. Offline mode
7. Advanced search/filters
8. Loyalty/rewards program

Deliverable:
(a) State your prioritization criteria and how you weighted them
(b) Rank all 8 with a 1-2 sentence justification for each placement
(c) Write a 1-page product brief for your top 3 picks (combined, not separate briefs)
(d) How would you communicate the deprioritization of the remaining 5 to stakeholders who requested them?`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Prioritization criteria", weight: 25, description: "Clear criteria stated upfront; considers user impact, business impact, effort" },
        { name: "Ranking reasoning", weight: 25, description: "Each ranking is justified with reasoning, not just assertion" },
        { name: "Product brief quality", weight: 25, description: "Brief is clear, motivating, includes success criteria" },
        { name: "Deprioritization communication", weight: 25, description: "Empathetic, data-informed, preserves relationships while holding the line" },
      ],
      passingNote: "Must not prioritize based on 'what sounds good.' Criteria must be stated and applied consistently.",
    },
    subTopics: [
      {
        id: "st_5_1",
        name: "Prioritization Frameworks",
        description: "RICE, ICE, MoSCoW, Kano — when each is useful and when applying them is theater.",
        orderIndex: 1,
        resources: [
          { title: "RICE prioritization explained", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/" },
          { title: "Kano model for product managers", type: "article", source: "ProductPlan", duration: 15, url: "https://www.productplan.com/glossary/kano-model/" },
          { title: "Why frameworks can mislead you", type: "article", source: "Shreyas Doshi", duration: 10, url: "https://www.linkedin.com/posts/shreyasdoshi_product-management-activity-6889946040447238144-OGzH" },
        ],
        quickCheckPrompt: "A teammate suggests using RICE to prioritize your backlog. What are 2 situations where RICE would be useful, and 2 situations where it would give you a misleading answer?",
        quickCheckType: "text",
      },
      {
        id: "st_5_2",
        name: "Beyond Frameworks",
        description: "Judgment-based prioritization. Why real prioritization is about stakeholder alignment, not scoring.",
        orderIndex: 2,
        resources: [
          { title: "The real skill in prioritization", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/the-art-of-the-strategic-product-roadmap" },
          { title: "How senior PMs actually prioritize", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/how-to-prioritize" },
        ],
        quickCheckPrompt: "You've scored your backlog with RICE and the top item is 'dark mode.' But your CEO just told you the company's #1 priority is enterprise sales, and dark mode doesn't help that. What do you do? Walk through your reasoning.",
        quickCheckType: "text",
      },
      {
        id: "st_5_3",
        name: "Product Strategy Fundamentals",
        description: "Vision → Strategy → Roadmap → Goals. Connecting product decisions to business outcomes.",
        orderIndex: 3,
        resources: [
          { title: "What is product strategy?", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/product-strategy-overview" },
          { title: "Vision vs. strategy vs. roadmap", type: "article", source: "ProductPlan", duration: 15, url: "https://www.productplan.com/learn/product-vision-vs-product-strategy/" },
          { title: "Product strategy examples from great companies", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/good-product-strategy" },
        ],
        quickCheckPrompt: "Pick a company. Write a 3-sentence product strategy for them: what they're optimizing for, why, and what they'd say no to as a result.",
        quickCheckType: "text",
      },
      {
        id: "st_5_4",
        name: "Business Model Understanding",
        description: "Revenue models, unit economics basics, how products make money and how that shapes decisions.",
        orderIndex: 4,
        resources: [
          { title: "Business models for PMs", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/business-model-product-managers/" },
          { title: "Unit economics explained simply", type: "article", source: "a16z", duration: 15, url: "https://a16z.com/unit-economics/" },
          { title: "How monetization shapes product decisions", type: "article", source: "Reforge", duration: 15, url: "https://www.reforge.com/blog/monetization-models" },
        ],
        quickCheckPrompt: "How does a freemium business model (like Spotify or Notion) shape the PM's product decisions differently than a subscription-only model? Give 2 concrete examples.",
        quickCheckType: "text",
      },
      {
        id: "st_5_5",
        name: "Market Analysis & Competitive Positioning",
        description: "Competitive landscape analysis, market sizing basics, identifying white space.",
        orderIndex: 5,
        resources: [
          { title: "Competitive analysis for PMs", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/competitive-analysis-product-management/" },
          { title: "Market sizing frameworks", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/how-to-size-markets" },
        ],
        quickCheckPrompt: "What's the difference between TAM, SAM, and SOM? Use a concrete product example to explain all three in 4-5 sentences.",
        quickCheckType: "text",
      },
      {
        id: "st_5_6",
        name: "Saying No — Deprioritization",
        description: "How to kill features, say no to stakeholders, and manage scope without burning relationships.",
        orderIndex: 6,
        resources: [
          { title: "How to say no as a PM", type: "article", source: "Product Coalition", duration: 10, url: "https://productcoalition.com/how-to-say-no-as-a-product-manager-4f0882e85ce6" },
          { title: "Saying no while keeping stakeholders happy", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/how-to-say-no-to-feature-requests/" },
        ],
        quickCheckPrompt: "The head of sales wants you to build a feature specifically for one enterprise client. It's not on your roadmap and would take 3 engineer-weeks. Write a 3-4 sentence response you'd give them.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_6",
    name: "Technical Foundations for PMs",
    description: "Speaking engineering's language. System design, APIs, Agile, technical specs, AI/ML basics.",
    skillCategories: ["cat_technical"],
    orderIndex: 6,
    estimatedHoursMin: 8,
    estimatedHoursMax: 10,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Take a product you know well (or choose one from your domain).

Deliverable:
(a) System architecture in PM terms — not an engineering diagram, but: what are the main components, how do they communicate, where is data stored, how does it flow?
(b) Scalability thinking: what would break if this product got 10x more users overnight?
(c) Write a technical spec for one specific feature of this product, including: user stories, acceptance criteria, edge cases, and what engineering would need to know to build it

Engineers: focus on section (c) — write the most complete spec you can.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "System understanding", weight: 30, description: "Accurate, PM-appropriate description of how the product works technically" },
        { name: "Scalability thinking", weight: 20, description: "Identifies real bottlenecks (not generic 'servers crash')" },
        { name: "Technical spec quality", weight: 30, description: "Clear user stories, measurable acceptance criteria, edge cases considered" },
        { name: "Engineering respect", weight: 20, description: "Spec gives engineers clarity without over-constraining the implementation" },
      ],
      passingNote: "Technical spec must have concrete acceptance criteria — not 'the feature works' but 'user can complete checkout in < 3 taps.'",
    },
    subTopics: [
      {
        id: "st_6_1",
        name: "How Software Works",
        description: "Client-server, APIs, databases, frontend/backend — the technical basics every PM needs.",
        orderIndex: 1,
        resources: [
          { title: "How the internet works (for non-engineers)", type: "article", source: "Explain that Stuff", duration: 20, url: "https://www.explainthatstuff.com/internet.html" },
          { title: "Frontend vs. backend — what PMs need to know", type: "article", source: "Medium", duration: 15, url: "https://medium.com/swlh/frontend-vs-backend-web-development-for-non-technical-product-managers-7d04a64c3e0c" },
          { title: "Databases explained for PMs", type: "article", source: "Towards Data Science", duration: 15, url: "https://towardsdatascience.com/intro-to-databases-for-pms-9ea55e2d3938" },
        ],
        quickCheckPrompt: "Explain what happens technically when a user clicks 'Place Order' on an e-commerce app — from their tap to the confirmation screen. Include at least 4 steps and use the right terms (client, server, API, database).",
        quickCheckType: "text",
      },
      {
        id: "st_6_2",
        name: "System Design for PMs",
        description: "Understanding architecture diagrams, scalability, reliability, and performance at a PM level.",
        orderIndex: 2,
        resources: [
          { title: "System design concepts for PMs", type: "article", source: "Medium", duration: 25, url: "https://medium.com/@shmuelez/system-design-concepts-for-product-managers-ab35499cb7db" },
          { title: "How to talk about system design without being an engineer", type: "video", source: "Exponent", duration: 25, url: "https://www.youtube.com/watch?v=iJLL-KPqBpM" },
        ],
        quickCheckPrompt: "What does it mean for a system to be 'scalable'? Give a concrete product example where a scalability problem caused a real user experience issue.",
        quickCheckType: "text",
      },
      {
        id: "st_6_3",
        name: "APIs & Integrations",
        description: "What APIs are, REST vs. GraphQL basics, why PMs need to understand API design and third-party integrations.",
        orderIndex: 3,
        resources: [
          { title: "APIs explained for PMs", type: "article", source: "Postman Blog", duration: 15, url: "https://www.postman.com/what-is-an-api/" },
          { title: "What every PM should know about APIs", type: "article", source: "freeCodeCamp", duration: 15, url: "https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/" },
        ],
        quickCheckPrompt: "Your PM wants to 'just add a WhatsApp notification.' A developer says 'we need to integrate the WhatsApp Business API.' In 3-4 sentences, explain what that actually means and what questions you'd ask before putting it on the roadmap.",
        quickCheckType: "text",
      },
      {
        id: "st_6_4",
        name: "Agile & Scrum Deep Dive",
        description: "Beyond the buzzwords — sprints, standups, retros, estimation, velocity. Agile vs. Waterfall in practice.",
        orderIndex: 4,
        resources: [
          { title: "Agile for product managers", type: "article", source: "Atlassian", duration: 20, url: "https://www.atlassian.com/agile/product-management" },
          { title: "Scrum guide — official 2020 edition", type: "article", source: "Scrum.org", duration: 25, url: "https://scrumguides.org/scrum-guide.html" },
          { title: "What makes a good sprint review vs. a bad one", type: "article", source: "Intercom", duration: 10, url: "https://www.intercom.com/blog/sprint-review/" },
        ],
        quickCheckPrompt: "A new PM joins a team and the first thing they do is add 10 items to the current sprint because 'they're all urgent.' What's wrong with this? What should they do instead?",
        quickCheckType: "text",
      },
      {
        id: "st_6_5",
        name: "Technical Spec Writing",
        description: "Writing specs that engineers respect — requirements, edge cases, acceptance criteria.",
        orderIndex: 5,
        resources: [
          { title: "How to write a technical spec engineers will love", type: "article", source: "Product Coalition", duration: 20, url: "https://productcoalition.com/how-to-write-a-technical-spec-engineer-will-love-36e7c53f3a6a" },
          { title: "User stories vs. requirements — when to use what", type: "article", source: "Atlassian", duration: 15, url: "https://www.atlassian.com/agile/project-management/user-stories" },
        ],
        quickCheckPrompt: "Write a user story and 2 acceptance criteria for this feature: 'Users should be able to save items to a wishlist.' Include at least one edge case in your acceptance criteria.",
        quickCheckType: "text",
      },
      {
        id: "st_6_6",
        name: "AI/ML for PMs",
        description: "Model types, training data, capabilities and limitations of ML and LLMs. How to evaluate AI feature feasibility.",
        orderIndex: 6,
        resources: [
          { title: "AI/ML concepts every PM needs to know", type: "article", source: "Product School", duration: 25, url: "https://productschool.com/blog/artificial-intelligence/ai-product-manager/" },
          { title: "Building AI products — what PMs need to understand", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/ai-features-in-products" },
          { title: "LLMs explained for product people", type: "article", source: "a16z", duration: 20, url: "https://a16z.com/ai-reasoning-for-product-managers/" },
        ],
        quickCheckPrompt: "A stakeholder suggests 'using AI' to personalize your app's home screen. What are the 3 most important questions you'd ask before deciding whether this is worth building?",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_7",
    name: "Communication & PRD Writing",
    description: "Making others care. PRDs, user stories, presenting to leadership, stakeholder communication.",
    skillCategories: ["cat_communication", "cat_execution"],
    orderIndex: 7,
    estimatedHoursMin: 8,
    estimatedHoursMax: 10,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Write a full PRD for a new feature or improvement to a product in your domain.

Required sections:
(a) Problem statement — include data or evidence, not just assertion
(b) Target user and use cases (at least 2 use cases)
(c) Proposed solution with user stories (at least 3) and acceptance criteria for each
(d) Success metrics — how will you know this feature worked? (include primary metric + 2 supporting)
(e) Risks and mitigations (at least 2 risks)
(f) Launch plan — who needs to know what before this ships?

Then: Write a 5-bullet executive summary of this PRD as if presenting to leadership in 2 minutes.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Problem framing", weight: 15, description: "Data-backed, user-centered, not solution-first" },
        { name: "Solution design", weight: 20, description: "Feasible, well-scoped, edge cases considered" },
        { name: "User stories & acceptance criteria", weight: 20, description: "Buildable, complete, testable" },
        { name: "Metrics & success criteria", weight: 15, description: "Measurable, actionable, not vanity" },
        { name: "Risks & launch plan", weight: 15, description: "Realistic, cross-functional, thorough" },
        { name: "Communication quality", weight: 15, description: "Clear, concise, professional — engineer and executive can both use it" },
      ],
      passingNote: "This is the most portfolio-worthy artifact. Acceptance criteria must be testable, not subjective.",
    },
    subTopics: [
      {
        id: "st_7_1",
        name: "PRD / Product Brief Writing",
        description: "Structure, components, what to include and exclude. Writing PRDs that engineers and designers will actually use.",
        orderIndex: 1,
        resources: [
          { title: "How to write a great PRD", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/how-to-write-a-product-spec" },
          { title: "PRD template and examples", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/product-requirements-document-prd/" },
          { title: "What makes a PRD good vs. useless", type: "video", source: "Exponent", duration: 20, url: "https://www.youtube.com/watch?v=mcGxXFLKt4Y" },
        ],
        quickCheckPrompt: "What's the single most important thing a PRD must communicate to engineers? In 3-4 sentences, explain why and what happens when it's missing.",
        quickCheckType: "text",
      },
      {
        id: "st_7_2",
        name: "User Stories & Acceptance Criteria",
        description: "Writing user stories engineers can build from. Gherkin format, edge cases, definition of done.",
        orderIndex: 2,
        resources: [
          { title: "Writing user stories that work", type: "article", source: "Atlassian", duration: 15, url: "https://www.atlassian.com/agile/project-management/user-stories" },
          { title: "Acceptance criteria: the PM's secret weapon", type: "article", source: "Medium", duration: 15, url: "https://medium.com/swlh/acceptance-criteria-tips-for-product-teams-3ddc0fb2e2ed" },
        ],
        quickCheckPrompt: "Write a user story for a 'forgot password' flow, including: the story statement, 3 acceptance criteria, and 1 edge case that the engineering team must handle.",
        quickCheckType: "text",
      },
      {
        id: "st_7_3",
        name: "Presenting to Leadership",
        description: "Structuring a product pitch. Storytelling with data. Anticipating and handling questions.",
        orderIndex: 3,
        resources: [
          { title: "How to present to executives", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/how-to-present-to-executives/" },
          { title: "The pyramid principle for PMs", type: "article", source: "Barbara Minto", duration: 15, url: "https://medium.com/lessons-from-mckinsey/the-pyramid-principle-f0885dd3c5c7" },
          { title: "Product review presentations that work", type: "video", source: "YouTube", duration: 20, url: "https://www.youtube.com/watch?v=V_BXUGbDVyI" },
        ],
        quickCheckPrompt: "You need to present a proposal to your CEO in 2 minutes. The proposal: add a referral program. What's your structure? What's the first sentence you'd say?",
        quickCheckType: "text",
      },
      {
        id: "st_7_4",
        name: "Stakeholder Communication",
        description: "Managing up, cross-functional updates, conflict resolution, communicating decisions that people won't like.",
        orderIndex: 4,
        resources: [
          { title: "Stakeholder management for PMs", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/product-management-stakeholder-management/" },
          { title: "How to communicate bad news as a PM", type: "article", source: "Product Coalition", duration: 10, url: "https://productcoalition.com/how-to-communicate-bad-news-as-a-pm-8c3a90a92a7a" },
        ],
        quickCheckPrompt: "You're delaying a feature by 3 weeks due to a technical blocker. Write a 5-7 sentence Slack message to your stakeholders communicating this. Include: what changed, why, new timeline, and what you're doing about it.",
        quickCheckType: "text",
      },
      {
        id: "st_7_5",
        name: "Product Emails & Status Updates",
        description: "Status updates, launch communications, escalation emails. Writing clearly for different audiences.",
        orderIndex: 5,
        resources: [
          { title: "How to write great product update emails", type: "article", source: "Product Coalition", duration: 10, url: "https://productcoalition.com/the-weekly-product-update-7a7832b0de9c" },
          { title: "The weekly PM update that people actually read", type: "article", source: "Medium", duration: 10, url: "https://medium.com/swlh/the-pm-update-that-people-actually-read-e8cda37a2f8e" },
        ],
        quickCheckPrompt: "Write a launch announcement email (5-7 sentences) for a new in-app feature. The audience is your existing users. What do they need to know, and what's the one action you want them to take?",
        quickCheckType: "text",
      },
      {
        id: "st_7_6",
        name: "Running Effective Meetings",
        description: "Sprint reviews, brainstorms, decision-making meetings — PM as facilitator, not note-taker.",
        orderIndex: 6,
        resources: [
          { title: "The PM's guide to running meetings", type: "article", source: "Atlassian", duration: 15, url: "https://www.atlassian.com/blog/teamwork/how-to-run-efficient-meetings" },
          { title: "How to run a product brainstorm", type: "article", source: "Miro Blog", duration: 10, url: "https://miro.com/blog/how-to-facilitate-brainstorming/" },
        ],
        quickCheckPrompt: "A product brainstorm goes off-track — people are debating implementation details instead of generating ideas. What do you say and do to get it back on track? Be specific.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_8",
    name: "Execution & Delivery",
    description: "Shipping product. Roadmaps, sprint execution, launch planning, scope management, post-launch.",
    skillCategories: ["cat_execution"],
    orderIndex: 8,
    estimatedHoursMin: 6,
    estimatedHoursMax: 8,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Create a 3-month product roadmap for a product in your domain.

Include:
(a) 2-3 strategic themes for the quarter and the goals behind each theme
(b) Feature breakdown with sprint-level detail for Month 1 (which features, in which sprint, estimated effort)
(c) Dependencies and risks — what could block you?
(d) Success criteria for each major theme — how will you know the quarter was successful?
(e) How would you communicate this roadmap differently to: engineering team, company leadership, and sales/marketing?`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Strategic themes", weight: 25, description: "Themes connect to company goals, not just feature lists" },
        { name: "Month 1 detail", weight: 25, description: "Sprint-level breakdown is realistic; effort is estimated" },
        { name: "Dependencies & risks", weight: 20, description: "Real blockers identified; not generic 'engineering delays'" },
        { name: "Success criteria", weight: 15, description: "Measurable outcomes, not outputs" },
        { name: "Audience-specific communication", weight: 15, description: "Shows understanding of what each audience cares about" },
      ],
      passingNote: "Roadmap must have themes, not just a feature list. Success must be defined in outcomes, not outputs.",
    },
    subTopics: [
      {
        id: "st_8_1",
        name: "Roadmap Building",
        description: "Now/next/later, theme-based roadmaps, 3-month and 6-month planning.",
        orderIndex: 1,
        resources: [
          { title: "The ultimate roadmap guide", type: "article", source: "ProductPlan", duration: 20, url: "https://www.productplan.com/learn/product-roadmap/" },
          { title: "Now/next/later roadmap explained", type: "article", source: "Janna Bastow", duration: 15, url: "https://www.jannabastow.com/now-next-later-roadmap/" },
          { title: "How to present a roadmap", type: "video", source: "Product School", duration: 20, url: "https://www.youtube.com/watch?v=h1h4-5HoUss" },
        ],
        quickCheckPrompt: "What's the difference between an output roadmap ('Build feature X') and an outcome roadmap ('Increase D30 retention by 15%')? Why does the distinction matter in practice?",
        quickCheckType: "text",
      },
      {
        id: "st_8_2",
        name: "Sprint Planning & Execution",
        description: "Breaking features into sprints, estimation, managing dependencies, unblocking engineering.",
        orderIndex: 2,
        resources: [
          { title: "How PMs run sprint planning", type: "article", source: "Atlassian", duration: 15, url: "https://www.atlassian.com/agile/scrum/sprint-planning" },
          { title: "Story point estimation demystified", type: "article", source: "Agile Alliance", duration: 15, url: "https://www.agilealliance.org/glossary/story-points/" },
        ],
        quickCheckPrompt: "Engineering estimates a feature at 8 story points but you need it in this sprint. What are 3 options you'd consider, and what's the cost of each?",
        quickCheckType: "text",
      },
      {
        id: "st_8_3",
        name: "Launch Planning & Coordination",
        description: "Go-to-market for features, phased rollouts, beta testing, launch checklists, rollback plans.",
        orderIndex: 3,
        resources: [
          { title: "Product launch checklist for PMs", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/product-launch-checklist/" },
          { title: "How to do a phased feature rollout", type: "article", source: "LaunchDarkly Blog", duration: 15, url: "https://launchdarkly.com/blog/feature-flags-for-product-managers/" },
        ],
        quickCheckPrompt: "You're launching a major redesign of your app's home screen. What are the 5 most important things on your pre-launch checklist? For each, explain what could go wrong if you skipped it.",
        quickCheckType: "text",
      },
      {
        id: "st_8_4",
        name: "Managing Scope & Timeline",
        description: "Scope creep management, cut decisions under pressure, communicating delays professionally.",
        orderIndex: 4,
        resources: [
          { title: "How to manage scope creep", type: "article", source: "Intercom", duration: 10, url: "https://www.intercom.com/blog/managing-scope-creep/" },
          { title: "The PM's guide to saying 'that's out of scope'", type: "article", source: "Product Coalition", duration: 10, url: "https://productcoalition.com/how-to-handle-scope-creep-as-a-pm-7c7c1f0e2a3b" },
        ],
        quickCheckPrompt: "You're 2 weeks from launch and engineering says the feature you planned will take 2 more weeks. You can't move the launch. What are your options and how do you choose?",
        quickCheckType: "text",
      },
      {
        id: "st_8_5",
        name: "Post-Launch Iteration",
        description: "Measuring launch success, gathering feedback, prioritizing V2, closing the loop.",
        orderIndex: 5,
        resources: [
          { title: "What to measure after a product launch", type: "article", source: "Reforge", duration: 15, url: "https://www.reforge.com/blog/measuring-product-launch" },
          { title: "How to run a launch retrospective", type: "article", source: "Medium", duration: 10, url: "https://medium.com/swlh/how-to-run-a-product-launch-retrospective-5cd1adf50e2c" },
        ],
        quickCheckPrompt: "You launched a new feature 2 weeks ago. Usage is 40% lower than expected. What are your first 3 actions?",
        quickCheckType: "text",
      },
      {
        id: "st_8_6",
        name: "Debugging & Incident Response",
        description: "When things go wrong — triaging issues, communicating outages, running post-mortems.",
        orderIndex: 6,
        resources: [
          { title: "How PMs handle incidents", type: "article", source: "PagerDuty Blog", duration: 15, url: "https://www.pagerduty.com/resources/learn/what-is-a-major-incident/" },
          { title: "Writing a good post-mortem", type: "article", source: "Atlassian", duration: 15, url: "https://www.atlassian.com/incident-management/postmortem" },
        ],
        quickCheckPrompt: "Your app goes down at 9 PM on a Friday. You're the on-call PM. Walk through the first 30 minutes: what do you do, who do you contact, and what do you communicate externally?",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_9",
    name: "Behavioral & Soft Skills",
    description: "The PM as a person. STAR method, conflict resolution, leadership, managing up, ethics.",
    skillCategories: ["cat_leadership", "cat_communication"],
    orderIndex: 9,
    estimatedHoursMin: 6,
    estimatedHoursMax: 8,
    gatePassingScore: 60,
    skipIfScoreAbove: 70,
    optionalForRoles: [],
    gateAssignmentPrompt: `Write 5 behavioral stories from your career using Problem-Action-Result format (not STAR templates — be authentic).

Each story must map to a different skill:
(a) Leading a team through ambiguity — when the path wasn't clear and you had to make a call
(b) Using data to change a decision — yours or someone else's
(c) Handling a real conflict with a stakeholder or teammate
(d) A professional failure and what you concretely changed as a result
(e) Going above your role definition — doing something that wasn't your job but mattered

For each: keep it under 200 words. Be specific — names, numbers, and outcomes where possible.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Specificity", weight: 30, description: "Concrete details: situation, actions taken, measurable results" },
        { name: "PM skill demonstration", weight: 30, description: "Each story clearly shows the mapped PM skill in action" },
        { name: "Authentic voice", weight: 20, description: "Not templated — sounds like a real person reflecting on real experience" },
        { name: "Results orientation", weight: 20, description: "Outcomes are clear — what changed because of what they did?" },
      ],
      passingNote: "Stories without specific outcomes ('it went well') will not pass. Failure story must show concrete learning.",
    },
    subTopics: [
      {
        id: "st_9_1",
        name: "The STAR Method (Done Right)",
        description: "Structuring behavioral answers authentically — beyond template, into compelling storytelling.",
        orderIndex: 1,
        resources: [
          { title: "The STAR method — and why most people do it wrong", type: "article", source: "Exponent", duration: 15, url: "https://www.tryexponent.com/blog/star-method" },
          { title: "How to tell compelling career stories", type: "video", source: "YouTube", duration: 20, url: "https://www.youtube.com/watch?v=8QfSnuL8Ny8" },
        ],
        quickCheckPrompt: "Write a STAR answer (3-4 sentences) for: 'Tell me about a time you had to make a decision without all the information you wanted.' Use a real experience.",
        quickCheckType: "text",
      },
      {
        id: "st_9_2",
        name: "Conflict Resolution for PMs",
        description: "Disagreeing with engineering, pushing back on leadership, handling difficult stakeholders.",
        orderIndex: 2,
        resources: [
          { title: "How PMs handle conflict", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/the-right-way-to-handle-conflict-on-your-team" },
          { title: "Disagree and commit — when and how", type: "article", source: "Medium", duration: 10, url: "https://medium.com/@iantien/top-amazonian-disagreement-and-commitment-f2fd5f95f50" },
        ],
        quickCheckPrompt: "Engineering tells you a feature you've committed to stakeholders is technically impossible as designed. It would take 3x the effort. What do you do in the next 24 hours?",
        quickCheckType: "text",
      },
      {
        id: "st_9_3",
        name: "Cross-Functional Leadership",
        description: "Leading without authority. Building trust with engineering, design, data, marketing, ops.",
        orderIndex: 3,
        resources: [
          { title: "How to lead without authority", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/how-to-be-influential-without-formal-authority" },
          { title: "Building trust with engineering as a PM", type: "article", source: "Intercom", duration: 15, url: "https://www.intercom.com/blog/working-with-engineers/" },
        ],
        quickCheckPrompt: "Engineering doesn't respect your technical judgment. What are 3 concrete things you do over the next 30 days to change this — not one big move, but consistent small actions?",
        quickCheckType: "text",
      },
      {
        id: "st_9_4",
        name: "Managing Up",
        description: "Communicating with leadership, framing decisions for executives, managing their expectations.",
        orderIndex: 4,
        resources: [
          { title: "Managing up as a PM", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/managing-up-as-pm/" },
          { title: "How to frame product decisions for executives", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/make-the-most-of-your-one-on-one-with-your-manager-or-mentor-with-these-found-gems" },
        ],
        quickCheckPrompt: "Your CEO asks you why you haven't shipped a feature they mentioned 3 months ago. It's not on the roadmap because you deprioritized it. How do you respond in this moment?",
        quickCheckType: "text",
      },
      {
        id: "st_9_5",
        name: "Failure & Learning Stories",
        description: "How to talk about failures authentically. Demonstrating growth mindset and ownership.",
        orderIndex: 5,
        resources: [
          { title: "How to answer 'tell me about a failure'", type: "article", source: "Exponent", duration: 10, url: "https://www.tryexponent.com/blog/how-to-answer-tell-me-about-a-failure" },
          { title: "What interviewers are really looking for in failure questions", type: "article", source: "Lenny's Newsletter", duration: 10, url: "https://www.lennysnewsletter.com/p/behavioral-interviews" },
        ],
        quickCheckPrompt: "Describe a real professional mistake you made. In 4-5 sentences: what happened, what your role in it was, and what you specifically changed afterward. Avoid minimizing or over-explaining.",
        quickCheckType: "text",
      },
      {
        id: "st_9_6",
        name: "PM Ethics & Responsible Product Thinking",
        description: "Dark patterns, addiction by design, privacy, AI bias — how PMs make ethical product calls.",
        orderIndex: 6,
        resources: [
          { title: "Ethics in product management", type: "article", source: "Product Coalition", duration: 15, url: "https://productcoalition.com/ethics-in-product-management-5e3cd1d5c0a6" },
          { title: "The dark patterns hall of shame", type: "article", source: "deceptive.design", duration: 15, url: "https://www.deceptive.design/" },
          { title: "Responsible AI for product teams", type: "article", source: "Google AI Principles", duration: 15, url: "https://pair.withgoogle.com/guidebook/" },
        ],
        quickCheckPrompt: "Your growth team wants to add a default opt-in that auto-enrolls users in a paid plan after a free trial — shown only in step 7 of 8 of onboarding. Would you ship this? Walk through your reasoning.",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_10",
    name: "Application Readiness",
    description: "Getting hired. Resume, LinkedIn, application strategy, interview prep, salary negotiation.",
    skillCategories: ["cat_communication", "cat_product_thinking"],
    orderIndex: 10,
    estimatedHoursMin: 6,
    estimatedHoursMax: 8,
    gatePassingScore: 60,
    skipIfScoreAbove: 80,
    optionalForRoles: [],
    gateAssignmentPrompt: `Using your complete profile from previous stages, complete the following:

(a) Generate a tailored resume for a specific PM JD (use one of your stored target JDs, or paste one). Show which of your PSI entries you selected and why.
(b) Write your PM transition pitch — 150-200 words answering: "Why are you transitioning to PM and why are you a good fit?" This should feel like a person, not a template.
(c) Write 3 targeted questions you would ask at the end of a PM interview for your target role type.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Resume tailoring quality", weight: 30, description: "PSI entries selected logically for the JD; ATS keywords addressed" },
        { name: "Pitch authenticity", weight: 35, description: "Specific, personal, honest — not generic 'I love building products'" },
        { name: "Interview questions quality", weight: 20, description: "Questions show research and role understanding — not 'what does success look like?'" },
        { name: "Overall readiness signal", weight: 15, description: "Taken together, does this person seem ready to interview?" },
      ],
      passingNote: "Pitch must include a specific reason tied to their actual background, not a generic PM answer.",
    },
    subTopics: [
      {
        id: "st_10_1",
        name: "Resume Optimization",
        description: "PSI format, ATS optimization, tailoring per JD, what hiring managers actually scan for.",
        orderIndex: 1,
        resources: [
          { title: "PM resume guide — what actually works", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/pm-resume-guide" },
          { title: "ATS optimization for product roles", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/ats-resume/" },
          { title: "The PSI format for PM resumes", type: "article", source: "Exponent", duration: 15, url: "https://www.tryexponent.com/blog/psi-format-resume" },
        ],
        quickCheckPrompt: "What's wrong with this resume bullet: 'Led product development for new mobile feature.' Rewrite it using the Problem-Solution-Impact format.",
        quickCheckType: "text",
      },
      {
        id: "st_10_2",
        name: "LinkedIn & Online Presence",
        description: "PM-specific LinkedIn optimization, portfolio presence, personal brand basics.",
        orderIndex: 2,
        resources: [
          { title: "LinkedIn for aspiring PMs", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/linkedin-product-manager/" },
          { title: "Building a PM portfolio", type: "article", source: "Product Coalition", duration: 15, url: "https://productcoalition.com/building-a-pm-portfolio-without-pm-experience-7f9f0a7c3d4e" },
        ],
        quickCheckPrompt: "Write a LinkedIn headline and 3-sentence summary for someone transitioning from software engineering to PM. Make it specific to their background, not generic.",
        quickCheckType: "text",
      },
      {
        id: "st_10_3",
        name: "Application Strategy",
        description: "Where to apply, warm vs. cold applications, networking, referral strategy — what actually works.",
        orderIndex: 3,
        resources: [
          { title: "How to get a PM job without experience", type: "article", source: "Lenny's Newsletter", duration: 20, url: "https://www.lennysnewsletter.com/p/getting-into-product-management" },
          { title: "PM job search strategy", type: "article", source: "Product School", duration: 15, url: "https://productschool.com/blog/product-management-2/pm-job-search/" },
        ],
        quickCheckPrompt: "You want to apply to Swiggy as an APM. You have no mutual connections. Walk through your application strategy — what would you do before submitting the online application?",
        quickCheckType: "text",
      },
      {
        id: "st_10_4",
        name: "Interview Preparation Strategy",
        description: "Types of PM interviews, company-specific preparation, how to allocate your prep time.",
        orderIndex: 4,
        resources: [
          { title: "How to prepare for PM interviews", type: "article", source: "Exponent", duration: 20, url: "https://www.tryexponent.com/blog/pm-interview-prep" },
          { title: "The PM interview loop explained", type: "video", source: "Exponent", duration: 25, url: "https://www.youtube.com/watch?v=AK8ZdDUdVus" },
        ],
        quickCheckPrompt: "You have a PM interview at a growth-stage food delivery startup in 2 weeks. You have 2 hours per day to prepare. How do you allocate your time across the different interview types?",
        quickCheckType: "text",
      },
      {
        id: "st_10_5",
        name: "Salary Negotiation Basics",
        description: "Understanding PM compensation, negotiation tactics, India-specific salary context.",
        orderIndex: 5,
        resources: [
          { title: "PM salary negotiation guide", type: "article", source: "Levels.fyi", duration: 15, url: "https://www.levels.fyi/blog/salary-negotiation.html" },
          { title: "How to negotiate a PM offer", type: "article", source: "Lenny's Newsletter", duration: 15, url: "https://www.lennysnewsletter.com/p/negotiate-your-salary" },
        ],
        quickCheckPrompt: "A company offers you ₹18 LPA for an APM role. You were expecting ₹22 LPA. Write what you would say in your negotiation response — be specific, not just 'I'll negotiate.'",
        quickCheckType: "text",
      },
    ],
  },

  {
    id: "stage_11",
    name: "Role-Specific Deep Dive",
    description: "Domain depth for your target PM track. Growth, Technical, AI, or B2B specialization.",
    skillCategories: ["cat_product_thinking", "cat_analytical", "cat_technical", "cat_business"],
    orderIndex: 11,
    estimatedHoursMin: 8,
    estimatedHoursMax: 12,
    gatePassingScore: 60,
    skipIfScoreAbove: 80,
    optionalForRoles: ["consumer"],
    gateAssignmentPrompt: `Domain-specific case study for your target PM role.

Growth PM: Design a growth experiment for a product in your domain. Define the growth lever, experiment hypothesis, metrics, and expected impact. Include a 6-month growth roadmap with 3 bets.

Technical PM: Propose a platform or infrastructure improvement for a product you know. Define the problem (who is slowed down and why), the solution (in PM terms, not engineering terms), success metrics, and adoption plan.

AI PM: Design an AI feature for a product in your domain. Specify: what the model would need to do, what training data is required, how you'd measure model quality, what happens when the model is wrong, and how you'd handle bias.

B2B PM: Analyze a B2B product's enterprise features. Identify one gap that's causing churn or blocking sales. Propose a solution with: buyer persona, user persona, pricing consideration, and success metrics.`,
    gateAssignmentRubric: {
      criteria: [
        { name: "Domain depth", weight: 35, description: "Shows understanding of what makes this PM type different" },
        { name: "Problem specificity", weight: 25, description: "Problem is grounded in real domain knowledge, not generic" },
        { name: "Solution quality", weight: 25, description: "Solution is appropriate to the domain — would work in practice" },
        { name: "Communication quality", weight: 15, description: "Clear, professional, ready to use as a portfolio piece" },
      ],
      passingNote: "Generic answers that could apply to any PM type will not pass this stage.",
    },
    subTopics: [
      {
        id: "st_11_1",
        name: "Growth PM: Growth Loops & Retention Mechanics",
        description: "Viral loops, acquisition channels, activation optimization, retention curves. How growth PMs think differently.",
        orderIndex: 1,
        resources: [
          { title: "Growth loops vs. funnels", type: "article", source: "Reforge / Andrew Chen", duration: 25, url: "https://www.reforge.com/blog/growth-loops" },
          { title: "Retention is the core of growth", type: "article", source: "Brian Balfour / Reforge", duration: 20, url: "https://brianbalfour.com/essays/retention-is-king" },
          { title: "PLG (Product Led Growth) fundamentals", type: "article", source: "OpenView Partners", duration: 20, url: "https://openviewpartners.com/blog/what-is-product-led-growth/" },
        ],
        quickCheckPrompt: "What's the difference between a growth funnel and a growth loop? Give an example of a product that uses a loop, and explain why loops compound where funnels don't.",
        quickCheckType: "text",
      },
      {
        id: "st_11_2",
        name: "Technical PM: Platform & Infrastructure Thinking",
        description: "Developer experience, API product management, internal tools, technical debt tradeoffs.",
        orderIndex: 2,
        resources: [
          { title: "What is platform product management?", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/platform-product-management" },
          { title: "Developer experience as product", type: "article", source: "Stripe Blog", duration: 20, url: "https://stripe.com/blog/developer-experience" },
          { title: "Managing technical debt as a PM", type: "article", source: "Medium", duration: 15, url: "https://medium.com/swlh/technical-debt-for-product-managers-8b72f4b5b4d4" },
        ],
        quickCheckPrompt: "Your internal API is slowing down 5 teams who depend on it. You have capacity to either improve documentation or refactor 2 key endpoints. Which do you choose and why?",
        quickCheckType: "text",
      },
      {
        id: "st_11_3",
        name: "AI PM: ML Product Lifecycle",
        description: "From model to product — data strategy, evaluation, error handling, responsible AI, LLM products.",
        orderIndex: 3,
        resources: [
          { title: "Building AI products — the PM guide", type: "article", source: "Lenny's Newsletter", duration: 25, url: "https://www.lennysnewsletter.com/p/how-to-build-an-ai-product" },
          { title: "Responsible AI product design", type: "article", source: "Google PAIR", duration: 20, url: "https://pair.withgoogle.com/guidebook/" },
          { title: "LLM product pitfalls PMs need to know", type: "article", source: "a16z", duration: 20, url: "https://a16z.com/ai-apps-the-next-generation/" },
        ],
        quickCheckPrompt: "Your AI recommendation model is 85% accurate. Users are complaining about the 15% wrong recommendations. How do you decide whether to ship, delay, or change the product design?",
        quickCheckType: "text",
      },
      {
        id: "st_11_4",
        name: "B2B PM: Enterprise Sales Cycle & Multi-Persona Products",
        description: "How enterprise buying works, designing for buyer vs. user, pricing strategy, customer success alignment.",
        orderIndex: 4,
        resources: [
          { title: "B2B product management guide", type: "article", source: "Reforge", duration: 20, url: "https://www.reforge.com/blog/enterprise-product-management" },
          { title: "The enterprise buyer vs. user gap", type: "article", source: "First Round Review", duration: 15, url: "https://review.firstround.com/the-next-step-for-saas-is-enterprise/" },
          { title: "Pricing strategy for B2B products", type: "article", source: "OpenView Partners", duration: 20, url: "https://openviewpartners.com/blog/product-led-growth-pricing/" },
        ],
        quickCheckPrompt: "In a B2B product, the 'buyer' (IT admin) and the 'user' (employee) often want different things. Give a specific example of this tension and how you'd resolve it in a product decision.",
        quickCheckType: "text",
      },
    ],
  },
];
