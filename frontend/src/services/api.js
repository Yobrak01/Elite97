const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('elite97_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('elite97_token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    throw new Error(errorData.message || 'Something went wrong.');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },
    register: async (name, email, password, country, university, major, yearOfStudy, currentSemester) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, country, university, major, yearOfStudy, currentSemester })
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateSettings: async (data) => {
      const res = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },
  tasks: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_URL}/tasks?${queryParams}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (taskData) => {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });
      return handleResponse(res);
    },
    createBulk: async (tasksArray) => {
      const res = await fetch(`${API_URL}/tasks/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tasks: tasksArray })
      });
      return handleResponse(res);
    },
    update: async (id, taskData) => {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    complete: async (id) => {
      const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    start: async (id) => {
      const res = await fetch(`${API_URL}/tasks/${id}/start`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_URL}/tasks/stats`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  sessions: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/sessions`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (sessionData) => {
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(sessionData)
      });
      return handleResponse(res);
    },
    getToday: async () => {
      const res = await fetch(`${API_URL}/sessions/today`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  schedule: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/schedule`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (scheduleData) => {
      const res = await fetch(`${API_URL}/schedule`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(scheduleData)
      });
      return handleResponse(res);
    },
    update: async (id, scheduleData) => {
      const res = await fetch(`${API_URL}/schedule/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(scheduleData)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/schedule/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    activate: async (id) => {
      const res = await fetch(`${API_URL}/schedule/${id}/activate`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getActive: async () => {
      const res = await fetch(`${API_URL}/schedule/active`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    generateTemplate: async (dayType) => {
      const res = await fetch(`${API_URL}/schedule/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ dayType })
      });
      return handleResponse(res);
    }
  },
  analytics: {
    getDashboard: async () => {
      const res = await fetch(`${API_URL}/analytics/dashboard`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getWeekly: async () => {
      const res = await fetch(`${API_URL}/analytics/weekly`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getBurnout: async () => {
      const res = await fetch(`${API_URL}/analytics/burnout`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getTrends: async () => {
      const res = await fetch(`${API_URL}/analytics/trends`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    calculate: async () => {
      const res = await fetch(`${API_URL}/analytics/recalculate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getGpa: async () => {
      const res = await fetch(`${API_URL}/analytics/gpa`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getMitRanking: async () => {
      const res = await fetch(`${API_URL}/analytics/mit-ranking`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getHierarchy: async () => {
      const res = await fetch(`${API_URL}/analytics/hierarchy`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getGlobalFeed: async () => {
      const res = await fetch(`${API_URL}/analytics/feed`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getOracleData: async () => {
      const res = await fetch(`${API_URL}/analytics/oracle`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  planner: {
    getDaily: async () => {
      const res = await fetch(`${API_URL}/planner/daily`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    generate: async () => {
      const res = await fetch(`${API_URL}/planner/generate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getRecommendations: async () => {
      const res = await fetch(`${API_URL}/planner/recommendations`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    switchMode: async (studyMode) => {
      const res = await fetch(`${API_URL}/planner/mode`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ studyMode })
      });
      return handleResponse(res);
    }
  },
  courses: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/courses`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (courseData) => {
      const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(courseData)
      });
      return handleResponse(res);
    },
    update: async (id, courseData) => {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(courseData)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    uploadSyllabus: async (id, file) => {
      const formData = new FormData();
      formData.append('syllabus', file);
      
      const token = localStorage.getItem('elite97_token');
      const res = await fetch(`${API_URL}/courses/${id}/syllabus`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });
      return handleResponse(res);
    }
  },
  tracker: {
    startTimer: async (data) => {
      const res = await fetch(`${API_URL}/tracker/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    stopTimer: async (id) => {
      const res = await fetch(`${API_URL}/tracker/${id}/stop`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    breachOverride: async (id) => {
      const res = await fetch(`${API_URL}/tracker/${id}/breach`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    completeOverride: async (id) => {
      const res = await fetch(`${API_URL}/tracker/${id}/complete`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    manualLog: async (data) => {
      const res = await fetch(`${API_URL}/tracker/manual`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    getTodayLogs: async () => {
      const res = await fetch(`${API_URL}/tracker/today`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getWeeklySummary: async () => {
      const res = await fetch(`${API_URL}/tracker/weekly`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  life: {
    getWeeklyWorkout: async () => {
      const res = await fetch(`${API_URL}/life/workout/weekly`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    regenerateWeeklyWorkout: async () => {
      const res = await fetch(`${API_URL}/life/workout/regenerate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getTodayWorkout: async () => {
      const res = await fetch(`${API_URL}/life/workout/today`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    completeExercise: async (workoutId, exerciseIndex) => {
      const res = await fetch(`${API_URL}/life/workout/${workoutId}/exercise`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ exerciseIndex })
      });
      return handleResponse(res);
    },
    getTodayMeal: async () => {
      const res = await fetch(`${API_URL}/life/meal/today`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    regenerateMeal: async () => {
      const res = await fetch(`${API_URL}/life/meal/regenerate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getCircadianStatus: async () => {
      const res = await fetch(`${API_URL}/life/circadian-status`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    establishAnchor: async () => {
      const res = await fetch(`${API_URL}/life/circadian-anchor`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getTodayRoutine: async () => {
      const res = await fetch(`${API_URL}/life/routine/today`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
export default api;
