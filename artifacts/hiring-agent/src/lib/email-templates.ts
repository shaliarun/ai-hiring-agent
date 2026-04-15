export interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "shortlisted",
    label: "Shortlisted / Selected",
    subject: "Your Application for {{jobTitle}} - Shortlisted",
    body: `Dear {{candidateName}},

We are pleased to inform you that your application for the position of {{jobTitle}} has been shortlisted.

Your profile stood out among a competitive pool of candidates, and we would like to move forward with the next steps of our hiring process.

We will be in touch shortly to schedule the first round of interviews. In the meantime, please feel free to reach out if you have any questions.

Best regards,
{{companyName}} Hiring Team`,
  },
  {
    id: "rejection",
    label: "Rejection",
    subject: "Update on Your Application for {{jobTitle}}",
    body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely align with the requirements of this role.

We appreciate the effort you put into your application and encourage you to apply for future openings that match your skills and experience.

We wish you the very best in your career endeavors.

Best regards,
{{companyName}} Hiring Team`,
  },
  {
    id: "round1",
    label: "Round 1 Interview",
    subject: "Interview Invitation - Round 1 for {{jobTitle}}",
    body: `Dear {{candidateName}},

We are excited to invite you to the first round of interviews for the {{jobTitle}} position.

Interview Details:
- Date: [Please specify date]
- Time: [Please specify time]
- Mode: [In-person / Video Call / Phone]
- Location/Link: [Please specify]

Please confirm your availability by replying to this email. If the proposed time does not work for you, let us know and we will try to accommodate an alternative slot.

We look forward to speaking with you.

Best regards,
{{companyName}} Hiring Team`,
  },
  {
    id: "round2",
    label: "Round 2 Interview",
    subject: "Interview Invitation - Round 2 for {{jobTitle}}",
    body: `Dear {{candidateName}},

Congratulations on successfully completing the first round of interviews! We were impressed with your performance and would like to invite you to the second round.

Interview Details:
- Date: [Please specify date]
- Time: [Please specify time]
- Mode: [In-person / Video Call]
- Panel: [Interviewer names/titles]
- Topics: [Technical assessment / Case study / Panel discussion]

Please confirm your availability at your earliest convenience.

Best regards,
{{companyName}} Hiring Team`,
  },
  {
    id: "final",
    label: "Final Round Interview",
    subject: "Final Round Interview Invitation - {{jobTitle}}",
    body: `Dear {{candidateName}},

We are delighted to inform you that you have progressed to the final round of interviews for the {{jobTitle}} position.

This round will involve a meeting with senior leadership to discuss your fit within the team and the organization.

Final Interview Details:
- Date: [Please specify date]
- Time: [Please specify time]
- Mode: [In-person / Video Call]
- With: [Senior leadership / Department Head]

Please confirm your availability and let us know if you need any accommodations.

Best regards,
{{companyName}} Hiring Team`,
  },
  {
    id: "hired",
    label: "Offer / Hired",
    subject: "Job Offer - {{jobTitle}} at {{companyName}}",
    body: `Dear {{candidateName}},

We are thrilled to extend an offer for the position of {{jobTitle}} at {{companyName}}!

After a thorough evaluation process, we are confident that your skills, experience, and values make you an excellent addition to our team.

Offer Details:
- Position: {{jobTitle}}
- Department: {{department}}
- Start Date: [Please specify]
- Compensation: [Please specify]

Please review the attached offer letter and let us know your decision by [deadline]. We are happy to discuss any questions or concerns you may have.

Welcome aboard!

Best regards,
{{companyName}} Hiring Team`,
  },
];

export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}
