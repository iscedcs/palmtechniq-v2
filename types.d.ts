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

type CourseItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: string;
  tutor?: { user?: { name?: string; image?: string | null } };
  tags: { id: string; name: string }[];
  averageRating?: number;
  totalStudents?: number;
  price: number;
  currentPrice: number | null;
  previewVideo: string;
  groupBuyingEnabled: boolean;
  enrollments?: number;
  basePrice: number;
  currentPrice: number;
  demandLevel?: string | null;
  discount: number | null;
  duration: number | null;
  demandLevel?: string;
  flashSaleEnd?: Date | null;
  isFlashSale?: boolean;
};
