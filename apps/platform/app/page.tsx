import { projectService } from "@/lib/db/services/projects";

export default async function PlatformHome() {
  const projects = await projectService.list();
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Platform scaffold</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">AccessForge AI</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">From accessibility issues to verified code fixes. The application shell and SQLite data layer are ready; the final product UI comes next.</p>
      <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-900/70 p-6" aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="text-xl font-semibold">Configured projects</h2>
        <ul className="mt-4 space-y-3">
          {projects.map((project) => <li key={project.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4"><strong>{project.name}</strong><span className="ml-3 text-sm text-slate-400">{project.projectType === "BUNDLED_DEMO" ? "Bundled demo — full repair workflow" : "External audit only"}</span></li>)}
        </ul>
      </section>
    </main>
  );
}
