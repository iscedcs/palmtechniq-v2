type Lesson = {
  id: string;
  title: string;
  duration?: number; // seconds
  [k: string]: any;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
  [k: string]: any;
};

type CourseForHeader = {
  id: string;
  title: string;
  modules: Module[];
  tutor?: { user?: { name?: string; image?: string } } | null;
  [k: string]: any;
};

type IUndoToastOptions = {
  message: string;
  undoLabel?: string;
  dismissLabel?: string;
  onUndo: () => Promise<void> | void;
};
