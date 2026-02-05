import { ABSTRACT_WORDS } from "./words/abstract-advanced-concepts.v2.words";
import { DAILY_LIFE_WORDS } from "./words/daily-life-routine.beginner.words";
import { EDUCATION_WORDS } from "./words/education-learning.words";
import { EMOTIONS_WORDS } from "./words/emotions-personality.beginner.words";
import { FOOD_WORDS } from "./words/food-cooking-dining.extended.words";
import { HEALTH_WORDS } from "./words/health-lifestyle.words";
import { NATURE_WORDS } from "./words/nature-environment.v2.words";
import { TECHNOLOGY_WORDS } from "./words/technology-internet.words";
import { TRAVEL_WORDS } from "./words/travel-transportation.words";
import { WORK_WORDS } from "./words/work-office-life.beginner.words";

export const CATEGORY_WORDS = {
  daily_life: DAILY_LIFE_WORDS,
  emotions: EMOTIONS_WORDS,
  work: WORK_WORDS,
  education: EDUCATION_WORDS,
  travel: TRAVEL_WORDS,
  health: HEALTH_WORDS,
  technology: TECHNOLOGY_WORDS,
  food: FOOD_WORDS,
  nature: NATURE_WORDS,
  sports: [],
  abstract: ABSTRACT_WORDS,
} as const;
