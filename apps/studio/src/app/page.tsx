import Link from 'next/link';

import { getCatalog } from '@/lib/catalog';
import { formatBytes } from '@/lib/format';

export default async function HomePage() {
  const templates = await getCatalog();

  return (
    <>
      <section className="hero">
        <h1>Forge a project in seconds.</h1>
        <p>
          ForgeKit Studio turns curated templates into working projects. Pick a template, tune its
          options, preview every generated file and download the result as a zip — no install
          required.
        </p>
      </section>

      <section className="grid" aria-label="Templates">
        {templates.map((template) => (
          <article className="card" key={template.id}>
            <span className="badge">{template.category}</span>
            <h2>{template.name}</h2>
            <p>{template.summary}</p>

            <div className="meta">
              <span>{template.fileCount} files</span>
              <span>{formatBytes(template.totalBytes)}</span>
              <span>v{template.templateVersion}</span>
            </div>

            {template.tags.length > 0 && (
              <div className="tags">
                {template.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Link className="button" href={`/build/${template.id}`}>
              Configure &amp; download
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
