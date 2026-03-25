import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { STAGES_DATA } from "./seed-stages";
import { QUESTIONS_DATA } from "./seed-questions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── SKILL CATEGORIES ────────────────────────────────────────────────────

  const categoryData = [
    { id: "cat_product_thinking", name: "Product Thinking & Strategy", description: "Ability to identify the right problems, make prioritization decisions, and set product direction.", orderIndex: 1 },
    { id: "cat_analytical", name: "Analytical & Data Skills", description: "Defining metrics, using data to drive decisions, and designing experiments.", orderIndex: 2 },
    { id: "cat_user_research", name: "User Understanding & Research", description: "Conducting user research, developing empathy, and mapping user journeys.", orderIndex: 3 },
    { id: "cat_technical", name: "Technical Acumen", description: "Understanding how software systems work and evaluating technical feasibility.", orderIndex: 4 },
    { id: "cat_communication", name: "Communication & Influence", description: "Writing clear requirements, managing stakeholders, and influencing without authority.", orderIndex: 5 },
    { id: "cat_execution", name: "Execution & Delivery", description: "Planning roadmaps, running sprints, coordinating launches, and managing risks.", orderIndex: 6 },
    { id: "cat_business", name: "Business Acumen", description: "Understanding business models, revenue drivers, and go-to-market strategy.", orderIndex: 7 },
    { id: "cat_leadership", name: "Leadership & Collaboration", description: "Leading teams without authority, resolving conflicts, and making decisions under uncertainty.", orderIndex: 8 },
  ];

  for (const cat of categoryData) {
    await prisma.skillCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, orderIndex: cat.orderIndex },
      create: cat,
    });
  }
  console.log(`✓ ${categoryData.length} skill categories`);

  // ─── SKILLS (38 total, validated against JD research) ────────────────────

  const skillsData = [
    // Product Thinking (5)
    { id: "skill_problem_framing", categoryId: "cat_product_thinking", name: "Problem Framing", description: "Defining the right problem before jumping to solutions; structuring ambiguous situations.", evidenceTypes: ["psi_entry", "assignment", "side_project"], orderIndex: 1 },
    { id: "skill_product_sense", categoryId: "cat_product_thinking", name: "Product Sense & Intuition", description: "Instinct for what makes a product good; understanding user delight, friction, and value.", evidenceTypes: ["question_bank", "assignment"], orderIndex: 2 },
    { id: "skill_prioritization", categoryId: "cat_product_thinking", name: "Prioritization", description: "Deciding what to build and what to cut using structured thinking, not just frameworks.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 3 },
    { id: "skill_tradeoff", categoryId: "cat_product_thinking", name: "Tradeoff Analysis", description: "Navigating competing constraints — speed vs. quality, user vs. business, short-term vs. long-term.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 4 },
    { id: "skill_zero_to_one", categoryId: "cat_product_thinking", name: "0-to-1 Thinking", description: "Creating something new vs. optimizing existing; identifying opportunities from scratch.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 5 },
    // Analytical (5)
    { id: "skill_metrics", categoryId: "cat_analytical", name: "Metrics Definition", description: "Choosing the right metrics (north star, leading/lagging, guardrail) for a product or feature.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 1 },
    { id: "skill_data_decisions", categoryId: "cat_analytical", name: "Data-Driven Decision Making", description: "Using data to inform product decisions, not just report results.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 2 },
    { id: "skill_sql", categoryId: "cat_analytical", name: "SQL & Data Querying", description: "Ability to pull and analyze data independently without depending on analysts.", evidenceTypes: ["certification", "self_report", "assignment"], orderIndex: 3 },
    { id: "skill_ab_testing", categoryId: "cat_analytical", name: "Experimentation Design", description: "Designing A/B tests, defining hypotheses, measuring results, avoiding common pitfalls.", evidenceTypes: ["psi_entry", "assignment", "certification"], orderIndex: 4 },
    { id: "skill_funnel", categoryId: "cat_analytical", name: "Funnel & Cohort Analysis", description: "Understanding user flows, identifying drop-offs, segmenting users meaningfully.", evidenceTypes: ["assignment", "question_bank"], orderIndex: 5 },
    // User Research (5)
    { id: "skill_user_interviews", categoryId: "cat_user_research", name: "User Research Methods", description: "Conducting interviews, surveys, usability tests; knowing when to use which method.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 1 },
    { id: "skill_empathy", categoryId: "cat_user_research", name: "User Empathy & Advocacy", description: "Representing user needs in product decisions; fighting for the user under business pressure.", evidenceTypes: ["psi_entry", "conversation", "question_bank"], orderIndex: 2 },
    { id: "skill_ux_collab", categoryId: "cat_user_research", name: "UX Design Collaboration", description: "Working effectively with designers; understanding design patterns and accessibility.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 3 },
    { id: "skill_segmentation", categoryId: "cat_user_research", name: "Customer Segmentation", description: "Identifying distinct user groups and designing for multiple personas.", evidenceTypes: ["assignment"], orderIndex: 4 },
    { id: "skill_competitive", categoryId: "cat_user_research", name: "Competitive & Market Analysis", description: "Analyzing competitive landscape, identifying market opportunities and gaps.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 5 },
    // Technical (5)
    { id: "skill_system_design", categoryId: "cat_technical", name: "System Design Basics", description: "Understanding how products work technically — APIs, databases, client-server, microservices.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 1 },
    { id: "skill_dev_process", categoryId: "cat_technical", name: "Software Development Lifecycle", description: "Understanding agile/scrum beyond buzzwords; sprints, ceremonies, deployment, QA.", evidenceTypes: ["psi_entry", "self_report"], orderIndex: 2 },
    { id: "skill_prd", categoryId: "cat_technical", name: "Technical Communication", description: "Translating between business and engineering; writing technical specs engineers respect.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 3 },
    { id: "skill_aiml", categoryId: "cat_technical", name: "AI/ML Literacy", description: "Understanding model types, training data, capabilities and limitations of ML and LLMs.", evidenceTypes: ["assignment", "certification"], orderIndex: 4 },
    { id: "skill_data_infra", categoryId: "cat_technical", name: "Data Infrastructure Awareness", description: "Understanding data pipelines, warehousing, event tracking at a conceptual level.", evidenceTypes: ["psi_entry", "self_report"], orderIndex: 5 },
    // Communication (5)
    { id: "skill_writing", categoryId: "cat_communication", name: "Written Communication", description: "PRDs, product briefs, emails, documentation — clear, concise, structured.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 1 },
    { id: "skill_presentation", categoryId: "cat_communication", name: "Verbal Communication & Presentation", description: "Pitching ideas, presenting to leadership, running meetings effectively.", evidenceTypes: ["assignment"], orderIndex: 2 },
    { id: "skill_stakeholder", categoryId: "cat_communication", name: "Stakeholder Management", description: "Managing expectations, getting buy-in, navigating conflicting priorities.", evidenceTypes: ["psi_entry", "conversation"], orderIndex: 3 },
    { id: "skill_data_storytelling", categoryId: "cat_communication", name: "Storytelling with Data", description: "Presenting insights and recommendations using data in a compelling narrative.", evidenceTypes: ["assignment"], orderIndex: 4 },
    { id: "skill_influence", categoryId: "cat_communication", name: "Negotiation & Influence", description: "Influencing without authority; aligning engineering, design, and business teams.", evidenceTypes: ["psi_entry", "conversation"], orderIndex: 5 },
    // Execution (5)
    { id: "skill_spec_writing", categoryId: "cat_execution", name: "Feature Specification", description: "Writing clear requirements that engineering can build from — user stories, acceptance criteria.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 1 },
    { id: "skill_roadmap", categoryId: "cat_execution", name: "Roadmap Planning", description: "Building and communicating a product roadmap; balancing discovery vs. delivery.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 2 },
    { id: "skill_sprint", categoryId: "cat_execution", name: "Sprint & Release Management", description: "Managing the build-test-ship cycle; unblocking teams, managing scope.", evidenceTypes: ["psi_entry"], orderIndex: 3 },
    { id: "skill_quality", categoryId: "cat_execution", name: "Quality & Attention to Detail", description: "QA mindset, edge case thinking, product polish.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 4 },
    { id: "skill_launch", categoryId: "cat_execution", name: "Launch Planning", description: "Coordinating cross-functional launches — marketing, support, rollback plans.", evidenceTypes: ["psi_entry", "assignment"], orderIndex: 5 },
    // Business (4)
    { id: "skill_biz_model", categoryId: "cat_business", name: "Business Model Understanding", description: "Understanding how the product makes money; revenue models, unit economics.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 1 },
    { id: "skill_market_analysis", categoryId: "cat_business", name: "Market & Competitive Analysis", description: "Analyzing competitive landscape, identifying market opportunities and threats.", evidenceTypes: ["assignment"], orderIndex: 2 },
    { id: "skill_gtm", categoryId: "cat_business", name: "Go-to-Market Strategy", description: "Planning how a product reaches users — pricing, positioning, channel strategy.", evidenceTypes: ["assignment", "psi_entry"], orderIndex: 3 },
    { id: "skill_strategy", categoryId: "cat_business", name: "Strategic Thinking", description: "Connecting product decisions to company-level strategy; thinking beyond the next sprint.", evidenceTypes: ["assignment", "conversation"], orderIndex: 4 },
    // Leadership (4)
    { id: "skill_xfunc_leadership", categoryId: "cat_leadership", name: "Cross-Functional Leadership", description: "Leading without authority across engineering, design, data, marketing, operations.", evidenceTypes: ["psi_entry", "conversation"], orderIndex: 1 },
    { id: "skill_collaboration", categoryId: "cat_leadership", name: "Team Collaboration", description: "Working effectively within a team; supporting teammates, contributing to culture.", evidenceTypes: ["psi_entry", "conversation"], orderIndex: 2 },
    { id: "skill_managing_up", categoryId: "cat_leadership", name: "Managing Up", description: "Communicating effectively with leadership; framing decisions, managing expectations.", evidenceTypes: ["psi_entry", "conversation"], orderIndex: 3 },
    { id: "skill_mentoring", categoryId: "cat_leadership", name: "Mentoring & Knowledge Sharing", description: "Helping others grow; documenting and sharing learnings.", evidenceTypes: ["psi_entry"], orderIndex: 4 },
  ];

  for (const skill of skillsData) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: { name: skill.name, description: skill.description, evidenceTypes: skill.evidenceTypes, orderIndex: skill.orderIndex },
      create: skill,
    });
  }
  console.log(`✓ ${skillsData.length} skills`);

  // ─── ROLE WEIGHTS (research-calibrated from JD analysis) ─────────────────

  // Weights sourced from content-research-output.md Task 7
  const roleWeights: Array<{ pmRoleType: string; skillCategoryId: string; weight: number }> = [
    // consumer: Product Thinking 25%, Analytical 12%, User 20%, Technical 5%, Comm 15%, Exec 10%, Business 5%, Leadership 8%
    { pmRoleType: "consumer", skillCategoryId: "cat_product_thinking", weight: 0.25 },
    { pmRoleType: "consumer", skillCategoryId: "cat_analytical",       weight: 0.12 },
    { pmRoleType: "consumer", skillCategoryId: "cat_user_research",    weight: 0.20 },
    { pmRoleType: "consumer", skillCategoryId: "cat_technical",        weight: 0.05 },
    { pmRoleType: "consumer", skillCategoryId: "cat_communication",    weight: 0.15 },
    { pmRoleType: "consumer", skillCategoryId: "cat_execution",        weight: 0.10 },
    { pmRoleType: "consumer", skillCategoryId: "cat_business",         weight: 0.05 },
    { pmRoleType: "consumer", skillCategoryId: "cat_leadership",       weight: 0.08 },
    // growth: Product Thinking 18%, Analytical 28%, User 12%, Technical 8%, Comm 10%, Exec 12%, Business 8%, Leadership 4%
    { pmRoleType: "growth",   skillCategoryId: "cat_product_thinking", weight: 0.18 },
    { pmRoleType: "growth",   skillCategoryId: "cat_analytical",       weight: 0.28 },
    { pmRoleType: "growth",   skillCategoryId: "cat_user_research",    weight: 0.12 },
    { pmRoleType: "growth",   skillCategoryId: "cat_technical",        weight: 0.08 },
    { pmRoleType: "growth",   skillCategoryId: "cat_communication",    weight: 0.10 },
    { pmRoleType: "growth",   skillCategoryId: "cat_execution",        weight: 0.12 },
    { pmRoleType: "growth",   skillCategoryId: "cat_business",         weight: 0.08 },
    { pmRoleType: "growth",   skillCategoryId: "cat_leadership",       weight: 0.04 },
    // technical: Product 12%, Analytical 10%, User 8%, Technical 25%, Comm 15%, Exec 18%, Business 5%, Leadership 7%
    { pmRoleType: "technical", skillCategoryId: "cat_product_thinking", weight: 0.12 },
    { pmRoleType: "technical", skillCategoryId: "cat_analytical",       weight: 0.10 },
    { pmRoleType: "technical", skillCategoryId: "cat_user_research",    weight: 0.08 },
    { pmRoleType: "technical", skillCategoryId: "cat_technical",        weight: 0.25 },
    { pmRoleType: "technical", skillCategoryId: "cat_communication",    weight: 0.15 },
    { pmRoleType: "technical", skillCategoryId: "cat_execution",        weight: 0.18 },
    { pmRoleType: "technical", skillCategoryId: "cat_business",         weight: 0.05 },
    { pmRoleType: "technical", skillCategoryId: "cat_leadership",       weight: 0.07 },
    // platform: Product 15%, Analytical 10%, User 12%, Technical 22%, Comm 12%, Exec 18%, Business 5%, Leadership 6%
    { pmRoleType: "platform",  skillCategoryId: "cat_product_thinking", weight: 0.15 },
    { pmRoleType: "platform",  skillCategoryId: "cat_analytical",       weight: 0.10 },
    { pmRoleType: "platform",  skillCategoryId: "cat_user_research",    weight: 0.12 },
    { pmRoleType: "platform",  skillCategoryId: "cat_technical",        weight: 0.22 },
    { pmRoleType: "platform",  skillCategoryId: "cat_communication",    weight: 0.12 },
    { pmRoleType: "platform",  skillCategoryId: "cat_execution",        weight: 0.18 },
    { pmRoleType: "platform",  skillCategoryId: "cat_business",         weight: 0.05 },
    { pmRoleType: "platform",  skillCategoryId: "cat_leadership",       weight: 0.06 },
    // ai: Product 18%, Analytical 20%, User 12%, Technical 22%, Comm 10%, Exec 10%, Business 5%, Leadership 3%
    { pmRoleType: "ai",        skillCategoryId: "cat_product_thinking", weight: 0.18 },
    { pmRoleType: "ai",        skillCategoryId: "cat_analytical",       weight: 0.20 },
    { pmRoleType: "ai",        skillCategoryId: "cat_user_research",    weight: 0.12 },
    { pmRoleType: "ai",        skillCategoryId: "cat_technical",        weight: 0.22 },
    { pmRoleType: "ai",        skillCategoryId: "cat_communication",    weight: 0.10 },
    { pmRoleType: "ai",        skillCategoryId: "cat_execution",        weight: 0.10 },
    { pmRoleType: "ai",        skillCategoryId: "cat_business",         weight: 0.05 },
    { pmRoleType: "ai",        skillCategoryId: "cat_leadership",       weight: 0.03 },
    // general: Product 20%, Analytical 15%, User 15%, Technical 10%, Comm 15%, Exec 12%, Business 5%, Leadership 8%
    { pmRoleType: "general",   skillCategoryId: "cat_product_thinking", weight: 0.20 },
    { pmRoleType: "general",   skillCategoryId: "cat_analytical",       weight: 0.15 },
    { pmRoleType: "general",   skillCategoryId: "cat_user_research",    weight: 0.15 },
    { pmRoleType: "general",   skillCategoryId: "cat_technical",        weight: 0.10 },
    { pmRoleType: "general",   skillCategoryId: "cat_communication",    weight: 0.15 },
    { pmRoleType: "general",   skillCategoryId: "cat_execution",        weight: 0.12 },
    { pmRoleType: "general",   skillCategoryId: "cat_business",         weight: 0.05 },
    { pmRoleType: "general",   skillCategoryId: "cat_leadership",       weight: 0.08 },
    // b2b: Product 18%, Analytical 12%, User 18%, Technical 8%, Comm 18%, Exec 12%, Business 10%, Leadership 4%
    { pmRoleType: "b2b",       skillCategoryId: "cat_product_thinking", weight: 0.18 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_analytical",       weight: 0.12 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_user_research",    weight: 0.18 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_technical",        weight: 0.08 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_communication",    weight: 0.18 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_execution",        weight: 0.12 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_business",         weight: 0.10 },
    { pmRoleType: "b2b",       skillCategoryId: "cat_leadership",       weight: 0.04 },
  ];

  for (const rw of roleWeights) {
    await prisma.roleSkillWeight.upsert({
      where: { pmRoleType_skillCategoryId: { pmRoleType: rw.pmRoleType, skillCategoryId: rw.skillCategoryId } },
      update: { weight: rw.weight },
      create: rw,
    });
  }
  console.log(`✓ ${roleWeights.length} role skill weights`);

  // ─── LEARNING STAGES + SUB-TOPICS ─────────────────────────────────────────

  for (const stage of STAGES_DATA) {
    const { subTopics, ...stageFields } = stage;

    await prisma.learningStage.upsert({
      where: { id: stageFields.id },
      update: {
        name: stageFields.name,
        description: stageFields.description,
        skillCategories: stageFields.skillCategories,
        orderIndex: stageFields.orderIndex,
        estimatedHoursMin: stageFields.estimatedHoursMin,
        estimatedHoursMax: stageFields.estimatedHoursMax,
        gateAssignmentPrompt: stageFields.gateAssignmentPrompt,
        gateAssignmentRubric: stageFields.gateAssignmentRubric,
        gatePassingScore: stageFields.gatePassingScore,
        skipIfScoreAbove: stageFields.skipIfScoreAbove,
        optionalForRoles: stageFields.optionalForRoles,
      },
      create: {
        id: stageFields.id,
        name: stageFields.name,
        description: stageFields.description,
        skillCategories: stageFields.skillCategories,
        orderIndex: stageFields.orderIndex,
        estimatedHoursMin: stageFields.estimatedHoursMin,
        estimatedHoursMax: stageFields.estimatedHoursMax,
        gateAssignmentPrompt: stageFields.gateAssignmentPrompt,
        gateAssignmentRubric: stageFields.gateAssignmentRubric,
        gatePassingScore: stageFields.gatePassingScore,
        skipIfScoreAbove: stageFields.skipIfScoreAbove,
        optionalForRoles: stageFields.optionalForRoles,
      },
    });

    for (const st of subTopics) {
      await prisma.learningSubTopic.upsert({
        where: { id: st.id },
        update: {
          name: st.name,
          description: st.description,
          orderIndex: st.orderIndex,
          resources: st.resources,
          quickCheckPrompt: st.quickCheckPrompt,
          quickCheckType: st.quickCheckType,
        },
        create: {
          id: st.id,
          stageId: stageFields.id,
          name: st.name,
          description: st.description,
          orderIndex: st.orderIndex,
          resources: st.resources,
          quickCheckPrompt: st.quickCheckPrompt,
          quickCheckType: st.quickCheckType,
        },
      });
    }
  }
  console.log(`✓ ${STAGES_DATA.length} learning stages with sub-topics`);

  // ─── QUESTIONS ────────────────────────────────────────────────────────────

  const categoryQuestionMap: Record<string, string> = {
    product_sense: "stage_2",
    analytical: "stage_4",
    strategy: "stage_5",
    behavioral: "stage_9",
    technical: "stage_6",
    estimation: "stage_4",
    execution: "stage_8",
  };

  for (const q of QUESTIONS_DATA) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        category: q.category,
        difficulty: q.difficulty,
        questionText: q.questionText,
        evaluationCriteria: q.evaluationCriteria,
        minExpectations: q.minExpectations,
        sampleAnswerPoints: q.sampleAnswerPoints,
        relatedStageId: categoryQuestionMap[q.category] ?? null,
      },
      create: {
        id: q.id,
        category: q.category,
        difficulty: q.difficulty,
        questionText: q.questionText,
        evaluationCriteria: q.evaluationCriteria,
        minExpectations: q.minExpectations,
        sampleAnswerPoints: q.sampleAnswerPoints,
        relatedStageId: categoryQuestionMap[q.category] ?? null,
      },
    });
  }
  console.log(`✓ ${QUESTIONS_DATA.length} questions`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
