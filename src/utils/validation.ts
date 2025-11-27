import * as Yup from 'yup';
import {
  DISPLAY_NAME_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  STUDY_GOAL_MIN_LENGTH,
  STUDY_GOAL_MAX_LENGTH,
  AVAILABLE_TIMES_MIN_COUNT,
  VALIDATION_MESSAGES,
} from '../constants/validation';

export const profileStep1Schema = Yup.object().shape({
  displayName: Yup.string()
    .min(DISPLAY_NAME_MIN_LENGTH, VALIDATION_MESSAGES.displayNameMin)
    .max(DISPLAY_NAME_MAX_LENGTH, VALIDATION_MESSAGES.displayNameMax)
    .required(VALIDATION_MESSAGES.displayNameRequired),
  studyGoal: Yup.string()
    .min(STUDY_GOAL_MIN_LENGTH, VALIDATION_MESSAGES.studyGoalMin)
    .max(STUDY_GOAL_MAX_LENGTH, VALIDATION_MESSAGES.studyGoalMax)
    .required(VALIDATION_MESSAGES.studyGoalRequired),
});

export const profileStep2Schema = Yup.object().shape({
  availableTimes: Yup.array()
    .of(Yup.string())
    .min(AVAILABLE_TIMES_MIN_COUNT, VALIDATION_MESSAGES.availableTimesRequired)
    .required(VALIDATION_MESSAGES.availableTimesRequired),
  learningStyle: Yup.string().required(VALIDATION_MESSAGES.learningStyleRequired),
});
