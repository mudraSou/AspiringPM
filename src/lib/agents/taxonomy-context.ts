/**
 * Skill taxonomy context injected into every agent prompt.
 * IDs here MUST match the Skill.id values in the database exactly.
 * Run: SELECT id, name FROM "Skill" to verify.
 */

export const SKILL_TAXONOMY_CONTEXT = `
SKILL TAXONOMY (use these IDs exactly in skillTags):

Category: Product Thinking & Strategy
- skill_product_sense: Product Sense & Intuition
- skill_problem_framing: Problem Framing
- skill_prioritization: Prioritization
- skill_tradeoff: Tradeoff Analysis
- skill_zero_to_one: 0-to-1 Thinking

Category: Analytical & Data Skills
- skill_metrics: Metrics Definition
- skill_data_decisions: Data-Driven Decision Making
- skill_ab_testing: Experimentation Design
- skill_funnel: Funnel & Cohort Analysis
- skill_sql: SQL & Data Querying

Category: User Understanding & Research
- skill_user_interviews: User Research Methods
- skill_empathy: User Empathy & Advocacy
- skill_ux_collab: UX Design Collaboration
- skill_segmentation: Customer Segmentation
- skill_competitive: Competitive & Market Analysis

Category: Technical Acumen
- skill_system_design: System Design Basics
- skill_dev_process: Software Development Lifecycle
- skill_prd: Technical Communication
- skill_aiml: AI/ML Literacy
- skill_data_infra: Data Infrastructure Awareness

Category: Communication & Influence
- skill_stakeholder: Stakeholder Management
- skill_influence: Negotiation & Influence
- skill_writing: Written Communication
- skill_presentation: Verbal Communication & Presentation
- skill_data_storytelling: Storytelling with Data

Category: Execution & Delivery
- skill_roadmap: Roadmap Planning
- skill_sprint: Sprint & Release Management
- skill_spec_writing: Feature Specification
- skill_launch: Launch Planning
- skill_quality: Quality & Attention to Detail

Category: Business Acumen
- skill_strategy: Strategic Thinking
- skill_gtm: Go-to-Market Strategy
- skill_market_analysis: Market & Competitive Analysis
- skill_biz_model: Business Model Understanding

Category: Leadership & Collaboration
- skill_xfunc_leadership: Cross-Functional Leadership
- skill_collaboration: Team Collaboration
- skill_managing_up: Managing Up
- skill_mentoring: Mentoring & Knowledge Sharing
`;
