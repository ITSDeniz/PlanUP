import { useEffect, useId, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const STORAGE_KEY = "planup-tasks";

function createId() {
  return crypto.randomUUID();
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateKey) {
  if (!dateKey) return "No due date";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function TaskForm({
  label,
  placeholder,
  buttonLabel,
  initialValue = "",
  initialDate = "",
  showDate = false,
  compact = false,
  onSubmit,
  onCancel,
}) {
  const inputId = useId();
  const dateId = useId();
  const [title, setTitle] = useState(initialValue);
  const [dueDate, setDueDate] = useState(initialDate);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, dueDate);
    if (!initialValue) {
      setTitle("");
      setDueDate("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 ${
        compact ? "items-center" : "flex-col sm:flex-row sm:items-stretch"
      }`}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      {showDate ? (
        <div className="relative shrink-0 sm:w-44">
          <label className="sr-only" htmlFor={dateId}>
            Due date
          </label>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            id={dateId}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      ) : null}
      <button
        type="submit"
        aria-label={buttonLabel}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-teal-600 px-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!title.trim()}
      >
        {initialValue ? <Save size={16} /> : <Plus size={16} />}
        <span className="hidden sm:inline">{buttonLabel}</span>
      </button>
      {onCancel ? (
        <IconButton label="Cancel" onClick={onCancel}>
          <X size={18} />
        </IconButton>
      ) : null}
    </form>
  );
}

function ProgressBar({ completed, total }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div aria-label={`${percent}% complete`} className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          {completed}/{total} completed
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CalendarView({ tasks, monthDate, onChangeMonth }) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();
  const monthLabel = monthStart.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayKey = formatDateKey(new Date());
  const tasksByDate = tasks.reduce((groups, task) => {
    if (!task.dueDate) return groups;
    return { ...groups, [task.dueDate]: [...(groups[task.dueDate] || []), task] };
  }, {});
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Calendar</h2>
          <p className="text-sm text-slate-500">Tasks grouped by due date</p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <IconButton
            label="Previous month"
            onClick={() =>
              onChangeMonth(
                new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft size={18} />
          </IconButton>
          <p className="min-w-32 text-center text-sm font-semibold text-slate-800">
            {monthLabel}
          </p>
          <IconButton
            label="Next month"
            onClick={() =>
              onChangeMonth(
                new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-24 rounded-md" />;
          }

          const dateKey = formatDateKey(
            new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
          );
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className={`min-h-24 rounded-md border p-2 text-left ${
                isToday
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{day}</span>
                {dayTasks.length > 0 ? (
                  <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {dayTasks.length}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <p
                    key={task.id}
                    className="truncate rounded bg-white px-1.5 py-1 text-xs font-medium text-slate-700"
                    title={task.title}
                  >
                    {task.title}
                  </p>
                ))}
                {dayTasks.length > 2 ? (
                  <p className="text-xs font-medium text-slate-500">
                    +{dayTasks.length - 2} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SubtaskList({
  task,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
}) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
      <TaskForm
        label={`Add subtask for ${task.title}`}
        placeholder="Add a sub-task"
        buttonLabel="Add"
        compact
        onSubmit={(title) => onAddSubtask(task.id, title)}
      />

      <div className="mt-4 space-y-2">
        {task.subtasks.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm text-slate-500">
            No sub-tasks yet.
          </p>
        ) : (
          task.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <IconButton
                label={subtask.completed ? "Mark incomplete" : "Mark complete"}
                className={
                  subtask.completed
                    ? "bg-teal-50 text-teal-700 hover:text-teal-800"
                    : ""
                }
                onClick={() => onToggleSubtask(task.id, subtask.id)}
              >
                {subtask.completed ? <Check size={18} /> : <Circle size={18} />}
              </IconButton>

              {editingId === subtask.id ? (
                <div className="min-w-0 flex-1">
                  <TaskForm
                    label={`Edit ${subtask.title}`}
                    placeholder="Sub-task title"
                    buttonLabel="Save"
                    initialValue={subtask.title}
                    compact
                    onSubmit={(title) => {
                      onEditSubtask(task.id, subtask.id, title);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      subtask.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <IconButton
                    label="Edit sub-task"
                    onClick={() => setEditingId(subtask.id)}
                  >
                    <Edit3 size={17} />
                  </IconButton>
                  <IconButton
                    label="Delete sub-task"
                    className="hover:text-red-600"
                    onClick={() => onDeleteSubtask(task.id, subtask.id)}
                  >
                    <Trash2 size={17} />
                  </IconButton>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggleOpen,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const completedCount = (task.completed ? 1 : 0) + task.subtasks.filter((subtask) => subtask.completed).length;
  const totalCount = 1 + task.subtasks.length;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <IconButton
            label={task.completed ? "Mark incomplete" : "Mark complete"}
            className={`mt-0.5 ${
              task.completed ? "bg-teal-50 text-teal-700 hover:text-teal-800" : ""
            }`}
            onClick={() => onToggleTask(task.id)}
          >
            {task.completed ? <Check size={19} /> : <Circle size={19} />}
          </IconButton>

          <IconButton
            label={task.isOpen ? "Collapse sub-tasks" : "Expand sub-tasks"}
            className="mt-0.5"
            onClick={() => onToggleOpen(task.id)}
          >
            {task.isOpen ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
          </IconButton>

          {isEditing ? (
            <div className="min-w-0 flex-1">
              <TaskForm
                label={`Edit ${task.title}`}
                placeholder="Main task title"
                buttonLabel="Save"
                initialValue={task.title}
                initialDate={task.dueDate || ""}
                showDate
                compact
                onSubmit={(title, dueDate) => {
                  onEditTask(task.id, title, dueDate);
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <h2
                  className={`truncate text-base font-semibold sm:text-lg ${
                    task.completed ? "text-slate-400 line-through" : "text-slate-950"
                  }`}
                >
                  {task.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {task.subtasks.length} sub-task
                  {task.subtasks.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <CalendarDays size={14} />
                  {formatReadableDate(task.dueDate)}
                </p>
              </div>
              <IconButton label="Edit task" onClick={() => setIsEditing(true)}>
                <Edit3 size={18} />
              </IconButton>
              <IconButton
                label="Delete task"
                className="hover:text-red-600"
                onClick={() => onDeleteTask(task.id)}
              >
                <Trash2 size={18} />
              </IconButton>
            </>
          )}
        </div>

        <ProgressBar completed={completedCount} total={totalCount} />
      </div>

      {task.isOpen ? (
        <SubtaskList
          task={task}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ) : null}
    </article>
  );
}

function TaskList(props) {
  if (props.tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <ClipboardList className="mx-auto text-slate-400" size={38} />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          No main tasks yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Add a main task to start organizing your work into manageable sub-tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {props.tasks.map((task) => (
        <TaskCard key={task.id} task={task} {...props} />
      ))}
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalSubtasks = tasks.reduce((total, task) => total + task.subtasks.length, 0);
    const completedSubtasks = tasks.reduce(
      (total, task) =>
        total + task.subtasks.filter((subtask) => subtask.completed).length,
      0
    );
    return {
      totalTasks: tasks.length,
      completedTasks,
      totalSubtasks,
      completedSubtasks,
    };
  }, [tasks]);

  function addTask(title, dueDate) {
    setTasks((current) => [
      {
        id: createId(),
        title,
        dueDate,
        isOpen: true,
        completed: false,
        subtasks: [],
      },
      ...current,
    ]);
  }

  function editTask(taskId, title, dueDate) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, title, dueDate } : task
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  function toggleOpen(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, isOpen: !task.isOpen } : task
      )
    );
  }
  
  function toggleTask(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function addSubtask(taskId, title) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isOpen: true,
              subtasks: [
                ...task.subtasks,
                { id: createId(), title, completed: false },
              ],
            }
          : task
      )
    );
  }

  function toggleSubtask(taskId, subtaskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  }

  function editSubtask(taskId, subtaskId, title) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, title } : subtask
              ),
            }
          : task
      )
    );
  }

  function deleteSubtask(taskId, subtaskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
            }
          : task
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              PlanUP
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Task Manager
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-center shadow-sm sm:min-w-80">
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <p className="text-lg font-bold text-slate-950">{stats.totalTasks}</p>
              <p className="text-xs font-medium text-slate-500">Tasks</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <p className="text-lg font-bold text-slate-950">{stats.totalSubtasks}</p>
              <p className="text-xs font-medium text-slate-500">Sub-tasks</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <p className="text-lg font-bold text-slate-950">
                {stats.completedTasks + stats.completedSubtasks}
              </p>
              <p className="text-xs font-medium text-slate-500">Done</p>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <TaskForm
            label="Add main task"
            placeholder="Create a main task"
            buttonLabel="Add Task"
            showDate
            onSubmit={addTask}
          />
        </section>

        <CalendarView
          tasks={tasks}
          monthDate={calendarMonth}
          onChangeMonth={setCalendarMonth}
        />

        <TaskList
          tasks={tasks}
          onToggleOpen={toggleOpen}
          onToggleTask={toggleTask}
          onEditTask={editTask}
          onDeleteTask={deleteTask}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onEditSubtask={editSubtask}
          onDeleteSubtask={deleteSubtask}
        />
      </div>
    </main>
  );
}
