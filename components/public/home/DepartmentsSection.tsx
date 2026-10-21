import { DepartmentCard } from "@/components/public/DepartmentCard";
import { DEPARTMENTS, departmentPath } from "@/lib/store/departments";
import { SectionHeading } from "./SectionHeading";

/**
 * Departments grid. On phones it is a horizontal swipe row (the next card peeks out to show there is more)
 * instead of full-width cards stacked.
 */
export function DepartmentsSection() {
  return (
    <section id="rayons" aria-labelledby="rayons-title" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="rayons-title"
        eyebrow="Nos rayons"
        title="Tout pour vos courses du quotidien"
        description="Une sélection rigoureuse pour régaler toute la famille, au meilleur prix."
      />
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {DEPARTMENTS.map((department) => (
          <li key={department.slug} className="w-[82%] shrink-0 snap-start sm:w-auto">
            <DepartmentCard
              title={department.title}
              description={department.summary}
              image={department.image}
              badge={department.badge}
              highlights={department.highlights}
              href={departmentPath(department.slug)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
