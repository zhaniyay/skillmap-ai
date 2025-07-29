import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getAllProgress, saveProgress, deleteProgress, renameProgress, toggleStep as apiToggleStep, uploadResume } from '../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

// Initial state
const initialState = {
  // Authentication
  isAuthenticated: false,
  username: '',
  
  // UI State
  loading: false,
  showNewGoalModal: false,
  
  // Goals and Progress
  goals: [],
  selectedGoalId: null,
  result: null,
  goal: '',
  
  // Editing state
  editingGoalId: null,
  editingGoalValue: '',
};

// Action types
const ActionTypes = {
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_LOADING: 'SET_LOADING',
  SET_GOALS: 'SET_GOALS',
  SET_SELECTED_GOAL: 'SET_SELECTED_GOAL',
  SET_RESULT: 'SET_RESULT',
  SET_GOAL: 'SET_GOAL',
  SET_SHOW_NEW_GOAL_MODAL: 'SET_SHOW_NEW_GOAL_MODAL',
  SET_EDITING_GOAL: 'SET_EDITING_GOAL',
  ADD_GOAL: 'ADD_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  TOGGLE_STEP: 'TOGGLE_STEP',
  LOGOUT: 'LOGOUT',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        username: action.payload.username || '',
      };
    
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_GOALS:
      console.log('🔄 SET_GOALS reducer - Previous goals:', state.goals);
      console.log('🔄 SET_GOALS reducer - New goals payload:', action.payload);
      const newState = { ...state, goals: action.payload };
      console.log('🔄 SET_GOALS reducer - Updated state goals:', newState.goals);
      return newState;
    
    case ActionTypes.SET_SELECTED_GOAL:
      return { ...state, selectedGoalId: action.payload };
    
    case ActionTypes.SET_RESULT:
      return { ...state, result: action.payload };
    
    case ActionTypes.SET_GOAL:
      return { ...state, goal: action.payload };
    
    case ActionTypes.SET_SHOW_NEW_GOAL_MODAL:
      return { ...state, showNewGoalModal: action.payload };
    
    case ActionTypes.SET_EDITING_GOAL:
      return {
        ...state,
        editingGoalId: action.payload.id,
        editingGoalValue: action.payload.value,
      };
    
    case ActionTypes.ADD_GOAL:
      return {
        ...state,
        goals: [action.payload, ...state.goals],
        selectedGoalId: action.payload.id,
        goal: action.payload.goal,
        result: {
          roadmap: action.payload.roadmap,
          recommended_courses: action.payload.recommended_courses || [],
          cv_assessment: action.payload.cv_assessment,
          skill_gaps: action.payload.skill_gaps,
          learning_path: action.payload.learning_path,
          cv_tips: action.payload.cv_tips,
        },
      };
    
    case ActionTypes.UPDATE_GOAL:
      return {
        ...state,
        goals: state.goals.map(g => 
          g.id === action.payload.id ? action.payload : g
        ),
        goal: state.selectedGoalId === action.payload.id ? action.payload.goal : state.goal,
      };
    
    case ActionTypes.DELETE_GOAL:
      const newGoals = state.goals.filter(g => g.id !== action.payload);
      const wasSelected = state.selectedGoalId === action.payload;
      return {
        ...state,
        goals: newGoals,
        selectedGoalId: wasSelected ? (newGoals[0]?.id || null) : state.selectedGoalId,
        goal: wasSelected ? (newGoals[0]?.goal || '') : state.goal,
        result: wasSelected ? null : state.result,
      };
    
    case ActionTypes.TOGGLE_STEP:
      if (state.selectedGoalId === action.payload.goalId) {
        return {
          ...state,
          goals: state.goals.map(g => 
            g.id === action.payload.goalId 
              ? { ...g, completed_steps: action.payload.completedSteps }
              : g
          ),
          // Also update result.completed_steps so RoadmapView shows updated checkboxes
          result: state.result ? {
            ...state.result,
            completed_steps: action.payload.completedSteps
          } : state.result,
        };
      }
      return state;
    
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isAuthenticated: false,
      };
    
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Define fetchAllProgress function before useEffect
  const fetchAllProgress = async () => {
    try {
      const response = await getAllProgress();
      console.log('🔍 Full API response:', response); // Debug full response
      const data = response.data;
      console.log('📊 Fetched goals from API:', data); // Debug goals data
      console.log('📈 Number of goals:', data?.length); // Debug count
      console.log('🎯 Individual goals:', data?.map(g => ({ id: g.id, goal: g.goal }))); // Debug goal details
      
      dispatch({ type: ActionTypes.SET_GOALS, payload: data });
      console.log('✅ Goals dispatched to state'); // Debug dispatch
      
      if (data.length > 0) {
        const latestGoal = data[0];
        console.log('🏆 Latest goal selected:', latestGoal); // Debug selected goal
        console.log('🔍 Latest goal detailed structure:', {
          id: latestGoal.id,
          goal: latestGoal.goal,
          cv_assessment: latestGoal.cv_assessment,
          skill_gaps: latestGoal.skill_gaps,
          learning_path: latestGoal.learning_path,
          cv_tips: latestGoal.cv_tips,
          completed_steps: latestGoal.completed_steps,
          roadmap: latestGoal.roadmap
        });
        
        dispatch({ type: ActionTypes.SET_SELECTED_GOAL, payload: latestGoal.id });
        dispatch({ type: ActionTypes.SET_GOAL, payload: latestGoal.goal });
        
        const resultPayload = {
          roadmap: latestGoal.roadmap,
          cv_assessment: latestGoal.cv_assessment || '',
          skill_gaps: latestGoal.skill_gaps || [],
          learning_path: latestGoal.learning_path || [],
          cv_tips: latestGoal.cv_tips || [],
          completed_steps: latestGoal.completed_steps || [],
          recommended_courses: latestGoal.recommended_courses || [],
        };
        
        console.log('📤 Dispatching result payload:', resultPayload);
        
        dispatch({
          type: ActionTypes.SET_RESULT,
          payload: resultPayload
        });
      }
      
      return data; // Return the goals data
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
      toast.error('Failed to load your progress');
      return []; // Return empty array on error
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      dispatch({
        type: ActionTypes.SET_AUTHENTICATED,
        payload: { isAuthenticated: true, username: savedUsername }
      });
      fetchAllProgress();
    }
  }, []);

  // Action creators
  const actions = {
    // Authentication actions
    setAuthenticated: (isAuthenticated, username = '') => {
      dispatch({
        type: ActionTypes.SET_AUTHENTICATED,
        payload: { isAuthenticated, username }
      });
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      dispatch({ type: ActionTypes.LOGOUT });
    },

    // UI actions
    setLoading: (loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    },

    setShowNewGoalModal: (show) => {
      dispatch({ type: ActionTypes.SET_SHOW_NEW_GOAL_MODAL, payload: show });
    },

    // Goal management actions
    fetchAllProgress,

    selectGoal: (goalId) => {
      const goal = state.goals.find(g => g.id === goalId);
      if (goal) {
        console.log('🎯 Selecting goal:', goal.goal);
        console.log('📊 Goal data structure:', {
          hasRoadmap: !!goal.roadmap,
          hasCvAssessment: !!goal.cv_assessment,
          hasSkillGaps: !!goal.skill_gaps,
          hasLearningPath: !!goal.learning_path,
          hasCvTips: !!goal.cv_tips,
          learningPathLength: goal.learning_path ? (Array.isArray(goal.learning_path) ? goal.learning_path.length : 'not array') : 'undefined'
        });
        
        dispatch({ type: ActionTypes.SET_SELECTED_GOAL, payload: goalId });
        dispatch({ type: ActionTypes.SET_GOAL, payload: goal.goal });
        
        const resultPayload = {
          roadmap: goal.roadmap,
          recommended_courses: goal.recommended_courses || [],
          cv_assessment: goal.cv_assessment,
          skill_gaps: goal.skill_gaps,
          learning_path: goal.learning_path,
          cv_tips: goal.cv_tips,
        };
        
        console.log('📤 Dispatching SELECT result payload:', resultPayload);
        
        dispatch({
          type: ActionTypes.SET_RESULT,
          payload: resultPayload
        });
      }
    },

    addGoalFromResume: async (goal, file) => {
      actions.setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('goal', goal);

        // Upload resume and get AI-generated data
        const { data } = await uploadResume(formData);
        
        console.log('📊 Received structured roadmap data:', {
          cv_assessment: data.cv_assessment,
          skill_gaps: data.skill_gaps,
          learning_path: data.learning_path,
          cv_tips: data.cv_tips
        });
        
        // Convert roadmap string to array if needed (backend expects List[str])
        let roadmapArray;
        if (typeof data.roadmap === 'string') {
          // Split roadmap text by lines and clean up
          roadmapArray = data.roadmap
            .split('\n')
            .map(step => step.trim())
            .filter(step => step.length > 0);
        } else if (Array.isArray(data.roadmap)) {
          roadmapArray = data.roadmap;
        } else {
          // Fallback
          roadmapArray = [`Learn ${goal}`, 'Practice skills', 'Build projects', 'Get certified'];
        }
        
        console.log('🗺️ Roadmap array for saving:', roadmapArray);
        
        // Create progress data with structured roadmap fields
        const progressData = {
          goal,
          skills: data.extracted_skills || [],
          roadmap: roadmapArray,
          cv_assessment: data.cv_assessment || '',
          skill_gaps: data.skill_gaps || [],
          learning_path: data.learning_path || [],
          cv_tips: data.cv_tips || []
        };
        
        console.log('💾 Saving progress data:', progressData);
        
        // Save the progress with structured data
        const saveResponse = await saveProgress(
          progressData.goal,
          progressData.skills,
          progressData.roadmap,
          progressData.cv_assessment,
          progressData.skill_gaps,
          progressData.learning_path,
          progressData.cv_tips
        );
        
        // Refresh the goals list and update the UI
        const goals = await actions.fetchAllProgress();
        
        // Find and select the newly created goal
        if (goals && goals.length > 0) {
          const newGoal = goals.find(g => g.goal === goal) || goals[0];
          if (newGoal) {
            dispatch({
              type: ActionTypes.SET_SELECTED_GOAL,
              payload: newGoal.id
            });
            
            // Update the result with the structured roadmap data
            const newResultPayload = {
              roadmap: roadmapArray,
              cv_assessment: data.cv_assessment || '',
              skill_gaps: data.skill_gaps || [],
              learning_path: data.learning_path || [],
              cv_tips: data.cv_tips || [],
              completed_steps: newGoal.completed_steps || [],
              recommended_courses: data.recommended_courses || [],
              skills: data.extracted_skills || []
            };
            
            console.log('📤 Setting new result payload after goal creation:', newResultPayload);
            
            dispatch({
              type: ActionTypes.SET_RESULT,
              payload: newResultPayload
            });
          }
        }
        
        toast.success('Goal created successfully!');
        actions.setShowNewGoalModal(false);
      } catch (error) {
        console.error('Error creating goal:', error);
        toast.error(getErrorMessage(error) || 'Failed to create goal');
      } finally {
        actions.setLoading(false);
      }
    },

    deleteGoal: async (goalId) => {
      try {
        await deleteProgress(goalId);
        dispatch({ type: ActionTypes.DELETE_GOAL, payload: goalId });
        toast.success('Goal deleted successfully');
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete goal');
      }
    },

    renameGoal: async (goalId, newGoal) => {
      try {
        const { data } = await renameProgress(goalId, newGoal);
        dispatch({ type: ActionTypes.UPDATE_GOAL, payload: data });
        dispatch({ type: ActionTypes.SET_EDITING_GOAL, payload: { id: null, value: '' } });
        toast.success('Goal renamed successfully');
      } catch (error) {
        console.error('Error renaming goal:', error);
        toast.error('Failed to rename goal');
      }
    },

    toggleStep: async (stepIndex) => {
      if (!state.selectedGoalId) return;

      try {
        const selectedGoal = state.goals.find(g => g.id === state.selectedGoalId);
        const isCompleted = selectedGoal?.completed_steps?.includes(stepIndex);
        
        const { data } = await apiToggleStep(state.selectedGoalId, stepIndex, !isCompleted);
        
        dispatch({
          type: ActionTypes.TOGGLE_STEP,
          payload: {
            goalId: state.selectedGoalId,
            completedSteps: data.completed_steps,
          }
        });
      } catch (error) {
        console.error('Error toggling step:', error);
        toast.error('Failed to update step');
      }
    },

    startEditingGoal: (goalId, currentGoal) => {
      dispatch({
        type: ActionTypes.SET_EDITING_GOAL,
        payload: { id: goalId, value: currentGoal }
      });
    },

    cancelEditingGoal: () => {
      dispatch({
        type: ActionTypes.SET_EDITING_GOAL,
        payload: { id: null, value: '' }
      });
    },

    updateEditingGoalValue: (value) => {
      dispatch({
        type: ActionTypes.SET_EDITING_GOAL,
        payload: { id: state.editingGoalId, value }
      });
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
