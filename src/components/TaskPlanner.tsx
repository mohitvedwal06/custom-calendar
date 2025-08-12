import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, Search, X, Calendar, Clock, Tag, MoreHorizontal } from 'lucide-react';

// Type definitions
interface Task {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  category: TaskCategory;
  color: string;
}

type TaskCategory = 'todo' | 'inprogress' | 'review' | 'completed';

interface CategoryInfo {
  name: string;
  color: string;
}

interface NewTaskForm {
  title: string;
  category: TaskCategory;
}

type CategoryFilter = TaskCategory | 'all';
type TimeFilter = '1week' | '2weeks' | '3weeks' | 'all';

interface DragSelection {
  isSelecting: boolean;
  startDate: Date | null;
  endDate: Date | null;
  startCell: { row: number; col: number } | null;
  endCell: { row: number; col: number } | null;
}

interface TaskResize {
  isResizing: boolean;
  taskId: number | null;
  resizeType: 'start' | 'end' | null;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

interface TaskDrag {
  isDragging: boolean;
  taskId: number | null;
  offsetX: number;
  offsetY: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

const TaskPlanner: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 7, 1)); // August 2025
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Task 1",
      startDate: new Date(2025, 7, 12),
      endDate: new Date(2025, 7, 15),
      category: "inprogress" as TaskCategory,
      color: "#4A90E2"
    },
    {
      id: 2,
      title: "TASK 2",
      startDate: new Date(2025, 7, 17),
      endDate: new Date(2025, 7, 19),
      category: "todo" as TaskCategory,
      color: "#4A90E2"
    },
    {
      id: 3,
      title: "TASK 3",
      startDate: new Date(2025, 7, 14),
      endDate: new Date(2025, 7, 15),
      category: "review" as TaskCategory,
      color: "#4A90E2"
    },
    {
      id: 4,
      title: "TASK 4",
      startDate: new Date(2025, 7, 13),
      endDate: new Date(2025, 7, 14),
      category: "completed" as TaskCategory,
      color: "#4A90E2"
    },
    {
      id: 5,
      title: "TASK 5",
      startDate: new Date(2025, 7, 7),
      endDate: new Date(2025, 7, 7),
      category: "todo" as TaskCategory,
      color: "#4A90E2"
    },
    {
      id: 6,
      title: "TASK 6",
      startDate: new Date(2025, 7, 28),
      endDate: new Date(2025, 7, 28),
      category: "inprogress" as TaskCategory,
      color: "#4A90E2"
    }
  ]);
  
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilters, setCategoryFilters] = useState<Set<TaskCategory>>(new Set(['todo', 'inprogress', 'review', 'completed']));
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  
  const [dragSelection, setDragSelection] = useState<DragSelection>({
    isSelecting: false,
    startDate: null,
    endDate: null,
    startCell: null,
    endCell: null
  });

  const [taskResize, setTaskResize] = useState<TaskResize>({
    isResizing: false,
    taskId: null,
    resizeType: null,
    originalStartDate: null,
    originalEndDate: null
  });

  const [taskDrag, setTaskDrag] = useState<TaskDrag>({
    isDragging: false,
    taskId: null,
    offsetX: 0,
    offsetY: 0,
    originalStartDate: null,
    originalEndDate: null
  });
  
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    category: 'todo'
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  const categories: Record<TaskCategory, CategoryInfo> = {
    todo: { name: 'To Do', color: '#4A90E2' },
    inprogress: { name: 'In Progress', color: '#4A90E2' },
    review: { name: 'Review', color: '#4A90E2' },
    completed: { name: 'Completed', color: '#4A90E2' }
  };

  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Get calendar data
  const getCalendarData = (): Date[] => {
    const year: number = currentDate.getFullYear();
    const month: number = currentDate.getMonth();
    
    const firstDay: Date = new Date(year, month, 1);
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

  // Get cell position from date
  const getCellPosition = (date: Date, calendarDays: Date[]): { row: number; col: number } => {
    const index = calendarDays.findIndex(d => d.toDateString() === date.toDateString());
    return {
      row: Math.floor(index / 7),
      col: index % 7
    };
  };

  // Get date from cell position
  const getDateFromCell = (row: number, col: number, calendarDays: Date[]): Date => {
    const index = row * 7 + col;
    return calendarDays[index] || new Date();
  };

  // Get date from mouse position
  const getDateFromMousePosition = (e: MouseEvent | React.MouseEvent): Date | null => {
    if (!calendarRef.current) return null;

    const rect = calendarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = rect.width / 7;
    const cellHeight = rect.height / 6;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (col >= 0 && col < 7 && row >= 0 && row < 6) {
      const calendarDays = getCalendarData();
      return getDateFromCell(row, col, calendarDays);
    }

    return null;
  };

  // Get task position and width
  const getTaskStyle = (task: Task, weekStart: Date): { left: string; width: string; display: boolean } => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (task.endDate < weekStart || task.startDate > weekEnd) {
      return { left: '0%', width: '0%', display: false };
    }
    
    const taskStart = task.startDate < weekStart ? weekStart : task.startDate;
    const taskEnd = task.endDate > weekEnd ? weekEnd : task.endDate;
    
    const startDay = Math.floor((taskStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const left = (startDay / 7) * 100;
    const width = (duration / 7) * 100;
    
    return { 
      left: `${left}%`, 
      width: `${width}%`, 
      display: true 
    };
  };

  // Navigate months
  const navigateMonth = (direction: number): void => {
    const newDate: Date = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Handle mouse down for drag selection
  const handleMouseDown = (e: React.MouseEvent, date: Date, row: number, col: number): void => {
    if (e.button !== 0 || taskResize.isResizing || taskDrag.isDragging) return; // Only left click
    
    e.preventDefault();
    setDragSelection({
      isSelecting: true,
      startDate: date,
      endDate: date,
      startCell: { row, col },
      endCell: { row, col }
    });
  };

  // Handle mouse enter for drag selection
  const handleMouseEnter = (date: Date, row: number, col: number): void => {
    if (dragSelection.isSelecting && !taskResize.isResizing && !taskDrag.isDragging) {
      setDragSelection(prev => ({
        ...prev,
        endDate: date,
        endCell: { row, col }
      }));
    }
  };

  // Handle mouse up for drag selection
  const handleMouseUp = (): void => {
    if (dragSelection.isSelecting && dragSelection.startDate && dragSelection.endDate) {
      const startDate = dragSelection.startDate <= dragSelection.endDate ? dragSelection.startDate : dragSelection.endDate;
      const endDate = dragSelection.startDate <= dragSelection.endDate ? dragSelection.endDate : dragSelection.startDate;
      
      setNewTask(prev => ({ ...prev, title: '' }));
      setShowTaskModal(true);
      
      // Store the selected date range for task creation
      setDragSelection(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    }
  };

  // Handle task creation
  const createTask = (): void => {
    if (!newTask.title.trim() || !dragSelection.startDate || !dragSelection.endDate) return;
    
    const task: Task = {
      id: Date.now(),
      title: newTask.title.toUpperCase(),
      startDate: new Date(dragSelection.startDate),
      endDate: new Date(dragSelection.endDate),
      category: newTask.category,
      color: categories[newTask.category].color
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', category: 'todo' });
    setShowTaskModal(false);
    setDragSelection({
      isSelecting: false,
      startDate: null,
      endDate: null,
      startCell: null,
      endCell: null
    });
  };

  // Handle task drag start
  const handleTaskDragStart = (e: React.MouseEvent, taskId: number): void => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setTaskDrag({
      isDragging: true,
      taskId,
      offsetX,
      offsetY,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    });
  };

  // Handle task drag
  const handleTaskDrag = (e: MouseEvent): void => {
    if (!taskDrag.isDragging || !taskDrag.taskId || !taskDrag.originalStartDate || !taskDrag.originalEndDate) return;

    const newDate = getDateFromMousePosition(e);
    if (!newDate) return;

    const originalDuration = Math.floor((taskDrag.originalEndDate.getTime() - taskDrag.originalStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(newDate);
    newEndDate.setDate(newDate.getDate() + originalDuration);

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskDrag.taskId) {
        return { ...task, startDate: newDate, endDate: newEndDate };
      }
      return task;
    }));
  };

  // Handle task resize start
  const handleResizeStart = (e: React.MouseEvent, taskId: number, resizeType: 'start' | 'end'): void => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTaskResize({
      isResizing: true,
      taskId,
      resizeType,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    });
  };

  // Handle task resize
  const handleTaskResize = (e: MouseEvent): void => {
    if (!taskResize.isResizing || !taskResize.taskId) return;

    const date = getDateFromMousePosition(e);
    if (!date) return;

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskResize.taskId) {
        if (taskResize.resizeType === 'start') {
          return { ...task, startDate: date <= task.endDate ? date : task.endDate };
        } else {
          return { ...task, endDate: date >= task.startDate ? date : task.startDate };
        }
      }
      return task;
    }));
  };

  // Filter tasks
  const getFilteredTasks = (): Task[] => {
    return tasks.filter((task: Task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilters.has(task.category);
      
      let matchesTime = true;
      if (timeFilter !== 'all') {
        const now = new Date();
        const weeks = parseInt(timeFilter.replace('weeks', '').replace('week', ''));
        const filterDate = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
        matchesTime = task.startDate <= filterDate;
      }
      
      return matchesSearch && matchesCategory && matchesTime;
    });
  };

  // Handle category filter toggle
  const toggleCategoryFilter = (category: TaskCategory): void => {
    setCategoryFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(category)) {
        newFilters.delete(category);
      } else {
        newFilters.add(category);
      }
      return newFilters;
    });
  };

  // Get selection style for drag selection
  const getSelectionStyle = (date: Date, calendarDays: Date[]): string => {
    if (!dragSelection.isSelecting || !dragSelection.startDate || !dragSelection.endDate) return '';
    
    const selectionStart = dragSelection.startDate <= dragSelection.endDate ? dragSelection.startDate : dragSelection.endDate;
    const selectionEnd = dragSelection.startDate <= dragSelection.endDate ? dragSelection.endDate : dragSelection.startDate;
    
    if (date >= selectionStart && date <= selectionEnd) {
      return 'bg-blue-100 border-2 border-blue-300';
    }
    
    return '';
  };

  // Mouse event handlers for document
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (dragSelection.isSelecting) {
        handleMouseUp();
        setDragSelection(prev => ({ ...prev, isSelecting: false }));
      }
      if (taskResize.isResizing) {
        setTaskResize({
          isResizing: false,
          taskId: null,
          resizeType: null,
          originalStartDate: null,
          originalEndDate: null
        });
      }
      if (taskDrag.isDragging) {
        setTaskDrag({
          isDragging: false,
          taskId: null,
          offsetX: 0,
          offsetY: 0,
          originalStartDate: null,
          originalEndDate: null
        });
      }
    };

    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (dragSelection.isSelecting && calendarRef.current) {
        const rect = calendarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellWidth = rect.width / 7;
        const cellHeight = rect.height / 6;
        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);

        if (col >= 0 && col < 7 && row >= 0 && row < 6) {
          const calendarDays = getCalendarData();
          const date = getDateFromCell(row, col, calendarDays);
          handleMouseEnter(date, row, col);
        }
      }

      if (taskResize.isResizing) {
        handleTaskResize(e);
      }

      if (taskDrag.isDragging) {
        handleTaskDrag(e);
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('mousemove', handleDocumentMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
    };
  }, [dragSelection.isSelecting, taskResize.isResizing, taskDrag.isDragging, tasks, currentDate]);

  const calendarDays: Date[] = getCalendarData();
  const today: Date = new Date();
  
  // Group calendar days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[12]">
                <div className="p-4">
                  {/* Category Filters */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Category Filters</h3>
                    <div className="space-y-2">
                      {Object.entries(categories).map(([key, cat]: [string, CategoryInfo]) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={categoryFilters.has(key as TaskCategory)}
                            onChange={() => toggleCategoryFilter(key as TaskCategory)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time-based Filters */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Time-Based Filters</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All tasks' },
                        { value: '1week', label: 'Tasks within 1 week' },
                        { value: '2weeks', label: 'Tasks within 2 weeks' },
                        { value: '3weeks', label: 'Tasks within 3 weeks' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="timeFilter"
                            value={option.value}
                            checked={timeFilter === option.value}
                            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                            className="border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day: string, index: number) => {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            dayDate.setDate(dayDate.getDate() - dayDate.getDay() + index);
            
            return (
              <div key={day} className="p-3 text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">{day}</div>
                <div className={`text-sm ${dayDate.getDate() === 1 && dayDate.getMonth() !== currentDate.getMonth() ? 'text-blue-600' : 'text-gray-400'}`}>
                  {dayDate.getDate() === 1 && dayDate.getMonth() !== currentDate.getMonth() ? 
                    `${monthNames[dayDate.getMonth()].slice(0, 3)} ${dayDate.getDate()}` : 
                    dayDate.getDate()
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Weeks */}
        <div className="relative" ref={calendarRef}>
          {weeks.map((week: Date[], weekIndex: number) => (
            <div key={weekIndex} className="relative border-b border-gray-200 last:border-b-0">
              {/* Week Grid */}
              <div className="grid grid-cols-7 h-20">
                {week.map((date: Date, dayIndex: number) => {
                  const isToday = date.toDateString() === today.toDateString();
                  const isCurrentMonthDay = date.getMonth() === currentDate.getMonth();
                  const selectionStyle = getSelectionStyle(date, calendarDays);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-gray-200 last:border-r-0 p-2 cursor-crosshair hover:bg-gray-50 transition-colors relative select-none ${
                        !isCurrentMonthDay ? 'bg-gray-50' : ''
                      } ${selectionStyle}`}
                      onMouseDown={(e) => handleMouseDown(e, date, weekIndex, dayIndex)}
                      onMouseEnter={() => handleMouseEnter(date, weekIndex, dayIndex)}
                    >
                      <div className={`text-sm font-medium ${
                        isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 
                        isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Bars */}
              <div className="absolute inset-0 pointer-events-none">
                {filteredTasks.map((task: Task, taskIndex: number) => {
                  const style = getTaskStyle(task, week[0]);
                  if (!style.display) return null;

                  return (
                    <div
                      key={task.id}
                      className={`absolute pointer-events-auto group transition-opacity ${
                        taskDrag.isDragging && taskDrag.taskId === task.id ? 'opacity-75' : 'opacity-100'
                      }`}
                      style={{
                        left: style.left,
                        width: style.width,
                        top: `${28 + (taskIndex % 3) * 24}px`,
                        height: '20px',
                        backgroundColor: task.color,
                        borderRadius: '4px',
                        zIndex: taskDrag.isDragging && taskDrag.taskId === task.id ? 20 : 10,
                        cursor: taskDrag.isDragging && taskDrag.taskId === task.id ? 'grabbing' : 'grab'
                      }}
                      onMouseDown={(e) => handleTaskDragStart(e, task.id)}
                    >
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-blue-600 rounded-l z-30"
                        onMouseDown={(e) => handleResizeStart(e, task.id, 'start')}
                      />
                      
                      {/* Task content */}
                      <div className="text-white text-xs font-medium px-2 py-1 truncate pointer-events-none">
                        {task.title}
                      </div>
                      
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-blue-600 rounded-r z-30"
                        onMouseDown={(e) => handleResizeStart(e, task.id, 'end')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add New Task</h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setDragSelection({
                    isSelecting: false,
                    startDate: null,
                    endDate: null,
                    startCell: null,
                    endCell: null
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task name..."
                  autoFocus
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

              {dragSelection.startDate && dragSelection.endDate && (
                <div className="text-sm text-gray-600">
                  <strong>Selected dates:</strong> {dragSelection.startDate.toLocaleDateString()} - {dragSelection.endDate.toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setDragSelection({
                    isSelecting: false,
                    startDate: null,
                    endDate: null,
                    startCell: null,
                    endCell: null
                  });
                }}
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