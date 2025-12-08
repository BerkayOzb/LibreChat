import organizationSchema from '~/schema/organization';

/**
 * Creates or returns the Organization model using the provided mongoose instance and schema
 */
export function createOrganizationModel(mongoose: typeof import('mongoose')) {
    return mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
}
