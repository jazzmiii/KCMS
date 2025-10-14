const Joi = require('joi');

// Recruitment settings validation
const recruitmentSettingsSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  maxApplicationsPerStudent: Joi.number().min(1).max(10).optional(),
  allowCrossYearRecruitment: Joi.boolean().optional(),
  requireApprovalForMultipleClubs: Joi.boolean().optional(),
  autoApproveThreshold: Joi.number().min(0).optional()
});

// Event settings validation
const eventSettingsSchema = Joi.object({
  maxEventsPerClubPerMonth: Joi.number().min(1).optional(),
  budgetLimits: Joi.object({
    technical: Joi.number().min(0).optional(),
    cultural: Joi.number().min(0).optional(),
    sports: Joi.number().min(0).optional(),
    social: Joi.number().min(0).optional(),
    academic: Joi.number().min(0).optional(),
    default: Joi.number().min(0).optional()
  }).optional(),
  requireCoordinatorApproval: Joi.boolean().optional(),
  autoPublishThreshold: Joi.number().min(0).optional(),
  requireAdminApprovalThreshold: Joi.number().min(0).optional(),
  guestSpeakerApprovalRequired: Joi.boolean().optional()
});

// File upload settings validation
const fileUploadSettingsSchema = Joi.object({
  maxFileSizes: Joi.object({
    image: Joi.number().min(0).optional(),
    document: Joi.number().min(0).optional(),
    video: Joi.number().min(0).optional()
  }).optional(),
  allowedFormats: Joi.object({
    image: Joi.array().items(Joi.string()).optional(),
    document: Joi.array().items(Joi.string()).optional(),
    video: Joi.array().items(Joi.string()).optional()
  }).optional(),
  requireVirusScan: Joi.boolean().optional()
});

// Notification settings validation
const notificationSettingsSchema = Joi.object({
  email: Joi.object({
    enabled: Joi.boolean().optional(),
    fromName: Joi.string().optional(),
    fromEmail: Joi.string().email().optional(),
    replyTo: Joi.string().email().optional()
  }).optional(),
  sms: Joi.object({
    enabled: Joi.boolean().optional(),
    provider: Joi.string().valid('twilio', 'aws', 'custom').optional()
  }).optional(),
  types: Joi.object({
    eventReminders: Joi.boolean().optional(),
    recruitmentOpening: Joi.boolean().optional(),
    roleAssignment: Joi.boolean().optional(),
    coordinatorOverride: Joi.boolean().optional(),
    budgetApproval: Joi.boolean().optional(),
    membershipApproval: Joi.boolean().optional()
  }).optional(),
  reminderTiming: Joi.object({
    eventReminderDays: Joi.number().min(0).max(30).optional(),
    recruitmentClosingDays: Joi.number().min(0).max(30).optional()
  }).optional()
});

// Security settings validation
const securitySettingsSchema = Joi.object({
  session: Joi.object({
    timeout: Joi.number().min(300).max(86400).optional(), // 5 min to 24 hours
    extendOnActivity: Joi.boolean().optional()
  }).optional(),
  login: Joi.object({
    maxAttempts: Joi.number().min(3).max(10).optional(),
    lockoutDuration: Joi.number().min(300).max(3600).optional() // 5 min to 1 hour
  }).optional(),
  password: Joi.object({
    minLength: Joi.number().min(6).max(20).optional(),
    requireUppercase: Joi.boolean().optional(),
    requireLowercase: Joi.boolean().optional(),
    requireNumbers: Joi.boolean().optional(),
    requireSpecialChar: Joi.boolean().optional(),
    preventReuse: Joi.number().min(0).max(10).optional()
  }).optional(),
  twoFactorAuth: Joi.object({
    enabled: Joi.boolean().optional(),
    enforceForAdmins: Joi.boolean().optional()
  }).optional()
});

// Club settings validation
const clubSettingsSchema = Joi.object({
  maxMembersPerClub: Joi.number().min(10).max(500).optional(),
  minMembersToCreate: Joi.number().min(5).max(50).optional(),
  allowStudentClubCreation: Joi.boolean().optional(),
  requireCoordinatorAssignment: Joi.boolean().optional(),
  clubCategories: Joi.array().items(Joi.string()).optional()
});

// Academic year settings validation
const academicYearSettingsSchema = Joi.object({
  current: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(), // Format: 2024-2025
  startMonth: Joi.number().min(1).max(12).optional(),
  endMonth: Joi.number().min(1).max(12).optional()
});

// Accreditation settings validation
const accreditationSettingsSchema = Joi.object({
  institutionName: Joi.string().optional(),
  institutionCode: Joi.string().optional(),
  naacGrade: Joi.string().valid('A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D').optional(),
  nbaAccredited: Joi.boolean().optional(),
  criteriaMapping: Joi.object().optional()
});

// Full settings update schema
const updateSettingsSchema = Joi.object({
  recruitment: recruitmentSettingsSchema.optional(),
  events: eventSettingsSchema.optional(),
  fileUploads: fileUploadSettingsSchema.optional(),
  notifications: notificationSettingsSchema.optional(),
  security: securitySettingsSchema.optional(),
  clubs: clubSettingsSchema.optional(),
  academicYear: academicYearSettingsSchema.optional(),
  accreditation: accreditationSettingsSchema.optional()
}).min(1); // At least one field required

// Section parameter validation
const sectionParamSchema = Joi.object({
  section: Joi.string().valid(
    'recruitment',
    'events',
    'fileUploads',
    'notifications',
    'security',
    'clubs',
    'academicYear',
    'accreditation'
  ).required()
});

// Feature parameter validation
const featureParamSchema = Joi.object({
  feature: Joi.string().required()
});

// Category parameter validation
const categoryParamSchema = Joi.object({
  category: Joi.string().valid('technical', 'cultural', 'sports', 'social', 'academic', 'default').required()
});

module.exports = {
  updateSettings: updateSettingsSchema,
  updateRecruitmentSettings: recruitmentSettingsSchema,
  updateEventSettings: eventSettingsSchema,
  updateFileUploadSettings: fileUploadSettingsSchema,
  updateNotificationSettings: notificationSettingsSchema,
  updateSecuritySettings: securitySettingsSchema,
  updateClubSettings: clubSettingsSchema,
  updateAcademicYearSettings: academicYearSettingsSchema,
  updateAccreditationSettings: accreditationSettingsSchema,
  sectionParam: sectionParamSchema,
  featureParam: featureParamSchema,
  categoryParam: categoryParamSchema
};
