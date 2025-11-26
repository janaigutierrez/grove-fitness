# Technical Debt & Refactoring Opportunities

## Large Files (>300 lines) - Priority Refactoring Needed

### Critical (>600 lines)
These files should be split into smaller, more focused components:

1. **ProgressScreen.js** (722 lines)
   - Refactor into: ProgressStats, WeightChart, AIAnalysis components
   - Extract data fetching logic to custom hook

2. **WorkoutScreen.js** (704 lines)
   - Split into: WorkoutList, WorkoutCalendar, WorkoutActions
   - Move workout creation to separate modal component

3. **AIChatScreen.js** (662 lines)
   - Extract PersonalitySelector to separate component
   - Create ChatMessage component
   - Move personality logic to custom hook

4. **ProfileScreen.js** (643 lines)
   - Split into: ProfileHeader, ProfileSettings, AvatarSection
   - Extract avatar upload logic to custom hook

### High Priority (500-600 lines)

5. **ActiveWorkoutScreen.js** (573 lines)
   - Split into: WorkoutHeader, ExerciseList, WorkoutControls
   - Extract timer logic to custom hook

6. **WeeklyScheduleScreen.js** (564 lines)
   - Extract DaySelector component
   - Create WorkoutPicker component

7. **DashboardScreen.js** (523 lines)
   - Split into: StatsCards, TodayWorkout, MotivationalQuotes
   - Extract stats calculation to utility

### Medium Priority (400-500 lines)

8. **OnboardingScreen.js** (464 lines)
   - Extract OnboardingStep component
   - Create QuickPrompts component

9. **ExerciseSelector.js** (424 lines)
   - Split into: ExerciseList, ExerciseSearch
   - Extract filtering logic to custom hook

10. **AIWorkoutGeneratorModal.js** (393 lines)
    - Extract QuickPrompts component
    - Simplify form logic

### Lower Priority (300-400 lines)

11. **api.js** (366 lines)
    - Split into: auth.api.js, workout.api.js, user.api.js, ai.api.js
    - Keep core fetchWithAuth in base api.js

12. **RegisterScreen.js** (351 lines)
    - Extract form validation logic
    - Create FormInput component

13. **WorkoutCompletionModal.js** (337 lines)
    - Split form sections into components

## Recommended Refactoring Pattern

For each large screen:
1. Extract data fetching → custom hooks (useWorkoutData, useUserStats, etc.)
2. Extract UI sections → separate components
3. Extract business logic → utility functions
4. Keep main screen file < 200 lines (just composition)

## Benefits of Refactoring

- **Maintainability**: Easier to find and fix bugs
- **Reusability**: Components can be used elsewhere
- **Testing**: Smaller units are easier to test
- **Performance**: Easier to optimize with React.memo
- **Collaboration**: Multiple devs can work on different files
