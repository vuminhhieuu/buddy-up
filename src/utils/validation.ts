import * as Yup from 'yup';

export const profileStep1Schema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, 'profileSetup.displayNameMin')
    .max(50, 'profileSetup.displayNameMax')
    .required('profileSetup.displayNameRequired'),
  studyGoal: Yup.string()
    .min(5, 'profileSetup.studyGoalMin')
    .max(200, 'profileSetup.studyGoalMax')
    .required('profileSetup.studyGoalRequired'),
});
