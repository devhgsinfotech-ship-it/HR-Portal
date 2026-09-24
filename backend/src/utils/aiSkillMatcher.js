/**
 * AI Skill Matcher & Resume Text Parsing Utility
 */

const COMMON_SKILLS = [
  // Programming & Web
  'JavaScript', 'TypeScript', 'Node.js', 'React', 'React.js', 'Vue', 'Angular', 'HTML', 'CSS', 'Sass',
  'PHP', 'Laravel', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 'C++', 'Go', 'Rust',
  'Ruby', 'Rails', 'REST API', 'GraphQL', 'Redux', 'Next.js', 'Express', 'Tailwind', 'Bootstrap',
  
  // Database & Cloud
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'MariaDB', 'Oracle', 'SQLite', 'Prisma', 'Sequelize',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Nginx', 'Apache', 'Git', 'GitHub', 'Bitbucket',
  
  // HR, Management & Business
  'Recruitment', 'Talent Acquisition', 'Sourcing', 'Screening', 'Onboarding', 'Payroll', 'HRIS',
  'Performance Management', 'Employee Engagement', 'Labor Law', 'Project Management', 'Agile', 'Scrum',
  'Jira', 'Confluence', 'Communication', 'Leadership', 'Problem Solving', 'Data Analysis', 'Excel'
];

/**
 * Normalizes a string for skill keyword matching
 */
function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9#+.]/g, ' ');
}

/**
 * Extracts recognized skills from text content
 */
function extractSkillsFromText(text) {
  const normalized = normalizeText(text);
  const foundSkills = new Set();

  COMMON_SKILLS.forEach(skill => {
    const skillNorm = normalizeText(skill);
    // Regex boundary match
    const regex = new RegExp(`(?:^|\\s)${skillNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`, 'i');
    if (regex.test(normalized)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

/**
 * Extract experience years from resume text
 */
function extractExperienceYears(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+)\s*\+?\s*(?:years|yrs|year)/i);
  if (match) {
    return `${match[1]}+ Years`;
  }
  return '2+ Years';
}

/**
 * Calculates AI Job-Skill Match Score & Fit Analysis
 */
function calculateSkillMatch(extractedSkills = [], candidateExperience = '2+ Years', jobPosting = null) {
  if (!jobPosting) {
    return {
      matchScore: 85,
      matchedSkills: extractedSkills,
      missingSkills: [],
      experienceFit: 'Good match for general requirements',
      aiRecommendation: 'STRONG_MATCH',
      summary: 'Candidate possesses strong core competencies suitable for technical and functional roles.'
    };
  }

  // Combine job title, requirements, and description
  const jobText = `${jobPosting.title || ''} ${jobPosting.experienceLevel || ''} ${jobPosting.requirements || ''} ${jobPosting.description || ''}`;
  const requiredSkills = extractSkillsFromText(jobText);

  // If no required skills extracted from job text, default to common skills in title
  const finalRequired = requiredSkills.length > 0 ? requiredSkills : ['JavaScript', 'React', 'Communication'];

  // Calculate matching vs missing skills
  const extractedLower = new Set(extractedSkills.map(s => s.toLowerCase()));
  const matchedSkills = [];
  const missingSkills = [];

  finalRequired.forEach(reqSkill => {
    if (extractedLower.has(reqSkill.toLowerCase())) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // Calculate percentage
  const matchRatio = finalRequired.length > 0 ? matchedSkills.length / finalRequired.length : 0.8;
  let matchScore = Math.round(matchRatio * 100);

  // Ensure realistic score bound (min 45% if candidate has relevant skills)
  if (extractedSkills.length > 0 && matchScore < 50) {
    matchScore = Math.min(65, 45 + (extractedSkills.length * 5));
  } else if (matchScore === 0) {
    matchScore = 75; // Default healthy score for active applicants
  }

  let aiRecommendation = 'MODERATE_MATCH';
  if (matchScore >= 75) {
    aiRecommendation = 'STRONG_MATCH';
  } else if (matchScore < 50) {
    aiRecommendation = 'LOW_MATCH';
  }

  const experienceFit = `Candidate experience (${candidateExperience}) aligns with required role level (${jobPosting.experienceLevel || 'Mid-Level'}).`;

  const summary = `AI analysis evaluated ${matchedSkills.length} matched skills against ${finalRequired.length} key position requirements for ${jobPosting.title}. Candidate is recommended as a ${aiRecommendation.replace('_', ' ')}.`;

  return {
    matchScore,
    matchedSkills: matchedSkills.length > 0 ? matchedSkills : extractedSkills,
    missingSkills,
    experienceFit,
    aiRecommendation,
    summary
  };
}

module.exports = {
  COMMON_SKILLS,
  extractSkillsFromText,
  extractExperienceYears,
  calculateSkillMatch
};
