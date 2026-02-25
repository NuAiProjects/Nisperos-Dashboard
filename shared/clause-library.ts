import type { ClauseSection } from "./schema";

export const CLAUSE_LIBRARY_STANDARD = "ISO 9001:2015";

export const CLAUSE_LIBRARY_SECTIONS: ClauseSection[] = [
  {
    id: "4",
    title: "Context of the organization",
    subclauses: [
      { id: "4.1", title: "Understanding the organization and its context" },
      {
        id: "4.2",
        title: "Understanding the needs and expectations of interested parties",
      },
      {
        id: "4.3",
        title: "Determining the scope of the quality management system",
      },
      { id: "4.4", title: "Quality management system and its processes" },
    ],
  },
  {
    id: "5",
    title: "Leadership",
    subclauses: [
      { id: "5.1", title: "Leadership and commitment" },
      { id: "5.2", title: "Policy" },
      {
        id: "5.3",
        title: "Organizational roles, responsibilities and authorities",
      },
    ],
  },
  {
    id: "6",
    title: "Planning",
    subclauses: [
      { id: "6.1", title: "Actions to address risks and opportunities" },
      {
        id: "6.2",
        title: "Quality objectives and planning to achieve them",
      },
      { id: "6.3", title: "Planning of changes" },
    ],
  },
  {
    id: "7",
    title: "Support",
    subclauses: [
      { id: "7.1", title: "Resources" },
      { id: "7.2", title: "Competence" },
      { id: "7.3", title: "Awareness" },
      { id: "7.4", title: "Communication" },
      { id: "7.5", title: "Documented information" },
    ],
  },
  {
    id: "8",
    title: "Operation",
    subclauses: [
      { id: "8.1", title: "Operational planning and control" },
      { id: "8.2", title: "Requirements for products and services" },
      {
        id: "8.3",
        title: "Design and development of products and services",
      },
      {
        id: "8.4",
        title: "Control of externally provided processes, products and services",
      },
      { id: "8.5", title: "Production and service provision" },
      { id: "8.6", title: "Release of products and services" },
      { id: "8.7", title: "Control of nonconforming outputs" },
    ],
  },
  {
    id: "9",
    title: "Performance evaluation",
    subclauses: [
      { id: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
      { id: "9.2", title: "Internal audit" },
      { id: "9.3", title: "Management review" },
    ],
  },
  {
    id: "10",
    title: "Improvement",
    subclauses: [
      { id: "10.1", title: "General" },
      { id: "10.2", title: "Nonconformity and corrective action" },
      { id: "10.3", title: "Continual improvement" },
    ],
  },
];
