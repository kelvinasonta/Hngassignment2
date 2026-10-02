import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 32px',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: 'var(--primary)',
            fontFamily: 'var(--font-heading)',
            lineHeight: 1,
            marginBottom: '16px',
            letterSpacing: '2px',
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '12px',
          }}
        >
          Coordinate Not Found
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          The hardware component or page you are searching for has been relocated or is currently unallocated in our registry.
        </p>
        <Link
          href="/"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 28px',
            textDecoration: 'none',
          }}
        >
          Return to Hardware Catalog
        </Link>
      </div>
    </div>
  );
}
