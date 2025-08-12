import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, Search, X, Calendar, Clock, Tag } from 'lucide-react';

// Type definitions
interface Task {
  id: number;
  title: string;
  date: Date;
  time: string;
  category: TaskCategory;
  color: string;
}

type TaskCategory = 'work' | 'personal' | 'family' | 'health' | 'other';

interface CategoryInfo {
  name: string;
  color: string;
}

interface NewTaskForm {
  title: string;
  time: string;
  category: TaskCategory;
}

type CategoryFilter = TaskCategory | 'all';

const TaskPlanner: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(2025, 7, 15),
      time: "10:00 AM",
      category: "work" as TaskCategory,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Doctor Appointment",
      date: new Date(2025, 7, 18),
      time: "2:30 PM",
      category: "personal" as TaskCategory,
      color: "bg-green-500"
    },
    {
      id: 3,
      title: "Project Deadline",
      date: new Date(2025, 7, 22), 
      time: "11:59 PM",
      category: "work" as TaskCategory,
      color: "bg-red-500"
    }
  ]);
  
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    time: '',
    category: 'work'
  });

  const categories: Record<TaskCategory, CategoryInfo> = {
    work: { name: 'Work', color: 'bg-blue-500' },
    personal: { name: 'Personal', color: 'bg-green-500' },
    family: { name: 'Family', color: 'bg-yellow-500' },
    health: { name: 'Health', color: 'bg-red-500' },
    other: { name: 'Other', color: 'bg-purple-500' }
  };

  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get calendar data
  const getCalendarData = (): Date[] => {
    const year: number = currentDate.getFullYear();
    const month: number = currentDate.getMonth();
    
    const firstDay: Date = new Date(year, month, 1);
    const lastDay: Date = new Date(year, month + 1, 0);
    const startDate: Date = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const currentDay: Date = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Filter tasks
  const getFilteredTasks = (): Task[] => {
    return tasks.filter((task: Task) => {
      const matchesSearch: boolean = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory: boolean = categoryFilter === 'all' || task.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const filteredTasks: Task[] = getFilteredTasks();
    return filteredTasks.filter((task: Task) => 
      task.date.toDateString() === date.toDateString()
    );
  };

  // Navigate months
  const navigateMonth = (direction: number): void => {
    const newDate: Date = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Handle task creation
  const createTask = (): void => {
    if (!newTask.title.trim() || !selectedDate) return;
    
    const task: Task = {
      id: Date.now(),
      title: newTask.title,
      date: new Date(selectedDate),
      time: newTask.time || '12:00 PM',
      category: newTask.category,
      color: categories[newTask.category].color
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', time: '', category: 'work' });
    setShowTaskModal(false);
    setSelectedDate(null);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task): void => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date): void => {
    e.preventDefault();
    if (!draggedTask) return;
    
    const updatedTasks: Task[] = tasks.map((task: Task) => 
      task.id === draggedTask.id 
        ? { ...task, date: new Date(date) }
        : task
    );
    
    setTasks(updatedTasks);
    setDraggedTask(null);
  };

  // Handle date click
  const handleDateClick = (date: Date): void => {
    setSelectedDate(date);
    setShowTaskModal(true);
  };

  // Delete task
  const deleteTask = (taskId: number): void => {
    setTasks(tasks.filter((task: Task) => task.id !== taskId));
  };

  const calendarDays: Date[] = getCalendarData();
  const today: Date = new Date();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Category</div>
                  <select
                    value={categoryFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value as CategoryFilter)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(categories).map(([key, cat]: [string, CategoryInfo]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day: string) => (
            <div key={day} className="p-4 text-sm font-medium text-gray-600 text-center bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date: Date, index: number) => {
            const isCurrentMonth: boolean = date.getMonth() === currentDate.getMonth();
            const isToday: boolean = date.toDateString() === today.toDateString();
            const dayTasks: Task[] = getTasksForDate(date);
            
            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, date)}
                onClick={() => handleDateClick(date)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task: Task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, task)}
                      className={`${task.color} text-white text-xs p-1 rounded cursor-move hover:opacity-80 transition-opacity`}
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                      <div className="truncate">{task.title}</div>
                      <div className="text-xs opacity-75">{task.time}</div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 p-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Add Task for {selectedDate?.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={newTask.time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newTask.category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTask({...newTask, category: e.target.value as TaskCategory})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(categories).map(([key, cat]: [string, CategoryInfo]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPlanner;