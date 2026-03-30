const repeat = (count) => Array.from({ length: count }, (_, index) => index);

export const SectionSkeleton = ({ rows = 4, compact = false }) => (
  <section className={`skeleton-panel ${compact ? 'compact' : ''}`}>
    <div className="skeleton-panel-head">
      <div className="skeleton-line line-sm"></div>
      <div className="skeleton-pill"></div>
    </div>
    <div className="skeleton-stack">
      {repeat(rows).map((index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-line line-md"></div>
          <div className="skeleton-line line-xs"></div>
        </div>
      ))}
    </div>
  </section>
);

const PageSkeleton = ({ statCount = 4, rows = 5, sidebar = true, compactSidebar = false }) => (
  <div className="page-skeleton animate-fade-in">
    <section className="skeleton-hero">
      <div className="skeleton-hero-copy">
        <div className="skeleton-line line-xs"></div>
        <div className="skeleton-line line-xl"></div>
        <div className="skeleton-line line-lg"></div>
        <div className="skeleton-line line-md"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button primary"></div>
      </div>
    </section>

    <section className="skeleton-stat-grid">
      {repeat(statCount).map((index) => (
        <article key={index} className="skeleton-stat-card">
          <div className="skeleton-icon"></div>
          <div className="skeleton-line line-sm"></div>
          <div className="skeleton-line line-md"></div>
        </article>
      ))}
    </section>

    <section className={`skeleton-content-grid ${sidebar ? '' : 'single'}`}>
      <SectionSkeleton rows={rows} />
      {sidebar ? (
        <div className="skeleton-stack">
          <SectionSkeleton rows={compactSidebar ? 3 : 4} compact />
          <SectionSkeleton rows={compactSidebar ? 3 : 4} compact />
        </div>
      ) : null}
    </section>
  </div>
);

export default PageSkeleton;
