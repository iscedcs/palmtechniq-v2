import { useFormContext } from "react-hook-form";

export function useCourseCompletion() {
  const form = useFormContext();
  const values = form.watch();

  const checks = {
    title: !!values.title,
    description: !!values.description,
    category: !!values.category,
    level: !!values.level,
    thumbnail: !!values.thumbnail,
    previewVideo: !!values.previewVideo,
    modules: values.modules?.length > 0,
    lessons: values.modules?.some((m: any) => m.lessons?.length >= 3),
    basePrice: !!values.basePrice,
    settings: values.certificate || values.allowDiscussions,
  };

  const total = Object.keys(checks).length;
  const completed = Object.values(checks).filter(Boolean).length;

  const completion = Math.round((completed / total) * 100);

  const missing = Object.entries(checks)
    .filter(([_, v]) => !v)
    .map(([key]) => key);

  const stageHints = missing.map((k) => {
    switch (k) {
      case "modules":
        return "Add at least one module";
      case "lessons":
        return "Each module should have 3+ lessons";
      case "thumbnail":
        return "Upload a course thumbnail";
      case "basePrice":
        return "Set your course pricing";
      default:
        return `Complete your ${k.replace(/([A-Z])/g, " $1")}`;
    }
  });

  return { completion, stageHints };
}
