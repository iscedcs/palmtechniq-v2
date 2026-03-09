import { fetchDemoCourseData } from "@/data/demo-course";
import { InteractiveDemo } from "./interactive-demo";

export async function DemoSection() {
  const demoData = await fetchDemoCourseData();

  if (!demoData) {
    // Fallback: Show the interactive demo section header but indicate data unavailable
    return (
      <section id="demo-section" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Experience</span>{" "}
              <span className="text-gradient">Learning</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create a course titled "Ethical Hacking" with lessons to see the interactive demo in action.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <InteractiveDemo data={demoData} />;
}
