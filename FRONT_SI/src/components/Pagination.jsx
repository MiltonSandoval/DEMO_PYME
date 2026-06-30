import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Componente de paginación reutilizable.
 * Se integra con el diseño Firebase del proyecto (tema oscuro, gradiente rojo/amarillo).
 *
 * Props:
 *  - page         {number}   Página actual (1-indexed)
 *  - totalPages   {number}   Total de páginas
 *  - totalItems   {number}   Total de registros
 *  - pageSize     {number}   Registros por página
 *  - onPageChange {Function} Callback(newPage)
 *  - onPageSizeChange {Function} Callback(newSize) — opcional
 *  - pageSizeOptions {Array}  Opciones del selector, default [10, 15, 25, 50]
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
}) {
  if (totalPages <= 0) return null;

  // Generar la lista de páginas a mostrar (con elipsis)
  const buildPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (page <= 4) {
      // Inicio: 1 2 3 4 5 ... last
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 3) {
      // Final: 1 ... last-4 last-3 last-2 last-1 last
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      // Medio: 1 ... page-1 page page+1 ... last
      pages.push(1);
      pages.push('...');
      pages.push(page - 1);
      pages.push(page);
      pages.push(page + 1);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = buildPages();

  // Calcular rango de registros mostrados
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-container">
      {/* Info lado izquierdo */}
      <div className="pagination-info">
        <span>
          Mostrando <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> registros
        </span>
      </div>

      {/* Controles centro/derecha */}
      <div className="flex items-center gap-sm">
        {/* Selector de tamaño de página */}
        {onPageSizeChange && (
          <div className="pagination-page-size">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Volver a página 1 al cambiar tamaño
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="pagination-controls">
          {/* Ir al inicio */}
          <button
            className="pagination-btn nav-btn"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            title="Primera página"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Página anterior */}
          <button
            className="pagination-btn nav-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            title="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Números de página */}
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="pagination-dots">…</span>
            ) : (
              <button
                key={p}
                className={`pagination-btn${p === page ? ' active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}

          {/* Página siguiente */}
          <button
            className="pagination-btn nav-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            title="Página siguiente"
          >
            <ChevronRight size={14} />
          </button>

          {/* Ir al final */}
          <button
            className="pagination-btn nav-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            title="Última página"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
